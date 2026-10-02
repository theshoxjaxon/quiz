// npm run setup     -> create/upgrade the tables (migration files in drizzle/), then load questions + teams.
//                      Keeps students and submissions, so it's safe to re-run at any time.
// npm run db:reset  -> the same, and also deletes all students, submissions and the team lock.
//                      On a remote database (any Supabase project) it refuses unless you add: -- --yes-wipe-remote
// The target is DATABASE_URL (also read from .env.local).
import { migrate } from "drizzle-orm/postgres-js/migrator";
import { closeDb, databaseUrl, db } from "./index.ts";
import { questionBank } from "./questions.ts";
import { questions, settings, students, submissions, teams } from "./schema.ts";

const reset = process.argv.includes("--reset");
const { hostname, port, pathname } = new URL(databaseUrl()); // throws a how-to message if DATABASE_URL is missing
const remote = !["localhost", "127.0.0.1", "[::1]"].includes(hostname);
console.log(`Database: ${hostname}:${port || 5432}${pathname} (${remote ? "remote" : "local"})`); // never the password

if (reset && remote && !process.argv.includes("--yes-wipe-remote")) {
  console.error("Refusing to delete students and submissions on a remote database. Add --yes-wipe-remote if you mean it.");
  process.exit(1);
}

try {
  // Applies only migrations this database hasn't seen yet; throws (non-zero exit) on any error.
  await migrate(db(), { migrationsFolder: "drizzle" });

  // One transaction: the questions are never missing, even halfway through.
  await db().transaction(async (tx) => {
    await tx.delete(questions);
    await tx.insert(questions).values(questionBank);
    await tx
      .insert(teams)
      .values([1, 2, 3, 4, 5, 6].map((id) => ({ id, name: id === 1 ? "Team 1 (Varsity / Alpha)" : `Team ${id}` })))
      .onConflictDoNothing();
    if (reset) {
      await tx.delete(submissions); // before students: Postgres enforces the foreign keys
      await tx.delete(students);
      await tx.delete(settings);
    }
  });
} finally {
  await closeDb();
}

console.log(
  `Ready: ${questionBank.length} questions (${questionBank.reduce((sum, q) => sum + q.points, 0)} pts), 6 teams` +
    (reset ? "; students, submissions and the team lock cleared." : "."),
);
