import { asc, eq } from "drizzle-orm";
import { NextResponse } from "next/server";
import { db } from "@/db";
import { questions, submissions } from "@/db/schema";
import { uz } from "@/lib/i18n/uz";
import { optionOrder, QUIZ_MS } from "@/lib/quiz";
import { currentStudent } from "@/lib/server";

// Questions WITHOUT correct answers, plus the server-authoritative time left.
// Question order is the same for everyone; option order is shuffled per student (stable across refreshes).
export async function GET() {
  const student = await currentStudent();
  if (!student) return NextResponse.json({ error: uz.errors.notRegistered }, { status: 401 });

  const submitted = await db().select({ id: submissions.id }).from(submissions).where(eq(submissions.studentId, student.id)).limit(1);
  if (submitted.length > 0) {
    return NextResponse.json({ submitted: true });
  }

  const qs = await db()
    .select({
      id: questions.id,
      category: questions.category,
      prompt: questions.prompt,
      code: questions.code,
      options: questions.options,
    })
    .from(questions)
    .orderBy(asc(questions.id));

  return NextResponse.json({
    studentId: student.id,
    name: student.name,
    remainingMs: Math.max(0, student.startedAt.getTime() + QUIZ_MS - Date.now()),
    questions: qs.map((q) => ({
      ...q,
      options: optionOrder(student.studentId, q.id, q.options.length).map((id) => ({ id, text: q.options[id] })),
    })),
  });
}
