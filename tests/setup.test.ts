// Guards in db/setup.ts and db/index.ts that protect a real (Supabase) database. No network needed:
// each one stops before connecting.
import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { join } from "node:path";
import { test } from "node:test";

const ROOT = join(import.meta.dirname, "..");
const SUPABASE_URL = "postgresql://postgres.abcdefgh:s3cr3t-Pa55@aws-0-eu-central-1.pooler.supabase.com:6543/postgres";
const runSetup = (args: string[], overrides: Record<string, string>) => {
  const env = { ...process.env };
  delete env.DATABASE_URL; // start from a clean slate; never the developer's real database
  return spawnSync(process.execPath, ["db/setup.ts", ...args], { cwd: ROOT, env: { ...env, ...overrides }, encoding: "utf8" });
};

test("db:reset refuses to wipe a remote database without --yes-wipe-remote", () => {
  const result = runSetup(["--reset"], { DATABASE_URL: SUPABASE_URL });
  assert.equal(result.status, 1);
  assert.match(result.stderr, /Refusing to delete students/);
});

test("setup shows which database it targets, without the password", () => {
  const result = runSetup(["--reset"], { DATABASE_URL: SUPABASE_URL });
  assert.match(result.stdout, /Database: aws-0-eu-central-1\.pooler\.supabase\.com:6543\/postgres \(remote\)/);
  assert.doesNotMatch(result.stdout + result.stderr, /s3cr3t-Pa55/);
});

test("a missing DATABASE_URL fails with instructions", () => {
  const result = runSetup([], {});
  assert.notEqual(result.status, 0);
  assert.match(result.stderr, /DATABASE_URL is not set[\s\S]*Transaction pooler/);
});
