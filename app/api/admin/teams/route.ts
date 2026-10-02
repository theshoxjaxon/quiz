import { eq } from "drizzle-orm";
import { NextResponse } from "next/server";
import { db } from "@/db";
import { students } from "@/db/schema";
import { getResults, teamsLockedAt } from "@/lib/server";
import { makeTeams } from "@/lib/teams";

// Top 5 by rank -> Team 1, everyone else shuffled into Teams 2–6. Re-running reshuffles,
// unless the teacher locked the teams (see ./lock).
export function POST() {
  if (teamsLockedAt()) {
    return NextResponse.json({ error: "Teams are locked. Unlock them before regenerating." }, { status: 409 });
  }
  const groups = makeTeams(getResults().students);
  db.transaction((tx) =>
    groups.forEach((group, i) =>
      group.forEach((s) => tx.update(students).set({ teamId: i + 1 }).where(eq(students.id, s.id)).run()),
    ),
  );
  return NextResponse.json({ teams: groups.map((g, i) => ({ team: i + 1, members: g.map((s) => s.name) })) });
}
