# Hackathon Selection Test

A 12-question, 25-minute test of logical thinking, critical thinking and teamwork judgment (4 questions and 40 points each). Students take it at `/` in Uzbek (Latin), and the teacher reviews results and generates teams at `/admin` (in English).

Built with Next.js 16 (App Router), Tailwind and Drizzle ORM on libSQL: a local SQLite file (`quiz.db`) on your computer, or a Turso database when deployed to Vercel.

## Run it

Needs Node.js 24 (22.18 or newer also works: the scripts run TypeScript files directly).

```bash
git clone https://github.com/theshoxjaxon/quiz.git
cd quiz
npm install
cp .env.example .env.local    # then open .env.local and set your own ADMIN_PASSWORD
npm run setup                 # creates quiz.db (tables from drizzle/) and loads the 12 questions
npm run build && npm start    # serves on port 3000
```

`npm start` (and `npm run dev`) also run `npm run setup` on their own, so the database is always up to date before the server starts. Setup prints which database it uses: `file:quiz.db (local file)` unless Turso variables are set.

- **Students** open `http://<this-computer's-IP>:3000`.
- **Teacher** opens `/admin`. The browser asks for a login: any username, plus the `ADMIN_PASSWORD` you set.
- **After code changes**, run `npm run build` again and restart `npm start`.

## Before the session

1. **Keep the Mac awake.** In a separate Terminal window, run `caffeinate -dimsu` and leave it open until the test is over.
2. **Firewall.** The macOS firewall works per app, not per port. Allow incoming connections for `node` in System Settings → Network → Firewall → Options, or click **Allow** when macOS asks the first time the server starts. That opens port 3000 to the network.
3. **Laptop IP.** Run `ipconfig getifaddr en0` (Wi-Fi) and check `http://<that-IP>:3000` from a phone. The IP can change between days, so check it on the day.
4. **Test run with 2–3 devices.** Register, answer, submit, then open `/admin`, generate teams, and lock and unlock them.
5. **Clear the test data:** `npm run db:reset`. It's safe while the server is running, and it removes all students, submissions and the team lock.

> Never delete `quiz.db` while the server is running. The server keeps writing to the deleted file, and every submission is lost on restart. Use `npm run db:reset` instead.

## Deploy to Vercel

Vercel can't keep a local file between requests, so the deployed app uses [Turso](https://turso.tech) (hosted libSQL, SQLite-compatible). Install the Turso CLI first: `brew install tursodatabase/tap/turso`.

1. **Create the database** (once):

   ```bash
   turso auth login
   turso db create quiz
   turso db show quiz --url       # prints libsql://quiz-<your-name>.turso.io  -> TURSO_DATABASE_URL
   turso db tokens create quiz    # prints a long token                        -> TURSO_AUTH_TOKEN
   ```

2. **Create the tables and load the questions** from your computer, once now and again after changing questions or the schema:

   ```bash
   TURSO_DATABASE_URL="$(turso db show quiz --url)" TURSO_AUTH_TOKEN="$(turso db tokens create quiz)" npm run setup
   ```

   The first line it prints should be `Database: libsql://… (remote)`. Re-running is safe: it only adds tables the database doesn't have yet and reloads the questions, keeping students and submissions.

3. **Set three environment variables in Vercel** (Project → Settings → Environment Variables):

   | Name | Value |
   | --- | --- |
   | `ADMIN_PASSWORD` | the teacher's password for `/admin` |
   | `TURSO_DATABASE_URL` | the `libsql://…` URL from step 1 |
   | `TURSO_AUTH_TOKEN` | the token from step 1 |

4. **Deploy:** import the GitHub repo in Vercel (the defaults are fine), or run `vercel --prod`. If a page says "TURSO_DATABASE_URL is not set", the variables are missing: add them and redeploy.

- **Clearing test data on Turso** is deliberately harder than locally: `npm run db:reset -- --yes-wipe-remote`, with the same two variables as in step 2. Without the flag it refuses.
- **Preview deployments** use the same database as production unless you limit the Turso variables to the Production environment in Vercel.
- **Keep the Turso variables out of `.env.local`** unless you want `npm run dev`, `npm run setup` and `npm run db:reset` on your computer to use the live database too. Passing them inline for one command (step 2) is safer.
- The **Before the session** checklist is for running on a laptop. On Vercel, only the test run with 2–3 devices applies.

## How it works

