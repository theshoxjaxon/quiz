import { Download, Lock, Trophy, Users } from "lucide-react";
import { CATEGORIES, LATE_FLAG_MS, QUIZ_MS } from "@/lib/quiz";
import { getResults, teamsLockedAt } from "@/lib/server";
import TeamControls from "./team-controls";

export const dynamic = "force-dynamic";

const LATE_AFTER_SEC = (QUIZ_MS + LATE_FLAG_MS) / 1000;
const CATEGORY_LABELS = { logic: "Logic", critical: "Critical", teamwork: "Teamwork" };
const mmss = (sec: number) => `${Math.floor(sec / 60)}:${String(sec % 60).padStart(2, "0")}`;

export default function Admin() {
  const { questions, maxByCategory, students, teams } = getResults();
  const maxScore = questions.reduce((sum, q) => sum + q.points, 0);
  const submitted = students.filter((s) => s.score !== null);
  const avg = submitted.length ? Math.round(submitted.reduce((sum, s) => sum + s.score!, 0) / submitted.length) : 0;
  const hasTeams = students.some((s) => s.teamId !== null);
  const lockedAt = teamsLockedAt();

  const stats = [
    ["Registered", students.length],
    ["Submitted", submitted.length],
    ["Average score", submitted.length ? `${avg} / ${maxScore}` : "–"],
    ["Top score", submitted.length ? `${submitted[0].score} / ${maxScore}` : "–"],
  ];

  return (
    <main lang="en" className="mx-auto w-full max-w-7xl space-y-6 p-4 sm:p-6">
      <header className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Teacher Dashboard</h1>
          <p className="text-slate-600">Hackathon selection test results</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <TeamControls submitted={submitted.length} total={students.length} hasTeams={hasTeams} locked={!!lockedAt} />
          {(["csv", "json"] as const).map((f) => (
            <a
              key={f}
              href={`/api/admin/results?format=${f}`}
              className="flex items-center gap-2 rounded-lg border border-slate-400 bg-white px-4 py-2.5 font-semibold hover:bg-slate-50"
            >
              <Download className="size-4" aria-hidden /> Export {f.toUpperCase()}
            </a>
          ))}
        </div>
      </header>

      <section className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {stats.map(([label, value]) => (
          <div key={label} className="rounded-xl border border-slate-300 bg-white p-4">
            <p className="text-sm text-slate-600">{label}</p>
            <p className="text-2xl font-bold">{value}</p>
          </div>
        ))}
      </section>

      {lockedAt && (
        <p className="flex items-center gap-2 rounded-lg border border-amber-500 bg-amber-50 px-4 py-3 font-medium text-amber-950">
          <Lock className="size-4 shrink-0" aria-hidden />
          Teams locked at {new Date(lockedAt).toLocaleString()}. Unlock them to regenerate.
        </p>
      )}

      {hasTeams && (
        <section className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {teams.map((t) => (
            <div
              key={t.id}
              className={`rounded-xl border p-4 ${t.id === 1 ? "border-amber-500 bg-amber-50" : "border-slate-300 bg-white"}`}
            >
              <h2 className="mb-2 flex items-center gap-2 font-bold">
                {t.id === 1 ? <Trophy className="size-5 text-amber-600" aria-hidden /> : <Users className="size-5 text-slate-500" aria-hidden />}
                {t.name}
              </h2>
              <ul className="space-y-1 text-sm">
                {students
                  .filter((s) => s.teamId === t.id)
                  .map((s) => (
                    <li key={s.id} className="flex justify-between gap-2">
                      <span>{s.name}</span>
                      <span className="tabular-nums text-slate-600">{s.score ?? "–"}</span>
                    </li>
                  ))}
              </ul>
            </div>
          ))}
        </section>
      )}

      <section className="overflow-x-auto rounded-xl border border-slate-300 bg-white">
        <table className="w-full text-sm">
          <thead className="bg-slate-900 text-left text-white">
            <tr>
              <th className="px-3 py-2">#</th>
              <th className="px-3 py-2">Student</th>
              <th className="px-3 py-2">Submitted</th>
              <th className="px-3 py-2">Score</th>
              {CATEGORIES.map((c) => (
                <th key={c} className="px-2 py-2 text-center">
                  {CATEGORY_LABELS[c]}
                  <span className="block text-xs font-normal text-slate-300">/ {maxByCategory[c]}</span>
                </th>
              ))}
              <th className="px-3 py-2">Time</th>
              {questions.map((q) => (
                <th key={q.id} className="px-1 py-2 text-center" title={`${q.category} · ${q.points} pts`}>
                  Q{q.id}
                  <span className="block text-xs font-normal text-slate-300">{"ABCD"[q.correctIndex]}</span>
                </th>
              ))}
              <th className="px-3 py-2">Team</th>
            </tr>
          </thead>
          <tbody>
            {students.length === 0 && (
              <tr>
                <td colSpan={questions.length + CATEGORIES.length + 6} className="px-3 py-8 text-center text-slate-600">
                  No students have registered yet.
                </td>
              </tr>
            )}
            {students.map((s, i) => (
              <tr key={s.id} className={`border-t border-slate-200 ${s.teamId === 1 ? "bg-amber-50" : ""}`}>
                <td className="px-3 py-2 font-semibold tabular-nums">{s.score === null ? "–" : i + 1}</td>
                <td className="px-3 py-2">
                  <div className="font-semibold">{s.name}</div>
                  <div className="text-xs text-slate-600">{s.studentId}</div>
                </td>
                <td className="px-3 py-2 whitespace-nowrap">
                  {s.submittedAt ? (
                    s.submittedAt.toLocaleString()
                  ) : s.timedOut ? (
                    <span className="font-semibold text-red-700">Time expired, no submission</span>
                  ) : (
                    <span className="text-slate-500">In progress</span>
                  )}
                </td>
                <td className="px-3 py-2 font-bold tabular-nums">{s.score ?? "–"}</td>
                {CATEGORIES.map((c) => (
                  <td key={c} className="px-2 py-2 text-center tabular-nums">
                    {s.categoryScores?.[c] ?? "–"}
                  </td>
                ))}
                <td className="px-3 py-2 tabular-nums">
                  {s.timeTakenSec === null ? (
                    "–"
                  ) : (
                    <span className={s.timeTakenSec > LATE_AFTER_SEC ? "font-bold text-red-700" : ""}>
                      {mmss(s.timeTakenSec)}
                      {s.timeTakenSec > LATE_AFTER_SEC && " (late)"}
                    </span>
                  )}
                </td>
                {questions.map((q) => {
                  const a = s.answers?.[q.id];
                  const color = a === undefined ? "text-slate-400" : a === q.correctIndex ? "bg-emerald-100 text-emerald-900" : "bg-red-100 text-red-900";
                  return (
                    <td key={q.id} className="px-1 py-2 text-center">
                      <span className={`inline-block w-7 rounded py-0.5 font-bold ${color}`}>{a === undefined ? "–" : "ABCD"[a]}</span>
                    </td>
                  );
                })}
                <td className="px-3 py-2 whitespace-nowrap">{s.teamId ? `Team ${s.teamId}` : "–"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>
      <p className="text-sm text-slate-600">
        Ranked by total score, then by faster completion time. Logic / Critical / Teamwork are the per-category scores
        (each category is worth the same). Green = correct, red = wrong, – = unanswered. Letters are the
        answer-key order from the seed (each student saw the options shuffled); the letter under each question number is
        the correct answer. Submissions more than 2 minutes past a student&apos;s deadline are rejected. Team 1 takes the top 5; everyone else is shuffled into Teams 2–6.
      </p>
    </main>
  );
}
