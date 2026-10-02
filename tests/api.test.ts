// API-level tests against a real production server (`next start`) on a throwaway database and port.
// Needs a current build: `npm run build && npm test`.
import assert from "node:assert/strict";
import { execFileSync, spawn, type ChildProcess } from "node:child_process";
import { mkdtempSync, readdirSync, rmSync, statSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { after, before, test } from "node:test";
import Database from "better-sqlite3";
import { uz } from "../lib/i18n/uz.ts";
import { QUIZ_MS, SUBMIT_GRACE_MS } from "../lib/quiz.ts";

const ROOT = join(import.meta.dirname, "..");
const dir = mkdtempSync(join(tmpdir(), "quiz-api-"));
const PORT = 4100 + Math.floor(Math.random() * 800);
const BASE = `http://localhost:${PORT}`;
const env = { ...process.env, DB_FILE: join(dir, "test.db"), ADMIN_PASSWORD: "test-pw" };
const ADMIN = { authorization: "Basic " + Buffer.from("teacher:test-pw").toString("base64") };
const JSON_HEADERS = { "content-type": "application/json" };
let server: ChildProcess | undefined;
let db: Database.Database;

const newestSource = (path: string): number =>
  statSync(path).isDirectory()
    ? Math.max(0, ...readdirSync(path).filter((f) => !f.endsWith(".test.ts")).map((f) => newestSource(join(path, f))))
    : statSync(path).mtimeMs;

before(async () => {
  const built = statSync(join(ROOT, ".next/BUILD_ID"), { throwIfNoEntry: false })?.mtimeMs ?? 0;
  if (Math.max(...["app", "lib", "db", "proxy.ts"].map((p) => newestSource(join(ROOT, p)))) > built) {
    throw new Error("The production build is missing or older than the source. Run `npm run build` first.");
  }
  execFileSync(join(ROOT, "node_modules/.bin/drizzle-kit"), ["push"], { cwd: ROOT, env, stdio: "ignore" });
  execFileSync(process.execPath, ["db/seed.ts"], { cwd: ROOT, env, stdio: "ignore" });
  server = spawn(process.execPath, ["node_modules/next/dist/bin/next", "start", "-p", String(PORT)], {
    cwd: ROOT,
    env,
    stdio: "ignore",
    detached: true, // own process group, so after() can stop next-server and any children
  });
  for (let i = 0; i < 150 && !(await fetch(`${BASE}/api/quiz`).then(() => true, () => false)); i++) {
    await new Promise((r) => setTimeout(r, 200));
  }
  db = new Database(env.DB_FILE);
});

after(() => {
  if (server?.pid) process.kill(-server.pid);
  db?.close();
  rmSync(dir, { recursive: true, force: true });
});

const count = (sql: string) => (db.prepare(sql).get() as { n: number }).n;
const backdate = (studentId: string, ms: number) =>
  db.prepare("update students set started_at = ? where student_id = ?").run(Date.now() - ms, studentId);
const admin = (method: string, path: string) => fetch(BASE + path, { method, headers: ADMIN });
const submit = (cookie: string, body: object) =>
  fetch(`${BASE}/api/submit`, { method: "POST", headers: { ...JSON_HEADERS, cookie }, body: JSON.stringify(body) });

async function register(name: string, studentId: string) {
  const res = await fetch(`${BASE}/api/register`, {
    method: "POST",
    headers: JSON_HEADERS,
    body: JSON.stringify({ name, studentId }),
  });
  const body = await res.json();
  return { status: res.status, error: body.error as string | undefined, cookie: res.headers.get("set-cookie")?.split(";")[0] ?? "" };
}

test("registration: one per name and per ID, resume needs both, rejected after submitting", async () => {
  const first = await register("Ada Lovelace", "ada1");
  assert.equal(first.status, 200);

  const resumed = await register("  ada   LOVELACE ", "ADA1");
  assert.equal(resumed.status, 200);
  assert.equal(resumed.cookie, first.cookie, "resumes the same session");

  const otherId = await register("ADA LOVELACE", "ada2");
  assert.equal(otherId.status, 409);
  assert.equal(otherId.error, uz.errors.nameTakenOtherId);

  const otherName = await register("Someone Else", "ada1");
  assert.equal(otherName.status, 409);
  assert.equal(otherName.error, uz.errors.idTakenOtherName);
  assert.equal(count("select count(*) n from students where name_key = 'ada lovelace' or student_id like 'ada%'"), 1);

  assert.equal((await submit(first.cookie, { answers: {} })).status, 200);
  const sameAgain = await register("Ada Lovelace", "ada1");
  assert.equal(sameAgain.status, 409);
  assert.equal(sameAgain.error, uz.errors.alreadySubmitted);
  const newIdAgain = await register("ada lovelace", "ada3");
  assert.equal(newIdAgain.status, 409);
  assert.equal(newIdAgain.error, uz.errors.nameTakenSubmitted);

  // The database itself refuses a second row with the same normalized name.
  assert.throws(
    () =>
      db
        .prepare("insert into students (name, name_key, student_id, token, started_at) values ('x', 'ada lovelace', 'x9', 'tok-x9', 0)")
        .run(),
    /UNIQUE/,
  );
});

test("late cap: accepted up to 2 minutes past the deadline, rejected after", async () => {
  const late = await register("Late Larry", "late1");
  backdate("late1", QUIZ_MS + 60_000);
  assert.equal((await submit(late.cookie, { answers: {} })).status, 200);
  const taken = count(
    "select time_taken_sec n from submissions s join students st on st.id = s.student_id where st.student_id = 'late1'",
  );
  assert.ok(taken > QUIZ_MS / 1000, "recorded as late");

  const tooLate = await register("Too Late Tina", "late2");
  backdate("late2", QUIZ_MS + SUBMIT_GRACE_MS + 5_000);
  // Client-sent times are ignored: only the stored start time counts.
  const res = await submit(tooLate.cookie, { answers: {}, startedAt: Date.now(), submittedAt: Date.now() });
  assert.equal(res.status, 403);
  assert.equal(
    count("select count(*) n from submissions s join students st on st.id = s.student_id where st.student_id = 'late2'"),
    0,
  );
});

test("team lock: the API refuses to regenerate while locked", async () => {
  for (let i = 0; i < 8; i++) await register(`Team Tester ${i}`, `tt${i}`);
  const assignments = () => JSON.stringify(db.prepare("select id, team_id from students order by id").all());

  assert.equal((await fetch(`${BASE}/api/admin/teams/lock`, { method: "PUT" })).status, 401, "needs the password");
  assert.equal((await admin("POST", "/api/admin/teams")).status, 200);
  const lockedTeams = assignments();

  assert.equal((await admin("PUT", "/api/admin/teams/lock")).status, 200);
  assert.equal((await admin("POST", "/api/admin/teams")).status, 409);
  assert.equal(assignments(), lockedTeams, "assignments unchanged while locked");

  assert.equal((await admin("DELETE", "/api/admin/teams/lock")).status, 200);
  assert.equal((await admin("POST", "/api/admin/teams")).status, 200);
});

test("options: shuffled per student, stable on refresh, graded by option ID", async () => {
  type Quiz = { questions: { id: number; options: { id: number; text: string }[] }[] };
  const key = db.prepare("select id, options, correct_index, points from questions").all() as {
    id: number;
    options: string;
    correct_index: number;
    points: number;
  }[];
  const { cookie } = await register("Shuffle Sam", "shuffle1");
  const load = () => fetch(`${BASE}/api/quiz`, { headers: { cookie } }).then((r) => r.text());

  const raw = await load();
  assert.doesNotMatch(raw, /correct_?index/i, "answer key never sent");
  const quiz: Quiz = JSON.parse(raw);
  assert.deepEqual((JSON.parse(await load()) as Quiz).questions, quiz.questions, "same order after a refresh");
  for (const q of quiz.questions) {
    const seedOptions: string[] = JSON.parse(key.find((k) => k.id === q.id)!.options);
    q.options.forEach((o) => assert.equal(o.text, seedOptions[o.id], "option ID maps to its text"));
    assert.equal(new Set(q.options.map((o) => o.id)).size, seedOptions.length);
  }
  // Precondition: for this student, some correct answer is NOT at its seed position, so grading by
  // display position would get it wrong. Then answer everything correctly by ID: full marks.
  assert.ok(
    key.some((k) => quiz.questions.find((q) => q.id === k.id)!.options.findIndex((o) => o.id === k.correct_index) !== k.correct_index),
  );
  const answers = Object.fromEntries(key.map((k) => [k.id, k.correct_index]));
  assert.equal((await submit(cookie, { answers })).status, 200);
  assert.equal(
    count("select score n from submissions s join students st on st.id = s.student_id where st.student_id = 'shuffle1'"),
    key.reduce((sum, k) => sum + k.points, 0),
  );

  const other = await register("Shuffle Sue", "shuffle2");
  const otherQuiz: Quiz = await (await fetch(`${BASE}/api/quiz`, { headers: { cookie: other.cookie } })).json();
  assert.notDeepEqual(
    otherQuiz.questions.map((q) => q.options.map((o) => o.id)),
    quiz.questions.map((q) => q.options.map((o) => o.id)),
    "another student gets a different order",
  );
});

test("30 submissions in the same instant all succeed (WAL + busy timeout)", async () => {
  assert.equal(db.pragma("journal_mode", { simple: true }), "wal");
  const cookies: string[] = [];
  for (let i = 0; i < 30; i++) cookies.push((await register(`Burst Student ${i}`, `burst${i}`)).cookie);
  const statuses = await Promise.all(cookies.map((c) => submit(c, { answers: { 1: 2 } }).then((r) => r.status)));
  assert.deepEqual(statuses, Array(30).fill(200));
  assert.equal(
    count("select count(*) n from submissions s join students st on st.id = s.student_id where st.student_id like 'burst%'"),
    30,
  );
});

test("per-category scores: graded from the answers, shown in the JSON and CSV exports", async () => {
  type Key = { id: number; category: "logic" | "critical" | "teamwork"; correct_index: number; points: number };
  const key = db.prepare("select id, category, correct_index, points from questions").all() as Key[];
  const teamworkRight = key.filter((k) => k.category === "teamwork").slice(0, 2).map((k) => k.id);
  const isRight = (k: Key) => k.category === "logic" || teamworkRight.includes(k.id); // every critical answer wrong
  const answers = Object.fromEntries(key.map((k) => [k.id, isRight(k) ? k.correct_index : (k.correct_index + 1) % 4]));
  const sum = (ks: Key[]) => ks.reduce((total, k) => total + k.points, 0);
  const expected = {
    logic: sum(key.filter((k) => k.category === "logic")),
    critical: 0,
    teamwork: sum(key.filter((k) => teamworkRight.includes(k.id))),
  };

  const { cookie } = await register("Category Carl", "cat1");
  assert.equal((await submit(cookie, { answers })).status, 200);

  const json = await (await admin("GET", "/api/admin/results")).json();
  const row = json.students.find((s: { studentId: string }) => s.studentId === "cat1");
  assert.deepEqual(row.categoryScores, expected);
  assert.equal(row.score, expected.logic + expected.critical + expected.teamwork, "categories add up to the stored total");
  assert.deepEqual(json.maxByCategory, { logic: 40, critical: 40, teamwork: 40 });
  for (const s of json.students.filter((x: { score: number | null }) => x.score !== null)) {
    const c = s.categoryScores;
    assert.equal(c.logic + c.critical + c.teamwork, s.score, `${s.studentId}: categories add up to the total`);
  }

  const [header, ...lines] = (await (await admin("GET", "/api/admin/results?format=csv")).text()).replace(/^\uFEFF/, "").split("\r\n");
  const columns = header.split(",");
  const cells = lines.find((l) => l.includes(",cat1,"))!.split(",");
  for (const [label, value] of [["Logic", expected.logic], ["Critical", 0], ["Teamwork", expected.teamwork]] as const) {
    assert.equal(cells[columns.indexOf(label)], String(value), label);
  }
});
