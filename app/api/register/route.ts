import { randomUUID } from "node:crypto";
import { eq, type SQL } from "drizzle-orm";
import { NextResponse } from "next/server";
import { db } from "@/db";
import { students, submissions } from "@/db/schema";
import { uz } from "@/lib/i18n/uz";
import { cleanName, nameKey } from "@/lib/quiz";
import { COOKIE } from "@/lib/server";

const reject = (error: string) => NextResponse.json({ error }, { status: 409 });
const findStudent = async (where: SQL) => (await db().select().from(students).where(where).limit(1))[0];
const hasSubmitted = async (id: number) =>
  (await db().select({ id: submissions.id }).from(submissions).where(eq(submissions.studentId, id)).limit(1)).length > 0;

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

  // ON CONFLICT DO NOTHING (no target) covers every unique constraint, so concurrent duplicates can't
  // slip in, even across several server instances: the database decides, not this process.
  await db()
    .insert(students)
    .values({ name, nameKey: key, studentId, token: randomUUID(), startedAt: new Date() })
    .onConflictDoNothing();

  const student = await findStudent(eq(students.studentId, studentId));
  if (!student) {
    // Insert was skipped because the name is taken under another ID.
    const sameName = (await findStudent(eq(students.nameKey, key)))!;
    return reject((await hasSubmitted(sameName.id)) ? uz.errors.nameTakenSubmitted : uz.errors.nameTakenOtherId);
  }
  if (student.nameKey !== key) {
    return reject(uz.errors.idTakenOtherName);
  }
  if (await hasSubmitted(student.id)) {
    return reject(uz.errors.alreadySubmitted);
  }

  const res = NextResponse.json({ ok: true });
  res.cookies.set(COOKIE, student.token, {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24,
    secure: Boolean(process.env.VERCEL), // HTTPS there; plain http on the school network
  });
  return res;
}
