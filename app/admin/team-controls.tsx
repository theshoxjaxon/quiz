"use client";

import { Lock, LockOpen, Shuffle } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";

type Props = { submitted: number; total: number; hasTeams: boolean; locked: boolean };

export default function TeamControls({ submitted, total, hasTeams, locked }: Props) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);

  async function call(method: string, url: string, failMessage: string) {
    setBusy(true);
    const res = await fetch(url, { method }).catch(() => null);
    if (!res?.ok) alert((await res?.json().catch(() => null))?.error ?? failMessage);
    setBusy(false);
    router.refresh();
  }

  function generate() {
    const warning = hasTeams ? "\n\nTeams already exist. This will re-pick Team 1 and reshuffle Teams 2–6." : "";
    if (!confirm(`${submitted} of ${total} registered students have submitted.${warning}\n\nGenerate hackathon teams now?`)) return;
    call("POST", "/api/admin/teams", "Couldn't generate teams. Please try again.");
  }

  const base = "flex items-center gap-2 rounded-lg px-4 py-2.5 font-semibold disabled:opacity-50";
  return (
    <>
      <button
        onClick={generate}
        disabled={busy || locked || total === 0}
        title={locked ? "Teams are locked. Unlock to regenerate." : undefined}
        className={`${base} bg-indigo-700 text-white hover:bg-indigo-800`}
      >
        <Shuffle className="size-4" aria-hidden />
        {busy ? "Working…" : "Generate Hackathon Teams"}
      </button>
      {(hasTeams || locked) && (
        <button
          onClick={() => call(locked ? "DELETE" : "PUT", "/api/admin/teams/lock", "Couldn't change the lock. Please try again.")}
          disabled={busy}
          className={`${base} border ${locked ? "border-amber-600 bg-amber-50 text-amber-900" : "border-slate-400 bg-white hover:bg-slate-50"}`}
        >
          {locked ? <LockOpen className="size-4" aria-hidden /> : <Lock className="size-4" aria-hidden />}
          {locked ? "Unlock teams" : "Lock teams"}
        </button>
      )}
    </>
  );
}
