"use client";

import { ArrowRight } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState, type SubmitEvent } from "react";
import { uz } from "@/lib/i18n/uz";

const t = uz.register;
const input =
  "w-full rounded-lg border border-slate-400 px-3 py-2.5 outline-none focus:border-indigo-700 focus:ring-2 focus:ring-indigo-700/30";

export default function RegisterForm({ minutes }: { minutes: number }) {
  const router = useRouter();
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  async function start(e: SubmitEvent<HTMLFormElement>) {
    e.preventDefault();
    setBusy(true);
    setError("");
    try {
      const res = await fetch("/api/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(Object.fromEntries(new FormData(e.currentTarget))),
      });
      if (res.ok) return router.push("/quiz");
      setError((await res.json().catch(() => null))?.error ?? t.serverError(res.status));
    } catch {
      setError(t.networkError);
    }
    setBusy(false);
  }

  return (
    <form onSubmit={start} className="space-y-4 rounded-2xl border border-slate-300 bg-white p-6 shadow-sm">
      <label className="block">
        <span className="mb-1 block text-sm font-semibold">{t.nameLabel}</span>
        <input name="name" required minLength={2} maxLength={80} autoComplete="name" className={input} />
      </label>
      <label className="block">
        <span className="mb-1 block text-sm font-semibold">{t.idLabel}</span>
        <input name="studentId" required maxLength={80} autoCapitalize="none" className={input} />
      </label>

      {error && (
        <p role="alert" className="rounded-lg bg-red-50 px-3 py-2 text-sm font-medium text-red-800">
          {error}
        </p>
      )}

      <button
        disabled={busy}
        className="flex w-full items-center justify-center gap-2 rounded-lg bg-indigo-700 px-4 py-3 font-semibold text-white hover:bg-indigo-800 disabled:opacity-60"
      >
        {busy ? t.starting : t.start}
        <ArrowRight className="size-4" aria-hidden />
      </button>
      <p className="text-center text-xs text-slate-600">{t.timerNote(minutes)}</p>
    </form>
  );
}
