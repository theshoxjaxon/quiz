// Usage: node db/seed.ts            -> (re)load questions + teams, keep students
//        node db/seed.ts --reset    -> also wipe all students, submissions and the team lock
import { db } from "./index.ts";
import { questionBank } from "./questions.ts";
import { questions, settings, students, submissions, teams } from "./schema.ts";

db.transaction((tx) => {
  if (process.argv.includes("--reset")) {
    tx.delete(submissions).run();
    tx.delete(students).run();
    tx.delete(settings).run();
  }
  tx.delete(questions).run();
  tx.insert(questions).values(questionBank).run();
  tx.insert(teams)
    .values([1, 2, 3, 4, 5, 6].map((id) => ({ id, name: id === 1 ? "Team 1 (Varsity / Alpha)" : `Team ${id}` })))
    .onConflictDoNothing()
    .run();
});

console.log(`Seeded ${questionBank.length} questions (${questionBank.reduce((s, q) => s + q.points, 0)} pts) and 6 teams.`);
