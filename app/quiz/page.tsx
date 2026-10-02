"use client";

import { AlertTriangle, CheckCircle2, ChevronLeft, ChevronRight, Clock, Send, TimerOff } from "lucide-react";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useRef, useState, type ReactNode } from "react";
import { uz } from "@/lib/i18n/uz";
import type { Category } from "@/lib/quiz";

// Options arrive already shuffled for this student; answers are stored by option id, never by position.
type Question = { id: number; category: Category; prompt: string; code: string | null; options: { id: number; text: string }[] };
type Quiz = { studentId: number; name: string; remainingMs: number; questions: Question[] };

const fmt = (ms: number) => {
  const s = Math.ceil(ms / 1000);
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`;
};

const btn = "flex items-center justify-center gap-2 rounded-lg px-4 py-2.5 font-semibold disabled:opacity-50";
const primary = `${btn} bg-indigo-700 text-white hover:bg-indigo-800`;
const secondary = `${btn} border border-slate-400 bg-white hover:bg-slate-50`;

function Center({ children }: { children: ReactNode }) {
  return (
    <main className="flex flex-1 items-center justify-center p-4">
      <div className="w-full max-w-md rounded-2xl border border-slate-300 bg-white p-8 text-center shadow-sm">{children}</div>
    </main>
  );
}

export default function QuizPage() {
  const router = useRouter();
  const [quiz, setQuiz] = useState<Quiz>();
  const [deadline, setDeadline] = useState(0);
  const [now, setNow] = useState(0);
  const [answers, setAnswers] = useState<Record<number, number>>({});
  const [current, setCurrent] = useState(0);
  const [reviewing, setReviewing] = useState(false);
  const [state, setState] = useState<"loading" | "load-error" | "ready" | "sending" | "error" | "closed" | "done">("loading");
  const autoSubmitted = useRef(false);
  const storageKey = `answers-v3-${quiz?.studentId}`;

  useEffect(() => {
    fetch("/api/quiz")
      .then(async (res) => {
        if (res.status === 401) return router.replace("/");
        if (!res.ok) throw new Error(res.statusText);
        const data = await res.json();
        if (data.submitted) return setState("done");
        // Deadline is relative to this device's clock, so a wrong system clock doesn't matter.
        setDeadline(Date.now() + data.remainingMs);
        setNow(Date.now());
        try {
          setAnswers(JSON.parse(localStorage.getItem(`answers-v3-${data.studentId}`) ?? "{}"));
        } catch {}
        setQuiz(data);
        setState("ready");
      })
      .catch(() => setState("load-error"));
  }, [router]);

  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(t);
  }, []);

  const submit = useCallback(async () => {
    setState("sending");
    try {
      const res = await fetch("/api/submit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ answers }),
      });
      if (res.ok || res.status === 409) {
        try {
          localStorage.removeItem(storageKey);
        } catch {}
        return setState("done");
      }
      if (res.status === 403) return setState("closed"); // past the server-side cap; retrying won't help
    } catch {}
    setState("error");
  }, [answers, storageKey]);

  const timeUp = quiz !== undefined && now >= deadline;
  useEffect(() => {
    if (timeUp && state === "ready" && !autoSubmitted.current) {
      autoSubmitted.current = true;
      submit();
    }
  }, [timeUp, state, submit]);

  if (state === "done") {
    return (
      <Center>
        <CheckCircle2 className="mx-auto mb-4 size-14 text-emerald-600" aria-hidden />
        <h1 className="text-2xl font-bold">{uz.done.title}</h1>
        <p className="mt-2 text-slate-700">{uz.done.body}</p>
        <p className="mt-4 text-sm text-slate-600">{uz.done.note}</p>
      </Center>
    );
  }
  if (state === "closed") {
    return (
      <Center>
        <TimerOff className="mx-auto mb-4 size-14 text-red-700" aria-hidden />
        <h1 className="text-2xl font-bold">{uz.closed.title}</h1>
        <p className="mt-2 text-slate-700">{uz.closed.body}</p>
        <p className="mt-4 text-sm font-semibold text-slate-900">{uz.closed.tellTeacher}</p>
      </Center>
    );
  }
  if (state === "load-error") {
    return (
      <Center>
        <p className="mb-4 font-medium">{uz.quiz.loadError}</p>
        <button onClick={() => location.reload()} className={`${primary} w-full`}>
          {uz.quiz.tryAgain}
        </button>
      </Center>
    );
  }
  if (!quiz) return <Center>{uz.quiz.loading}</Center>;

  const n = quiz.questions.length;
  const q = quiz.questions[current];
  const answered = quiz.questions.filter((x) => answers[x.id] !== undefined).length;
  const unanswered = quiz.questions.flatMap((x, i) => (answers[x.id] === undefined ? [i] : []));
  const remaining = Math.max(0, deadline - now);
  const locked = timeUp || state !== "ready";
  const showReview = reviewing || timeUp;

  function go(i: number) {
    setCurrent(i);
    setReviewing(false);
    window.scrollTo({ top: 0 });
  }

  function choose(qid: number, i: number) {
    const next = { ...answers, [qid]: i };
    setAnswers(next);
    try {
      localStorage.setItem(storageKey, JSON.stringify(next));
    } catch {}
  }

  return (
    <div className="flex flex-1 flex-col">
      <header className="sticky top-0 z-10 border-b border-slate-300 bg-white">
        <div className="mx-auto flex max-w-3xl items-center justify-between gap-3 px-4 py-3">
          <div className="min-w-0">
            <p className="truncate font-semibold">{quiz.name}</p>
            <p className="text-sm text-slate-600">
              {uz.quiz.answered(answered, n)}
            </p>
          </div>
          <div
            role="timer"
            aria-label={uz.quiz.timeLeft}
            className={`flex items-center gap-1.5 rounded-full px-3 py-1.5 font-mono text-lg font-bold tabular-nums text-white ${
              remaining < 2 * 60 * 1000 ? "bg-red-700" : "bg-slate-900"
            }`}
          >
            <Clock className="size-4" aria-hidden />
            {fmt(remaining)}
          </div>
        </div>
        <nav aria-label={uz.quiz.questionNav} className="mx-auto flex max-w-3xl flex-wrap gap-1.5 px-4 pb-3">
          {quiz.questions.map((x, i) => {
            const isCurrent = !showReview && i === current;
            const done = answers[x.id] !== undefined;
            return (
              <button
                key={x.id}
                onClick={() => go(i)}
                disabled={timeUp}
                aria-current={isCurrent ? "step" : undefined}
                aria-label={uz.quiz.questionButton(i + 1, done)}
                className={`size-9 shrink-0 rounded-lg border text-sm font-bold ${
                  done ? "border-indigo-700 bg-indigo-700 text-white" : "border-slate-400 bg-white"
                } ${isCurrent ? "ring-2 ring-slate-950 ring-offset-2" : ""}`}
              >
                {i + 1}
              </button>
            );
          })}
          <button onClick={() => setReviewing(true)} className="ml-auto shrink-0 rounded-lg px-3 text-sm font-bold text-indigo-700 underline">
            {uz.quiz.finish}
          </button>
        </nav>
      </header>

      <main className="mx-auto w-full max-w-3xl flex-1 p-4">
        {showReview ? (
          <section className="rounded-2xl border border-slate-300 bg-white p-6 shadow-sm">
            <h2 className="text-xl font-bold">{timeUp ? uz.review.timeUpTitle : uz.review.title}</h2>
            <p className="mt-1 text-slate-700">
              {uz.review.summary(answered, n)} {timeUp ? uz.review.sending : uz.review.noChanges}
            </p>
            {unanswered.length > 0 && !timeUp && (
              <div className="mt-4 flex gap-2 rounded-lg bg-amber-50 p-3 text-amber-950">
                <AlertTriangle className="mt-0.5 size-5 shrink-0" aria-hidden />
                <div>
                  {uz.review.unanswered}{" "}
                  {unanswered.map((i) => (
                    <button key={i} onClick={() => go(i)} className="mr-2 font-bold underline">
                      {uz.review.unansweredItem(i + 1)}
                    </button>
                  ))}
                </div>
              </div>
            )}
            {state === "error" && (
              <p role="alert" className="mt-4 rounded-lg bg-red-50 p-3 font-medium text-red-800">
                {uz.review.submitError}
              </p>
            )}
            <div className="mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
              {!timeUp && (
                <button onClick={() => setReviewing(false)} className={secondary}>
                  {uz.review.back}
                </button>
              )}
              <button onClick={submit} disabled={state === "sending"} className={primary}>
                {state === "sending" ? uz.review.submitting : state === "error" ? uz.review.retry : uz.review.submit}
                <Send className="size-4" aria-hidden />
              </button>
            </div>
          </section>
        ) : (
          <>
            <section className="rounded-2xl border border-slate-300 bg-white p-5 shadow-sm sm:p-7">
              <p className="mb-3 text-xs font-bold tracking-wide text-indigo-700 uppercase">
                {uz.quiz.questionHeading(current + 1, n)} · {uz.categories[q.category]}
              </p>
              <p className="text-[17px] leading-relaxed whitespace-pre-line">{q.prompt}</p>
              {q.code && (
                <pre className="mt-4 overflow-x-auto rounded-lg bg-slate-900 p-4 font-mono text-sm leading-relaxed text-slate-100">
                  {q.code}
                </pre>
              )}
              <fieldset className="mt-6 space-y-3" disabled={locked}>
                <legend className="sr-only">{uz.quiz.chooseOne}</legend>
                {q.options.map((opt, i) => {
                  const checked = answers[q.id] === opt.id;
                  return (
                    <label
                      key={opt.id}
                      className={`flex cursor-pointer items-start gap-3 rounded-xl border-2 p-4 ${
                        checked ? "border-indigo-700 bg-indigo-50" : "border-slate-300 hover:border-slate-500"
                      }`}
                    >
                      <input
                        type="radio"
                        name={`q${q.id}`}
                        checked={checked}
                        onChange={() => choose(q.id, opt.id)}
                        className="mt-1 size-4 shrink-0 accent-indigo-700"
                      />
                      <span>
                        <span className="mr-2 font-bold">{"ABCD"[i]}.</span>
                        {opt.text}
                      </span>
                    </label>
                  );
                })}
              </fieldset>
            </section>
            <div className="mt-4 flex justify-between gap-3">
              <button onClick={() => go(current - 1)} disabled={current === 0} className={secondary}>
                <ChevronLeft className="size-4" aria-hidden /> {uz.quiz.previous}
              </button>
              {current < n - 1 ? (
                <button onClick={() => go(current + 1)} className={primary}>
                  {uz.quiz.next} <ChevronRight className="size-4" aria-hidden />
                </button>
              ) : (
                <button onClick={() => setReviewing(true)} className={primary}>
                  {uz.quiz.review} <Send className="size-4" aria-hidden />
                </button>
              )}
            </div>
          </>
        )}
      </main>
    </div>
  );
}
