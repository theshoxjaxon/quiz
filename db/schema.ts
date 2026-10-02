import { integer, sqliteTable, text } from "drizzle-orm/sqlite-core";
import { CATEGORIES } from "../lib/quiz.ts";

export const teams = sqliteTable("teams", {
  id: integer("id").primaryKey(), // 1 = Varsity / Alpha, 2–6 = random
  name: text("name").notNull(),
});

export const students = sqliteTable("students", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  name: text("name").notNull(),
  nameKey: text("name_key").notNull().unique(), // nameKey(name): trimmed, case-folded; one registration per name
  studentId: text("student_id").notNull().unique(), // school ID or email, lowercased
  token: text("token").notNull().unique(), // session cookie value
  startedAt: integer("started_at", { mode: "timestamp_ms" }).notNull(),
  teamId: integer("team_id").references(() => teams.id),
});

export const questions = sqliteTable("questions", {
  id: integer("id").primaryKey(), // also the display order
  category: text("category", { enum: CATEGORIES }).notNull(), // enum is type-only in SQLite (no CHECK)
  prompt: text("prompt").notNull(),
  code: text("code"), // optional monospace snippet
  options: text("options", { mode: "json" }).$type<string[]>().notNull(),
  correctIndex: integer("correct_index").notNull(),
  points: integer("points").notNull(),
});

export const submissions = sqliteTable("submissions", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  studentId: integer("student_id")
    .notNull()
    .unique() // one submission per student
    .references(() => students.id),
  answers: text("answers", { mode: "json" }).$type<Record<string, number>>().notNull(), // questionId -> option index
  score: integer("score").notNull(),
  timeTakenSec: integer("time_taken_sec").notNull(),
  submittedAt: integer("submitted_at", { mode: "timestamp_ms" }).notNull(),
});

// Key/value app state. "teamsLockedAt" present = teams are locked.
export const settings = sqliteTable("settings", {
  key: text("key").primaryKey(),
  value: text("value").notNull(),
});
