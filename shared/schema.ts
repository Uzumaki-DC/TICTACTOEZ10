import { pgTable, text, serial, integer, boolean, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
});

export const gameSessions = pgTable("game_sessions", {
  id: serial("id").primaryKey(),
  sessionCode: text("session_code").notNull().unique(),
  hostPlayerId: text("host_player_id").notNull(),
  guestPlayerId: text("guest_player_id"),
  gameBoard: text("game_board").notNull().default("null,null,null,null,null,null,null,null,null"),
  currentPlayer: text("current_player").notNull().default("X"),
  gameStatus: text("game_status").notNull().default("waiting"), // waiting, playing, finished
  winner: text("winner"), // X, O, or draw
  hostScore: integer("host_score").notNull().default(0),
  guestScore: integer("guest_score").notNull().default(0),
  draws: integer("draws").notNull().default(0),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
});

export const insertGameSessionSchema = createInsertSchema(gameSessions).pick({
  sessionCode: true,
  hostPlayerId: true,
  guestPlayerId: true,
  gameBoard: true,
  currentPlayer: true,
  gameStatus: true,
  winner: true,
  hostScore: true,
  guestScore: true,
  draws: true,
});

export const updateGameSessionSchema = createInsertSchema(gameSessions).pick({
  gameBoard: true,
  currentPlayer: true,
  gameStatus: true,
  winner: true,
  hostScore: true,
  guestScore: true,
  draws: true,
}).partial();

export const joinGameSessionSchema = createInsertSchema(gameSessions).pick({
  guestPlayerId: true,
}).partial();

export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;
export type GameSession = typeof gameSessions.$inferSelect;
export type InsertGameSession = z.infer<typeof insertGameSessionSchema>;
export type UpdateGameSession = z.infer<typeof updateGameSessionSchema>;
