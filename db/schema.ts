import { integer, jsonb, pgTable, text, timestamp } from "drizzle-orm/pg-core";
import { CATEGORIES } from "../lib/quiz.ts";

// Row-level security is enabled on every table with no policies: Supabase's public Data API (anon key)
// can't read or write anything, while the app, connecting as the owning postgres role, is unaffected.

export const teams = pgTable("teams", {
  id: integer("id").primaryKey(), // 1 = Varsity / Alpha, 2–6 = random
  name: text("name").notNull(),
}).enableRLS();

export const students = pgTable("students", {
  id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
  name: text("name").notNull(),
  nameKey: text("name_key").notNull().unique(), // nameKey(name): trimmed, case-folded; one registration per name
  studentId: text("student_id").notNull().unique(), // school ID or email, lowercased
  token: text("token").notNull().unique(), // session cookie value
  startedAt: timestamp("started_at", { withTimezone: true }).notNull(),
  teamId: integer("team_id").references(() => teams.id),
}).enableRLS();

export const questions = pgTable("questions", {
  id: integer("id").primaryKey(), // also the display order
  category: text("category", { enum: CATEGORIES }).notNull(),
  prompt: text("prompt").notNull(),
  code: text("code"), // optional monospace snippet
  options: jsonb("options").$type<string[]>().notNull(),
  correctIndex: integer("correct_index").notNull(),
  points: integer("points").notNull(),
}).enableRLS();

export const submissions = pgTable("submissions", {
  id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
  studentId: integer("student_id")
    .notNull()
    .unique() // one submission per student
    .references(() => students.id),
  answers: jsonb("answers").$type<Record<string, number>>().notNull(), // questionId -> option ID
  score: integer("score").notNull(),
  timeTakenSec: integer("time_taken_sec").notNull(),
  submittedAt: timestamp("submitted_at", { withTimezone: true }).notNull(),
}).enableRLS();

// Key/value app state. "teamsLockedAt" present = teams are locked.
export const settings = pgTable("settings", {
  key: text("key").primaryKey(),
  value: text("value").notNull(),
}).enableRLS();
