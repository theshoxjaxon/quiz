// npm run setup     -> create/upgrade the tables (migration files in drizzle/), then load questions + teams.
//                      Keeps students and submissions, so it's safe to re-run at any time, also on Turso.
// npm run db:reset  -> the same, and also deletes all students, submissions and the team lock.
//                      On a remote (Turso) database it refuses unless you add: -- --yes-wipe-remote
// The target is TURSO_DATABASE_URL when set (also read from .env.local), else the local quiz.db.
import { migrate } from "drizzle-orm/libsql/migrator";
import { client, db, dbUrl, isRemote } from "./index.ts";
import { questionBank } from "./questions.ts";
import { questions, settings, students, submissions, teams } from "./schema.ts";

const reset = process.argv.includes("--reset");
console.log(`Database: ${dbUrl} (${isRemote ? "remote" : "local file"})`);
if (reset && isRemote && !process.argv.includes("--yes-wipe-remote")) {
  console.error("Refusing to delete students and submissions on a remote database. Add --yes-wipe-remote if you mean it.");
  process.exit(1);
}

// Applies only migrations this database hasn't seen yet; throws (non-zero exit) on any error.
await migrate(db, { migrationsFolder: "drizzle" });
if (!isRemote) await client.execute("PRAGMA journal_mode = WAL"); // stored in the file: reads don't wait for writes

// One batch = one transaction: the questions are never missing, even halfway through.
await db.batch([
  db.delete(questions),
  db.insert(questions).values(questionBank),
  db
    .insert(teams)
    .values([1, 2, 3, 4, 5, 6].map((id) => ({ id, name: id === 1 ? "Team 1 (Varsity / Alpha)" : `Team ${id}` })))
    .onConflictDoNothing(),
  ...(reset ? [db.delete(submissions), db.delete(students), db.delete(settings)] : []),
]);

console.log(
  `Ready: ${questionBank.length} questions (${questionBank.reduce((sum, q) => sum + q.points, 0)} pts), 6 teams` +
    (reset ? "; students, submissions and the team lock cleared." : "."),
);
client.close();
