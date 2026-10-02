import { eq } from "drizzle-orm";
import { NextResponse } from "next/server";
import { db } from "@/db";
import { settings } from "@/db/schema";
import { TEAMS_LOCK, teamsLockedAt } from "@/lib/server";

// PUT locks the current teams (POST /api/admin/teams is rejected while locked); DELETE unlocks.
// Each is a single statement, so it is atomic on its own.
export async function PUT() {
  await db.insert(settings).values({ key: TEAMS_LOCK, value: new Date().toISOString() }).onConflictDoNothing();
  return NextResponse.json({ locked: true, lockedAt: await teamsLockedAt() });
}

export async function DELETE() {
  await db.delete(settings).where(eq(settings.key, TEAMS_LOCK));
  return NextResponse.json({ locked: false });
}
