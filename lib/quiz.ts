import { createHash } from "node:crypto";

// 12 reading-heavy questions: about 2 minutes each, a little more for the logic puzzles.
export const QUIZ_MS = 25 * 60 * 1000;
export const LATE_FLAG_MS = 30 * 1000; // after the deadline: accepted, but marked "(late)" on the dashboard
export const SUBMIT_GRACE_MS = 2 * 60 * 1000; // after the deadline: rejected outright

export const CATEGORIES = ["logic", "critical", "teamwork"] as const;
export type Category = (typeof CATEGORIES)[number];

// Display name: trimmed, single spaces. Key: also Unicode-normalized and case-folded (works for Cyrillic too).
export const cleanName = (name: string) => name.normalize("NFKC").trim().replace(/\s+/g, " ");
export const nameKey = (name: string) => cleanName(name).toLowerCase();

// Option IDs (their index in the seed) in this student's display order.
// Same student + question -> same order on every request; different students get different orders.
export function optionOrder(seed: string, questionId: number, count: number) {
  const rank = (id: number) => createHash("sha256").update(`${seed}:${questionId}:${id}`).digest("hex");
  return Array.from({ length: count }, (_, id) => ({ id, rank: rank(id) }))
    .sort((a, b) => (a.rank < b.rank ? -1 : 1))
    .map((o) => o.id);
}

type Gradable = { id: number; category: Category; options: unknown[]; correctIndex: number; points: number };

// Keeps only valid answers (questionId -> option ID) and scores them, in total and per category.
// Used both when a student submits and when the dashboard shows the per-category breakdown.
export function grade(questions: Gradable[], raw: Record<string, unknown>) {
  const answers: Record<string, number> = {};
  const byCategory = { logic: 0, critical: 0, teamwork: 0 } satisfies Record<Category, number>;
  let score = 0;
  for (const q of questions) {
    const choice = raw[q.id];
    if (typeof choice !== "number" || !Number.isInteger(choice) || choice < 0 || choice >= q.options.length) continue;
    answers[q.id] = choice;
    if (choice === q.correctIndex) {
      score += q.points;
      byCategory[q.category] += q.points;
    }
  }
  return { answers, score, byCategory };
}
