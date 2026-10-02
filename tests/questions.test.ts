// Checks the question bank itself: structure, the "correct option is never the longest" rule,
// and that every logic puzzle has exactly one answer (by brute force, not by trusting the key).
import assert from "node:assert/strict";
import { test } from "node:test";
import { questionBank } from "../db/questions.ts";
import { CATEGORIES } from "../lib/quiz.ts";

const q = (id: number) => questionBank.find((x) => x.id === id)!;
const marked = (id: number) => q(id).options[q(id).correctIndex];
const permutations = <T>(xs: T[]): T[][] =>
  xs.length ? xs.flatMap((x, i) => permutations([...xs.slice(0, i), ...xs.slice(i + 1)]).map((p) => [x, ...p])) : [[]];

test("12 questions, 4 per category, 40 points per category", () => {
  assert.deepEqual(
    questionBank.map((x) => x.id),
    Array.from({ length: 12 }, (_, i) => i + 1),
  );
  for (const c of CATEGORIES) {
    const inCategory = questionBank.filter((x) => x.category === c);
    assert.equal(inCategory.length, 4, c);
    assert.equal(inCategory.reduce((sum, x) => sum + x.points, 0), 40, c);
  }
});

test("4 different options each; the correct one is never the longest", () => {
  for (const x of questionBank) {
    assert.equal(new Set(x.options).size, 4, `Q${x.id}`);
    const correct = x.options[x.correctIndex].length;
    assert.ok(
      x.options.some((o, i) => i !== x.correctIndex && o.length >= correct),
      `Q${x.id}: the correct option is the longest`,
    );
  }
});

test("Q1: each number is the sum of the two before it; only the marked option continues it", () => {
  const seq = q(1).prompt.match(/\d+(?:, \d+)+/)![0].split(", ").map(Number);
  seq.slice(2).forEach((n, i) => assert.equal(n, seq[i] + seq[i + 1]));
  const next = seq.at(-1)! + seq.at(-2)!;
  assert.deepEqual(q(1).options.filter((o) => Number(o) === next), [marked(1)]);
});

test("Q4: only the marked option is forced by the rules", () => {
  // Every situation consistent with the rules, for Kamola.
  type World = { tookPart: boolean; finalist: boolean; certificate: boolean; camp: boolean };
  const worlds: World[] = [];
  for (let m = 0; m < 32; m++) {
    const [tookPart, finalist, certificate, camp, course] = [0, 1, 2, 3, 4].map((b) => ((m >> b) & 1) === 1);
    const fits =
      (!finalist || tookPart) && (!finalist || certificate) && (!certificate || camp) && (!camp || !course) && course;
    if (fits) worlds.push({ tookPart, finalist, certificate, camp });
  }
  const options = [
    (w: World) => !w.tookPart, // possible, but not forced
    (w: World) => !w.finalist,
    (w: World) => w.certificate && !w.camp, // impossible
    (w: World) => w.finalist && !w.certificate, // impossible
  ];
  const forced = options.map((holds) => worlds.every(holds));
  assert.deepEqual(forced, options.map((_, i) => i === q(4).correctIndex));
  assert.ok(worlds.some(options[0]), "option A is a tempting possibility, not a certainty");
});

test("Q7: exactly one seating fits, every clue is needed, and seat 3 is the marked answer", () => {
  const clues = [
    (s: string[]) => s[0] === "Dilnoza",
    (s: string[]) => s[0] !== "Madina" && s[4] !== "Madina",
    (s: string[]) => s.indexOf("Sardor") === s.indexOf("Bekzod") + 1,
    (s: string[]) => Math.abs(s.indexOf("Javohir") - s.indexOf("Madina")) !== 1,
  ];
  const solve = (cs: typeof clues) =>
    permutations(["Bekzod", "Dilnoza", "Javohir", "Madina", "Sardor"]).filter((s) => cs.every((c) => c(s)));
  const solutions = solve(clues);
  assert.equal(solutions.length, 1);
  assert.equal(solutions[0][2], marked(7));
  clues.forEach((_, i) => assert.ok(solve(clues.filter((_, j) => j !== i)).length > 1, `clue ${i + 1} is needed`));
});

test("Q10: exactly one culprit leaves exactly one true statement", () => {
  const fits = ["Alisher", "Bobur", "Jasur"].filter(
    (culprit) => [culprit === "Bobur", culprit !== "Bobur", culprit !== "Jasur"].filter(Boolean).length === 1,
  );
  assert.deepEqual(fits, [marked(10)]);
});
