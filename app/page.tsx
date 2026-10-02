import { BrainCircuit, Clock, ListChecks, ShieldCheck } from "lucide-react";
import { count } from "drizzle-orm";
import { db } from "@/db";
import { questions } from "@/db/schema";
import { uz } from "@/lib/i18n/uz";
import { QUIZ_MS } from "@/lib/quiz";
import RegisterForm from "./register-form";

export const dynamic = "force-dynamic"; // the question count comes from the database

export default async function Home() {
  const t = uz.register;
  const minutes = QUIZ_MS / 60_000;
  const questionCount = (await db.select({ n: count() }).from(questions).get())?.n ?? 0;
  const facts = [
    [ListChecks, t.questionCount(questionCount)],
    [Clock, t.minutes(minutes)],
    [ShieldCheck, t.oneAttempt],
  ] as const;

  return (
    <main className="flex flex-1 items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="mb-6 flex items-center gap-3">
          <div className="rounded-xl bg-indigo-700 p-2.5 text-white">
            <BrainCircuit className="size-7" aria-hidden />
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight">{t.title}</h1>
            <p className="text-sm text-slate-600">{t.subtitle}</p>
          </div>
        </div>

        <ul className="mb-6 grid grid-cols-3 gap-2 text-center text-sm font-medium">
          {facts.map(([Icon, label]) => (
            <li key={label} className="rounded-lg border border-slate-300 bg-white p-3">
              <Icon className="mx-auto mb-1 size-5 text-indigo-700" aria-hidden />
              {label}
            </li>
          ))}
        </ul>

        <RegisterForm minutes={minutes} />
      </div>
    </main>
  );
}
