import assert from "node:assert/strict";
import { test } from "node:test";
import { grade, nameKey, optionOrder } from "./quiz.ts";

test("option order is a stable permutation per student", () => {
  const order = optionOrder("student-1", 3, 4);
  assert.deepEqual([...order].sort(), [0, 1, 2, 3]);
  assert.deepEqual(optionOrder("student-1", 3, 4), order);
});

test("different students see different orders", () => {
  const orders = new Set(["a1", "b2", "c3", "d4", "e5"].map((s) => optionOrder(s, 1, 4).join()));
  assert.ok(orders.size > 1);
});

test("name key ignores case and extra spaces", () => {
  assert.equal(nameKey("  Ada   LOVELACE "), nameKey("ada lovelace"));
  assert.equal(nameKey("ДИЛНОЗА"), nameKey("дилноза"));
  assert.notEqual(nameKey("Ada Lovelace"), nameKey("Ada Byron"));
});

test("grade: total and per-category scores; invalid answers are dropped", () => {
  const questions: Parameters<typeof grade>[0] = [
    { id: 1, category: "logic", options: ["a", "b"], correctIndex: 0, points: 8 },
    { id: 2, category: "critical", options: ["a", "b"], correctIndex: 1, points: 10 },
    { id: 3, category: "teamwork", options: ["a", "b"], correctIndex: 1, points: 10 },
    { id: 4, category: "teamwork", options: ["a", "b"], correctIndex: 0, points: 12 },
  ];
  const result = grade(questions, { 1: 0, 2: 0, 3: 1, 4: 5, 99: 1 });
  assert.deepEqual(result.byCategory, { logic: 8, critical: 0, teamwork: 10 });
  assert.equal(result.score, 18);
  assert.deepEqual(result.answers, { 1: 0, 2: 0, 3: 1 });
});
