import { eq } from "drizzle-orm";
import { NextResponse } from "next/server";
import { students } from "@/db/schema";
import { getResults, teamsLockedAt, withTeamsMutex } from "@/lib/server";
import { makeTeams } from "@/lib/teams";

// Top 5 by rank -> Team 1, everyone else shuffled into Teams 2–6. Re-running reshuffles,
// unless the teacher locked the teams (see ./lock).
export async function POST() {
  // Read the ranking first: with one connection per instance, it can't run inside the transaction below.
  const groups = makeTeams((await getResults()).students);

  // One transaction holding the teams mutex: the lock check and every update see the same state, and a
  // concurrent lock/unlock waits for this to finish, so teams are never half-reshuffled.
  const applied = await withTeamsMutex(async (tx) => {
    if (await teamsLockedAt(tx)) return false;
    for (const [i, group] of groups.entries()) {
      for (const s of group) await tx.update(students).set({ teamId: i + 1 }).where(eq(students.id, s.id));
    }
    return true;
  });

  if (!applied) {
    return NextResponse.json({ error: "Teams are locked. Unlock them before regenerating." }, { status: 409 });
  }
  return NextResponse.json({ teams: groups.map((g, i) => ({ team: i + 1, members: g.map((s) => s.name) })) });
}
