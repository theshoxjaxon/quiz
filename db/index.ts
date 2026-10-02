import { createClient } from "@libsql/client";
import { drizzle } from "drizzle-orm/libsql";

// Turso when TURSO_DATABASE_URL is set (Vercel, or a one-off `npm run setup` for a deploy).
// Otherwise a local SQLite file, so `npm run dev` and the tests work offline.
export const dbUrl = process.env.TURSO_DATABASE_URL || "file:quiz.db";
export const isRemote = !dbUrl.startsWith("file:");

if (process.env.VERCEL && !isRemote) {
  // Vercel's filesystem is read-only and not shared between requests, so a local file can't work there.
  throw new Error("TURSO_DATABASE_URL is not set. Add TURSO_DATABASE_URL and TURSO_AUTH_TOKEN in the Vercel project settings.");
}

export const client = createClient({
  url: dbUrl,
  authToken: process.env.TURSO_AUTH_TOKEN || undefined,
  timeout: 5000, // busy timeout for local files; Turso queues concurrent writes itself
});

export const db = drizzle(client);
