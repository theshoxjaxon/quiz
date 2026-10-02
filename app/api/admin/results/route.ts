import { NextResponse } from "next/server";
import { CATEGORIES } from "@/lib/quiz";
import { getResults } from "@/lib/server";

const letter = (i: number | undefined) => (i === undefined ? "" : "ABCD"[i]);
const title = (c: string) => c[0].toUpperCase() + c.slice(1);

// Quote when needed, and defuse spreadsheet formulas typed in as names (=, +, -, @).
const csvCell = (v: unknown) => {
  let s = String(v ?? "");
  if (/^[=+\-@\t\r]/.test(s)) s = `'${s}`;
  return /[",\r\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
};

// GET /api/admin/results               -> JSON
// GET /api/admin/results?format=json   -> JSON download
// GET /api/admin/results?format=csv    -> CSV download
export function GET(req: Request) {
  const { questions, maxByCategory, students, teams } = getResults();
  const format = new URL(req.url).searchParams.get("format");
  const teamName = (id: number | null) => teams.find((t) => t.id === id)?.name ?? "";

  if (format === "csv") {
    const header = [
      ...["Rank", "Name", "Student ID", "Team", "Score"],
      ...CATEGORIES.map(title),
      ...["Time (s)", "Submitted at"],
      ...questions.map((q) => `Q${q.id}`),
    ];
    const rows = students.map((s, i) => [
      s.score === null ? "" : i + 1,
      s.name,
      s.studentId,
      teamName(s.teamId),
      s.score ?? "",
      ...CATEGORIES.map((c) => s.categoryScores?.[c] ?? ""),
      s.timeTakenSec ?? "",
      s.submittedAt?.toISOString() ?? "",
      ...questions.map((q) => {
        const a = s.answers?.[q.id];
        return a === undefined ? "" : `${letter(a)} ${a === q.correctIndex ? "✓" : "✗"}`;
      }),
    ]);
    const csv = "﻿" + [header, ...rows].map((r) => r.map(csvCell).join(",")).join("\r\n");
    return new Response(csv, {
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": 'attachment; filename="hackathon-results.csv"',
      },
    });
  }

  const data = {
    exportedAt: new Date().toISOString(),
    maxScore: questions.reduce((sum, q) => sum + q.points, 0),
    maxByCategory,
    questions: questions.map((q) => ({ id: q.id, category: q.category, points: q.points, correct: letter(q.correctIndex) })),
    students: students.map((s, i) => ({
      rank: s.score === null ? null : i + 1,
      name: s.name,
      studentId: s.studentId,
      team: teamName(s.teamId) || null,
      score: s.score,
      categoryScores: s.categoryScores,
      timeTakenSec: s.timeTakenSec,
      submittedAt: s.submittedAt,
      answers: Object.fromEntries(questions.map((q) => [`Q${q.id}`, letter(s.answers?.[q.id]) || null])),
    })),
    teams: teams.map((t) => ({ id: t.id, name: t.name, members: students.filter((s) => s.teamId === t.id).map((s) => s.name) })),
  };
  return NextResponse.json(
    data,
    format === "json" ? { headers: { "Content-Disposition": 'attachment; filename="hackathon-results.json"' } } : undefined,
  );
}
