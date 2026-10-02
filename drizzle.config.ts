import { defineConfig } from "drizzle-kit";

// Only used to write migration files after editing db/schema.ts: `npm run db:generate`.
// It never connects to a database; `npm run setup` applies the files in drizzle/.
export default defineConfig({
  dialect: "sqlite",
  schema: "./db/schema.ts",
  out: "./drizzle",
});
