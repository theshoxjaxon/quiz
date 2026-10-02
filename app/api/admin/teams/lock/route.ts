import { eq } from "drizzle-orm";
import { NextResponse } from "next/server";
import { db } from "@/db";
import { settings } from "@/db/schema";
import { TEAMS_LOCK, teamsLockedAt } from "@/lib/server";

// PUT locks the current teams (POST /api/admin/teams is rejected while locked); DELETE unlocks.
export function PUT() {
  db.insert(settings).values({ key: TEAMS_LOCK, value: new Date().toISOString() }).onConflictDoNothing().run();
  return NextResponse.json({ locked: true, lockedAt: teamsLockedAt() });
}

export function DELETE() {
  db.delete(settings).where(eq(settings.key, TEAMS_LOCK)).run();
  return NextResponse.json({ locked: false });
}
