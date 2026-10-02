import { NextResponse } from "next/server";
import { db } from "@/db";
import { questions, submissions } from "@/db/schema";
import { uz } from "@/lib/i18n/uz";
import { grade, QUIZ_MS, SUBMIT_GRACE_MS } from "@/lib/quiz";
import { currentStudent } from "@/lib/server";

// Grades on the server by option ID (never display position) and stores the submission.
// The score is never sent back to the student. Late submissions are accepted up to
// SUBMIT_GRACE_MS past the deadline, which comes from the stored start time only.
export async function POST(req: Request) {
  const student = await currentStudent();
  if (!student) return NextResponse.json({ error: uz.errors.notRegistered }, { status: 401 });

  const now = new Date();
  if (now.getTime() > student.startedAt.getTime() + QUIZ_MS + SUBMIT_GRACE_MS) {
    return NextResponse.json({ error: uz.errors.submissionsClosed }, { status: 403 });
  }

  const body = await req.json().catch(() => null);
  const raw = body?.answers && typeof body.answers === "object" ? body.answers : {};
  const { answers, score } = grade(db.select().from(questions).all(), raw); // answers: questionId -> option ID

  const { changes } = db
    .insert(submissions)
    .values({
      studentId: student.id,
      answers,
      score,
      timeTakenSec: Math.round((now.getTime() - student.startedAt.getTime()) / 1000),
      submittedAt: now,
    })
    .onConflictDoNothing()
    .run();
  if (!changes) return NextResponse.json({ error: uz.errors.alreadySubmitted }, { status: 409 });

  return NextResponse.json({ ok: true });
}
