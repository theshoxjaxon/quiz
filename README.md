# Hackathon Selection Test

A 12-question, 25-minute test of logical thinking, critical thinking and teamwork judgment (4 questions and 40 points each). Students take it at `/` in Uzbek (Latin), and the teacher reviews results and generates teams at `/admin` (in English).

Built with Next.js 16 (App Router), Tailwind and Drizzle ORM on PostgreSQL (Supabase), deployed on Vercel.

## 1. Create the Supabase databases

Use two free Supabase projects: one for development and one for production (the real test).

1. On [supabase.com](https://supabase.com), create a **New project**. Pick a region close to your Vercel functions (and set the same region in Vercel → Project → Settings → Functions). Choose a database password and keep it.
2. When the project is ready, click **Connect** at the top of the project page and choose **Transaction pooler**. Copy that connection string:

   ```
   postgresql://postgres.<project-ref>:[YOUR-PASSWORD]@aws-0-<region>.pooler.supabase.com:6543/postgres
   ```

   Replace `[YOUR-PASSWORD]` with the database password. URL-encode special characters (`@` → `%40`, `#` → `%23`, `/` → `%2F`, `?` → `%3F`). Forgot it? Project Settings → Database → Reset database password.

   Use the **transaction pooler** (port 6543), not the direct connection: it works over IPv4 (the direct connection is IPv6-only, which Vercel can't reach) and is made for many short-lived serverless connections.

> **Free projects pause after a week without activity.** A paused project refuses connections until you click **Restore** in its dashboard, which takes a minute or two. Open both projects a day before the session.

## 2. Run it locally

Needs Node.js 24 (22.18 or newer also works: the scripts run TypeScript files directly).

```bash
git clone https://github.com/theshoxjaxon/quiz.git
cd quiz
npm install
cp .env.example .env.local    # set ADMIN_PASSWORD, and DATABASE_URL = the DEVELOPMENT project's pooler string
npm run setup                 # creates the tables (from drizzle/) and loads the 12 questions
npm run build && npm start    # serves on port 3000
```

`npm start` and `npm run dev` run `npm run setup` first, so the database is always up to date. Without `DATABASE_URL` they stop with instructions. Setup prints which database it uses (host and name only, never the password).

- **Students** open `http://<this-computer's-IP>:3000`.
- **Teacher** opens `/admin`. The browser asks for a login: any username, plus the `ADMIN_PASSWORD` you set.
- **After code changes**, run `npm run build` again and restart `npm start`.

## Before the session (running on a laptop)

1. **Keep the Mac awake.** In a separate Terminal window, run `caffeinate -dimsu` and leave it open until the test is over.
2. **Firewall.** The macOS firewall works per app, not per port. Allow incoming connections for `node` in System Settings → Network → Firewall → Options, or click **Allow** when macOS asks the first time the server starts. That opens port 3000 to the network.
3. **Laptop IP.** Run `ipconfig getifaddr en0` (Wi-Fi) and check `http://<that-IP>:3000` from a phone. The IP can change between days, so check it on the day.
4. **Supabase awake.** Open the project's dashboard; restore it if it's paused.
5. **Test run with 2–3 devices.** Register, answer, submit, then open `/admin`, generate teams, and lock and unlock them.
6. **Clear the test data:** `npm run db:reset -- --yes-wipe-remote`. A Supabase database always counts as remote, so reset refuses without that flag. It removes all students, submissions and the team lock, and it's safe while the server is running.

## 3. Deploy to Vercel

1. **Create the production Supabase project** and copy its transaction pooler string (section 1).
2. **Create the tables and load the questions in production**, from your computer. Do this once now, and again after changing questions or the schema:

   ```bash
   DATABASE_URL="<production pooler string>" npm run setup
   ```

   A `DATABASE_URL` given on the command line wins over `.env.local`. The first line printed should be `Database: aws-0-<region>.pooler.supabase.com:6543/postgres (remote)`. Re-running is safe: it only applies migrations the database hasn't had yet and reloads the questions, keeping students and submissions.

3. **Set two environment variables in Vercel** (Project → Settings → Environment Variables):

   | Name | Value |
   | --- | --- |
   | `ADMIN_PASSWORD` | the teacher's password for `/admin` |
   | `DATABASE_URL` | the production transaction pooler string (port 6543) |

4. **Deploy:** import the GitHub repo in Vercel (the defaults are fine), or run `vercel --prod`. If a page fails with "DATABASE_URL is not set", the variable is missing: add it and redeploy.

- **Clearing test data in production:** `DATABASE_URL="<production pooler string>" npm run db:reset -- --yes-wipe-remote`.
- **Preview deployments** use the same `DATABASE_URL` as production unless you scope it: give the Production environment the production string and Preview the development one.
- **Keep the production string out of `.env.local`.** Anything there is used by `npm run dev`, `npm run setup` and `npm run db:reset` on your computer.
- The **Before the session** steps are for a laptop. On Vercel, steps 4–6 still apply.

## How it works

| Piece | Where |
| --- | --- |
| Schema: `students`, `questions`, `submissions`, `teams`, `settings` | `db/schema.ts`, migrations in `drizzle/` |
| Database connection from `DATABASE_URL` (postgres.js, no prepared statements, 1 connection per server) | `db/index.ts` |
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
- **Several servers at once** (as on Vercel) are fine. One registration per name and ID and one submission per student are enforced by unique constraints in the database. Team generation and lock/unlock each run in a Postgres transaction that holds an advisory lock, so they never interleave and teams are never half-reshuffled.
- **Supabase's public Data API** can't see the data: row-level security is on for every table with no policies, so the public API key gets nothing. The app connects as the database owner and isn't affected.

## Tests

```bash
npm run build && npm test
```

- **Unit tests** cover ranking, team splits, name matching, the shuffle and grading.
- **Question tests** check the question bank: 4 per category, 40 points each, the correct option never the longest, and a brute-force proof that every logic puzzle has exactly one answer.
- **API tests** start a real server against [PGlite](https://pglite.dev) (Postgres running inside the test process, in memory) on a temporary port. No database server, no network, and never your `DATABASE_URL`, even if `.env.local` has one. They check duplicate registration, the late cap, the team lock, shuffle and grading, per-category scores, and 30 simultaneous submissions.
- **Setup tests** check that `db:reset` won't wipe a remote database without the flag, that the password is never printed, and that a missing `DATABASE_URL` stops with instructions.

The API tests refuse to run against an out-of-date build, so editing anything in `app/`, `lib/` or `db/` needs `npm run build` again before `npm test`.

## Editing the test

- **Wording:** change `lib/i18n/uz.ts` (UI) or `db/questions.ts` (questions). Write oʻ/gʻ with ʻ and the tutuq belgisi with ʼ, as the existing text does.
- **Time limit:** `QUIZ_MS` in `lib/quiz.ts`. The registration page reads it, and the question count comes from the database.
- **After editing questions**, restart with `npm start` (it reloads them), then run `npm run build && npm test` to re-check the rules. For production, repeat step 2 of **Deploy to Vercel**.
- **Schema changes:** edit `db/schema.ts`, run `npm run db:generate` to write a new migration file into `drizzle/`, commit it, then run `npm run setup` (development via `.env.local`, production with the inline `DATABASE_URL`).

## Notes

- The browser's own “please fill in this field” bubbles follow the browser's language, not `uz.ts`.
- Over plain `http://` (a laptop on the school network) the admin password travels unencrypted, which is fine on a school network. Vercel always serves HTTPS.
