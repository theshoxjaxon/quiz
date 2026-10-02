import { and, eq, notExists } from "drizzle-orm";
import { NextResponse } from "next/server";
import { db } from "@/db";
import { settings, students } from "@/db/schema";
import { getResults, TEAMS_LOCK, teamsLockedAt } from "@/lib/server";
import { makeTeams } from "@/lib/teams";

const lockedResponse = () =>
  NextResponse.json({ error: "Teams are locked. Unlock them before regenerating." }, { status: 409 });

// Top 5 by rank -> Team 1, everyone else shuffled into Teams 2–6. Re-running reshuffles,
// unless the teacher locked the teams (see ./lock).
export async function POST() {
  if (await teamsLockedAt()) return lockedResponse();

  const groups = makeTeams((await getResults()).students);
  // One batch = one transaction, and every update re-checks the lock inside it. A lock that lands
  // after the check above (another request, another server instance) blocks the whole regeneration,
  // so teams are never half-reshuffled.
  const unlocked = notExists(db.select().from(settings).where(eq(settings.key, TEAMS_LOCK)));
  const updates = groups.flatMap((group, i) =>
    group.map((s) => db.update(students).set({ teamId: i + 1 }).where(and(eq(students.id, s.id), unlocked))),
  );
  if (updates.length > 0) {
    const results = await db.batch(updates as [(typeof updates)[number], ...typeof updates]);
    if (results.every((r) => r.rowsAffected === 0) && (await teamsLockedAt())) return lockedResponse();
  }
  return NextResponse.json({ teams: groups.map((g, i) => ({ team: i + 1, members: g.map((s) => s.name) })) });
}
