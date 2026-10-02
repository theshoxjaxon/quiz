import { eq } from "drizzle-orm";
import { NextResponse } from "next/server";
import { settings } from "@/db/schema";
import { TEAMS_LOCK, teamsLockedAt, withTeamsMutex } from "@/lib/server";

// PUT locks the current teams (POST /api/admin/teams is rejected while locked); DELETE unlocks.
// Both take the teams mutex, so they wait for a team generation that is already running.
export async function PUT() {
  const lockedAt = await withTeamsMutex(async (tx) => {
    await tx.insert(settings).values({ key: TEAMS_LOCK, value: new Date().toISOString() }).onConflictDoNothing();
    return teamsLockedAt(tx);
  });
  return NextResponse.json({ locked: true, lockedAt });
}

export async function DELETE() {
  await withTeamsMutex((tx) => tx.delete(settings).where(eq(settings.key, TEAMS_LOCK)));
  return NextResponse.json({ locked: false });
}
