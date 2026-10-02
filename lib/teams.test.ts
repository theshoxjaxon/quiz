import assert from "node:assert/strict";
import { test } from "node:test";
import { byRank, makeTeams } from "./teams.ts";

test("ranks by score, then time; non-submitters last", () => {
  const rows = [
    { id: 1, score: null, timeTakenSec: null, submittedAt: null },
    { id: 2, score: 80, timeTakenSec: 900, submittedAt: new Date(2) },
    { id: 3, score: 80, timeTakenSec: 600, submittedAt: new Date(3) },
    { id: 4, score: 95, timeTakenSec: 1100, submittedAt: new Date(1) },
  ];
  assert.deepEqual(rows.sort(byRank).map((r) => r.id), [4, 3, 2, 1]);
});

test("30 students: top 5 form Team 1, the rest make five teams of 5", () => {
  const ids = Array.from({ length: 30 }, (_, i) => i);
  const teams = makeTeams(ids);
  assert.deepEqual(teams[0], [0, 1, 2, 3, 4]);
  assert.deepEqual(teams.slice(1).map((t) => t.length), [5, 5, 5, 5, 5]);
  assert.deepEqual(teams.flat().sort((a, b) => a - b), ids);
});

test("23 students: nobody lost, Teams 2–6 differ in size by at most 1", () => {
  const teams = makeTeams(Array.from({ length: 23 }, (_, i) => i));
  const sizes = teams.slice(1).map((t) => t.length);
  assert.equal(teams[0].length, 5);
  assert.equal(new Set(teams.flat()).size, 23);
  assert.ok(Math.max(...sizes) - Math.min(...sizes) <= 1);
});
