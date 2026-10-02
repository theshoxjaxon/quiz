// Guards in db/setup.ts and db/index.ts that protect a real (Turso) database. No network needed:
// both refuse before the first query.
import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { join } from "node:path";
import { test } from "node:test";

const ROOT = join(import.meta.dirname, "..");
const runSetup = (args: string[], overrides: Record<string, string>) => {
  const env = { ...process.env };
  for (const key of ["TURSO_DATABASE_URL", "TURSO_AUTH_TOKEN", "VERCEL"]) delete env[key]; // start from a clean slate
  return spawnSync(process.execPath, ["db/setup.ts", ...args], { cwd: ROOT, env: { ...env, ...overrides }, encoding: "utf8" });
};

test("db:reset refuses to wipe a remote database without --yes-wipe-remote", () => {
  const result = runSetup(["--reset"], { TURSO_DATABASE_URL: "libsql://quiz-example.invalid", TURSO_AUTH_TOKEN: "x" });
  assert.equal(result.status, 1);
  assert.match(result.stderr, /Refusing to delete students/);
});

test("on Vercel, a missing TURSO_DATABASE_URL fails with a clear message", () => {
  const result = runSetup([], { VERCEL: "1" });
  assert.notEqual(result.status, 0);
  assert.match(result.stderr, /TURSO_DATABASE_URL is not set/);
});
