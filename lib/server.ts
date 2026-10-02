import { asc, eq, sql } from "drizzle-orm";
import { cookies } from "next/headers";
import { db, type Tx } from "@/db";
import { questions, settings, students, submissions, teams } from "@/db/schema";
import { grade, QUIZ_MS, SUBMIT_GRACE_MS } from "./quiz";
import { byRank } from "./teams";

export const COOKIE = "quiz_token";
export const TEAMS_LOCK = "teamsLockedAt";

// When the teacher locked the teams (ISO string), or undefined if unlocked.
export async function teamsLockedAt(q: Tx | ReturnType<typeof db> = db()) {
  const [row] = await q.select().from(settings).where(eq(settings.key, TEAMS_LOCK)).limit(1);
  return row?.value;
}

// Team generation and lock/unlock each run inside this: a transaction that first takes a
// transaction-scoped advisory lock, so they never interleave, even across server instances.
// (Released at commit/rollback, which also makes it safe behind Supabase's transaction pooler.)
export function withTeamsMutex<T>(fn: (tx: Tx) => Promise<T>) {
  return db().transaction(async (tx) => {
    await tx.execute(sql`select pg_advisory_xact_lock(81142)`); // any fixed number, used only here
    return fn(tx);
  });
}

export async function currentStudent() {
  const token = (await cookies()).get(COOKIE)?.value;
  if (!token) return undefined;
  const [student] = await db().select().from(students).where(eq(students.token, token)).limit(1);
  return student;
}

// Everything the teacher sees: questions (with answers), ranked students, teams.
// Read in one read-only snapshot, so the three lists always agree with each other.
// Per-category scores are recomputed from the stored answers with the same grade() used at submit time.
export async function getResults() {
  const [qs, rows, teamList] = await db().transaction(
    async (tx) => [
      await tx.select().from(questions).orderBy(asc(questions.id)),
      await tx
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
      await tx.select().from(teams).orderBy(asc(teams.id)),
    ] as const,
    { isolationLevel: "repeatable read", accessMode: "read only" },
  );
  const now = Date.now();
  return {
    questions: qs,
    maxByCategory: grade(qs, Object.fromEntries(qs.map((q) => [q.id, q.correctIndex]))).byCategory, // a perfect sheet
    students: [...rows].sort(byRank).map((s) => ({
      ...s,
      categoryScores: s.answers ? grade(qs, s.answers).byCategory : null,
      timedOut: !s.submittedAt && s.startedAt.getTime() + QUIZ_MS + SUBMIT_GRACE_MS < now,
    })),
    teams: teamList,
  };
}
