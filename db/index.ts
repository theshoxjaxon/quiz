import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";

const MISSING_URL = `DATABASE_URL is not set.
Create a free Supabase project for development, open Connect → "Transaction pooler", copy the
connection string (port 6543), put your database password in it, and add it to .env.local:
  DATABASE_URL=postgresql://postgres.<project-ref>:<password>@aws-0-<region>.pooler.supabase.com:6543/postgres
On Vercel, add DATABASE_URL in Project → Settings → Environment Variables. See README.md.`;

export function databaseUrl() {
  const url = process.env.DATABASE_URL;
  if (!url) throw new Error(MISSING_URL);
  return url;
}

let client: postgres.Sql | undefined;
let instance: ReturnType<typeof drizzle> | undefined;

// Connects on first use, so `next build` and the offline tests never need DATABASE_URL.
export function db() {
  if (!instance) {
    client = postgres(databaseUrl(), {
      prepare: false, // Supabase's transaction pooler (port 6543) doesn't support prepared statements
      max: 1, // one connection per serverless instance; the pooler does the rest
      idle_timeout: 20, // seconds: let idle instances drop their connection
      onnotice: () => {}, // silence "already exists, skipping" notices from migrations
    });
    instance = drizzle(client);
  }
  return instance;
}

export type Tx = Parameters<Parameters<ReturnType<typeof db>["transaction"]>[0]>[0];

export async function closeDb() {
  await client?.end();
}
