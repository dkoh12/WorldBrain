import { sql } from "drizzle-orm";
import { pgTable, text, varchar, jsonb, bigint } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
});

export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
});

export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;

// Shared Snapshots for project sharing
export const sharedSnapshots = pgTable("shared_snapshots", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  tool: text("tool").notNull(), // 'code' | '3d' | 'music' | 'video'
  name: text("name").notNull(),
  data: jsonb("data").notNull(), // Project data
  createdAt: bigint("created_at", { mode: "number" }).notNull().default(sql`extract(epoch from now()) * 1000`),
});

export const insertSharedSnapshotSchema = createInsertSchema(sharedSnapshots).omit({
  id: true,
  createdAt: true,
});

export type InsertSharedSnapshot = z.infer<typeof insertSharedSnapshotSchema>;
export type SharedSnapshot = typeof sharedSnapshots.$inferSelect;
