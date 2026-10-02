import { randomUUID } from "node:crypto";
import { eq } from "drizzle-orm";
import { NextResponse } from "next/server";
import { db } from "@/db";
import { students, submissions } from "@/db/schema";
import { uz } from "@/lib/i18n/uz";
import { cleanName, nameKey } from "@/lib/quiz";
import { COOKIE } from "@/lib/server";

const reject = (error: string) => NextResponse.json({ error }, { status: 409 });
const hasSubmitted = (id: number) =>
  !!db.select({ id: submissions.id }).from(submissions).where(eq(submissions.studentId, id)).get();

// One registration per student ID and per name (both unique in the DB).
// Same name + same ID resumes the unsubmitted session; any mismatch is rejected so two students
// can never end up sharing one session. The quiz clock starts at first registration.
export async function POST(req: Request) {
  const body = await req.json().catch(() => null);
  const name = cleanName(String(body?.name ?? ""));
  const studentId = String(body?.studentId ?? "").trim().toLowerCase();
  if (name.length < 2 || name.length > 80 || !studentId || studentId.length > 80) {
    return NextResponse.json({ error: uz.errors.invalidForm }, { status: 400 });
  }
  const key = nameKey(name);

  // ON CONFLICT DO NOTHING covers both unique columns, so concurrent duplicates can't slip in.
  db.insert(students)
    .values({ name, nameKey: key, studentId, token: randomUUID(), startedAt: new Date() })
    .onConflictDoNothing()
    .run();

  const student = db.select().from(students).where(eq(students.studentId, studentId)).get();
  if (!student) {
    // Insert was skipped because the name is taken under another ID.
    const sameName = db.select().from(students).where(eq(students.nameKey, key)).get()!;
    return reject(
      hasSubmitted(sameName.id)
        ? uz.errors.nameTakenSubmitted
        : uz.errors.nameTakenOtherId,
    );
  }
  if (student.nameKey !== key) {
    return reject(uz.errors.idTakenOtherName);
  }
  if (hasSubmitted(student.id)) {
    return reject(uz.errors.alreadySubmitted);
  }

  const res = NextResponse.json({ ok: true });
  res.cookies.set(COOKIE, student.token, { httpOnly: true, sameSite: "lax", path: "/", maxAge: 60 * 60 * 24 });
  return res;
}
