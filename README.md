# Hackathon Selection Test

A 12-question, 25-minute test of logical thinking, critical thinking and teamwork judgment (4 questions and 40 points each). Students take it at `/` in Uzbek (Latin), and the teacher reviews results and generates teams at `/admin` (in English).

Built with Next.js 16 (App Router), Tailwind, Drizzle ORM and SQLite (`quiz.db`).

## Run it

Needs Node.js 24 (22.18 or newer also works: the scripts run TypeScript files directly).

```bash
git clone https://github.com/theshoxjaxon/quiz.git
cd quiz
npm install
cp .env.example .env.local    # then open .env.local and set your own ADMIN_PASSWORD
npm run setup                 # creates quiz.db and loads the 12 questions
npm run build && npm start    # serves on port 3000
```

`npm start` also runs `npm run setup` on its own each time, so the database is always up to date before the server starts.

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

## How it works

| Piece | Where |
| --- | --- |
| Schema: `students`, `questions`, `submissions`, `teams`, `settings` | `db/schema.ts` |
| Questions, answer key, categories, point weights (120 pts total) | `db/questions.ts` (loaded by `db/seed.ts`) |
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

## Tests

```bash
npm run build && npm test
```

Unit tests cover ranking, team splits, name matching, the shuffle and grading. Question tests check the question bank: 4 per category, 40 points each, the correct option never the longest, and a brute-force proof that every logic puzzle has exactly one answer. API tests start a real server on a temporary database and port (never `quiz.db`). They check duplicate registration, the late cap, the team lock, shuffle and grading, and 30 simultaneous submissions. They check per-category scores too, and refuse to run against an out-of-date build. Editing `db/questions.ts` therefore needs `npm run build` again before `npm test`.

## Editing the test

- **Wording:** change `lib/i18n/uz.ts` (UI) or `db/questions.ts` (questions). Write oʻ/gʻ with ʻ and the tutuq belgisi with ʼ, as the existing text does.
- **Time limit:** `QUIZ_MS` in `lib/quiz.ts`. The registration page reads it, and the question count comes from the database.
- After editing questions, restart with `npm start` (it reloads them), then run `npm run build && npm test` to re-check the rules.

## Notes

- SQLite is a single file, so run the app on one machine (a laptop or a small server). Serverless hosts like Vercel won't keep `quiz.db`.
- The browser's own “please fill in this field” bubbles follow the browser's language, not `uz.ts`.
- Over plain `http://`, the admin password travels unencrypted. That's fine on the school network; use HTTPS if the app is reachable from the internet.
