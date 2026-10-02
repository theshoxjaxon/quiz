import { asc, eq } from "drizzle-orm";
import { cookies } from "next/headers";
import { db } from "@/db";
import { questions, settings, students, submissions, teams } from "@/db/schema";
import { grade, QUIZ_MS, SUBMIT_GRACE_MS } from "./quiz";
import { byRank } from "./teams";

export const COOKIE = "quiz_token";
export const TEAMS_LOCK = "teamsLockedAt";

// When the teacher locked the teams (ISO string), or undefined if unlocked.
export const teamsLockedAt = async () =>
  (await db.select().from(settings).where(eq(settings.key, TEAMS_LOCK)).get())?.value;

export async function currentStudent() {
  const token = (await cookies()).get(COOKIE)?.value;
  return token ? await db.select().from(students).where(eq(students.token, token)).get() : undefined;
}

// Everything the teacher sees: questions (with answers), ranked students, teams.
// One batch = one round trip and one consistent snapshot.
// Per-category scores are recomputed from the stored answers with the same grade() used at submit time.
export async function getResults() {
  const [qs, rows, teamList] = await db.batch([
    db.select().from(questions).orderBy(asc(questions.id)),
    db
      .select({
        id: students.id,
        name: students.name,
        studentId: students.studentId,
        teamId: students.teamId,
        startedAt: students.startedAt,
        score: submissions.score,
        timeTakenSec: submissions.timeTakenSec,
        submittedAt: submissions.submittedAt,
        answers: submissions.answers,
      })
      .from(students)
      .leftJoin(submissions, eq(submissions.studentId, students.id)),
    db.select().from(teams).orderBy(asc(teams.id)),
  ]);
  const now = Date.now();
  return {
    questions: qs,
    maxByCategory: grade(qs, Object.fromEntries(qs.map((q) => [q.id, q.correctIndex]))).byCategory, // a perfect sheet
    students: rows.sort(byRank).map((s) => ({
      ...s,
      categoryScores: s.answers ? grade(qs, s.answers).byCategory : null,
      timedOut: !s.submittedAt && s.startedAt.getTime() + QUIZ_MS + SUBMIT_GRACE_MS < now,
    })),
    teams: teamList,
  };
}