| Piece | Where |
| --- | --- |
| Schema: `students`, `questions`, `submissions`, `teams`, `settings` | `db/schema.ts`, migrations in `drizzle/` |
| Database connection: Turso if `TURSO_DATABASE_URL` is set, else `file:quiz.db` | `db/index.ts` |
| `npm run setup` / `db:reset`: apply migrations, load questions and teams | `db/setup.ts` |
| Questions, answer key, categories, point weights (120 pts total) | `db/questions.ts` |
| Every student-facing string (Uzbek) | `lib/i18n/uz.ts` |
| Time limit, name matching, option shuffle, grading (total + per category) | `lib/quiz.ts` |
| `POST /api/register`: name + student ID, sets session cookie, starts the clock | `app/api/register` |
| `GET /api/quiz`: questions without answers, options shuffled per student, plus time left | `app/api/quiz` |
| `POST /api/submit`: graded on the server by option ID; the score is never shown to students | `app/api/submit` |
| `GET /api/admin/results?format=csv\|json`: results (total + Logic/Critical/Teamwork) and team export | `app/api/admin/results` |
| `POST /api/admin/teams`: top 5 go to Team 1, the rest are shuffled into Teams 2–6 (refused while locked) | `app/api/admin/teams`, `lib/teams.ts` |
| `PUT` / `DELETE /api/admin/teams/lock`: lock / unlock the teams | `app/api/admin/teams/lock` |
| Basic-auth guard for `/admin` and `/api/admin/*` | `proxy.ts` |

- **Registration:** each name (ignoring case and extra spaces) and each student ID can register only once, and the database enforces both. Re-entering the same name and ID resumes an unfinished test. Any mismatch is rejected, as is any attempt after submitting. Two students with the same name: the second adds a middle initial.
- **Timer:** the start time is stored on the server at first registration. Refreshing or closing the page doesn't reset it. In-progress answers are saved in the browser, and the test submits automatically at 0:00.
- **Late submissions:** accepted for up to 2 minutes past a student's deadline and marked "(late)". Later than that, they are rejected and the dashboard shows "Time expired".
- **Shuffled options:** every student sees the same questions in the same order, but each question's options are shuffled per student (the same order on every refresh). On the dashboard, A–D refer to the answer-key order in `db/questions.ts`, not what a student saw.
- **Per-category scores** are recomputed from each student's saved answers, so they always add up to the total.
- **Ranking:** by total score, then by faster time. Students who never submitted rank last but still get placed in a team.
- **Several servers at once** (as on Vercel) are fine. One registration per name and ID, one submission per student, and "no regenerating while locked" are all enforced by the database (unique constraints; team generation runs as one transaction that re-checks the lock), not by a single server process.

## Tests

```bash
npm run build && npm test
```

Unit tests cover ranking, team splits, name matching, the shuffle and grading. Question tests check the question bank: 4 per category, 40 points each, the correct option never the longest, and a brute-force proof that every logic puzzle has exactly one answer. API tests start a real server on a temporary local database and port: never `quiz.db`, and never Turso, even if `.env.local` has Turso variables. They check duplicate registration, the late cap, the team lock, shuffle and grading, and 30 simultaneous submissions. They check per-category scores too, and refuse to run against an out-of-date build. Setup tests check that `db:reset` won't wipe a remote database without the extra flag, and that a Vercel deploy without Turso variables fails with a clear message. Editing `db/questions.ts` therefore needs `npm run build` again before `npm test`.

## Editing the test

- **Wording:** change `lib/i18n/uz.ts` (UI) or `db/questions.ts` (questions). Write oʻ/gʻ with ʻ and the tutuq belgisi with ʼ, as the existing text does.
- **Time limit:** `QUIZ_MS` in `lib/quiz.ts`. The registration page reads it, and the question count comes from the database.
- After editing questions, restart with `npm start` (it reloads them), then run `npm run build && npm test` to re-check the rules. For the deployed app, repeat step 2 of **Deploy to Vercel**.
- **Schema changes:** edit `db/schema.ts`, run `npm run db:generate` to write a new migration file into `drizzle/`, commit it, then run `npm run setup` (locally, and with the Turso variables for the deployed database).

## Notes

- Locally the database is the single file `quiz.db`, so run the app on one machine. Deployed, it's Turso (see **Deploy to Vercel**).
- The browser's own “please fill in this field” bubbles follow the browser's language, not `uz.ts`.
- Over plain `http://` (a laptop on the school network) the admin password travels unencrypted, which is fine on a school network. Vercel always serves HTTPS.
