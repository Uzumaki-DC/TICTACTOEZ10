import { gameSessions, type GameSession, type InsertGameSession, type UpdateGameSession, users, type User, type InsertUser } from "@shared/schema";
import { drizzle } from "drizzle-orm/neon-http";
import { neon } from "@neondatabase/serverless";
import { eq } from "drizzle-orm";

export interface IStorage {
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  
  createGameSession(session: InsertGameSession): Promise<GameSession>;
  getGameSession(sessionCode: string): Promise<GameSession | undefined>;
  updateGameSession(sessionCode: string, updates: UpdateGameSession): Promise<GameSession | undefined>;
  deleteGameSession(sessionCode: string): Promise<boolean>;
  getActiveSessions(): Promise<GameSession[]>;
}

// Database storage implementation
export class DatabaseStorage implements IStorage {
  private db: any;

  constructor() {
    if (process.env.DATABASE_URL) {
      try {
        const sql = neon(process.env.DATABASE_URL);
        this.db = drizzle(sql);
        console.log('Database storage initialized');
      } catch (error) {
        console.warn('Failed to initialize database:', error);
        this.db = null;
      }
    } else {
      this.db = null;
    }
  }

  async getUser(id: number): Promise<User | undefined> {
    if (!this.db) return undefined;
    try {
      const result = await this.db.select().from(users).where(eq(users.id, id));
      return result[0];
    } catch (error) {
      console.error('Database error in getUser:', error);
      return undefined;
    }
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    if (!this.db) return undefined;
    try {
      const result = await this.db.select().from(users).where(eq(users.username, username));
      return result[0];
    } catch (error) {
      console.error('Database error in getUserByUsername:', error);
      return undefined;
    }
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    if (!this.db) throw new Error('Database not available');
    try {
      const result = await this.db.insert(users).values(insertUser).returning();
      return result[0];
    } catch (error) {
      console.error('Database error in createUser:', error);
      throw error;
    }
  }

  async createGameSession(insertSession: InsertGameSession): Promise<GameSession> {
    if (!this.db) throw new Error('Database not available');
    try {
      console.log('DatabaseStorage createGameSession called with:', insertSession);
      const result = await this.db.insert(gameSessions).values(insertSession).returning();
      console.log('Database session created:', result[0]);
      return result[0];
    } catch (error) {
      console.error('Database error in createGameSession:', error);
      throw error;
    }
  }

  async getGameSession(sessionCode: string): Promise<GameSession | undefined> {
    if (!this.db) return undefined;
    try {
      const result = await this.db.select().from(gameSessions).where(eq(gameSessions.sessionCode, sessionCode));
      return result[0];
    } catch (error) {
      console.error('Database error in getGameSession:', error);
      return undefined;
    }
  }

  async updateGameSession(sessionCode: string, updates: UpdateGameSession): Promise<GameSession | undefined> {
    if (!this.db) return undefined;
    try {
      const result = await this.db
        .update(gameSessions)
        .set({ ...updates, updatedAt: new Date() })
        .where(eq(gameSessions.sessionCode, sessionCode))
        .returning();
      return result[0];
    } catch (error) {
      console.error('Database error in updateGameSession:', error);
      return undefined;
    }
  }

  async deleteGameSession(sessionCode: string): Promise<boolean> {
    if (!this.db) return false;
    try {
      await this.db.delete(gameSessions).where(eq(gameSessions.sessionCode, sessionCode));
      return true;
    } catch (error) {
      console.error('Database error in deleteGameSession:', error);
      return false;
    }
  }

  async getActiveSessions(): Promise<GameSession[]> {
    if (!this.db) return [];
    try {
      const result = await this.db.select().from(gameSessions).where(eq(gameSessions.gameStatus, 'playing'));
      return result;
    } catch (error) {
      console.error('Database error in getActiveSessions:', error);
      return [];
    }
  }
}

export class MemStorage implements IStorage {
  private users: Map<number, User>;
  private gameSessions: Map<string, GameSession>;
  private currentUserId: number;
  private currentSessionId: number;

  constructor() {
    this.users = new Map();
    this.gameSessions = new Map();
    this.currentUserId = 1;
    this.currentSessionId = 1;
  }

  async getUser(id: number): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.username === username,
    );
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = this.currentUserId++;
    const user: User = { ...insertUser, id };
    this.users.set(id, user);
    return user;
  }

  async createGameSession(insertSession: any): Promise<GameSession> {
    try {
      console.log('MemStorage createGameSession called with:', insertSession);
      
      const id = this.currentSessionId++;
      const now = new Date();
      
      const session: GameSession = {
        id,
        sessionCode: insertSession.sessionCode,
        hostPlayerId: insertSession.hostPlayerId,
        guestPlayerId: insertSession.guestPlayerId || null,
        gameBoard: insertSession.gameBoard || "null,null,null,null,null,null,null,null,null",
        currentPlayer: insertSession.currentPlayer || "X",
        gameStatus: insertSession.gameStatus || "waiting",
        winner: insertSession.winner || null,
        hostScore: insertSession.hostScore || 0,
        guestScore: insertSession.guestScore || 0,
        draws: insertSession.draws || 0,
        createdAt: now,
        updatedAt: now,
      };
      
      console.log('Created session object:', session);
      this.gameSessions.set(insertSession.sessionCode, session);
      console.log('Session stored in memory');
      
      return session;
    } catch (error) {
      console.error('Error in createGameSession:', error);
      throw error;
    }
  }

  async getGameSession(sessionCode: string): Promise<GameSession | undefined> {
    return this.gameSessions.get(sessionCode);
  }

  async updateGameSession(sessionCode: string, updates: UpdateGameSession | GameSession): Promise<GameSession | undefined> {
    const session = this.gameSessions.get(sessionCode);
    if (!session) return undefined;

    const updatedSession: GameSession = {
      ...session,
      ...updates,
      updatedAt: new Date(),
    };
    this.gameSessions.set(sessionCode, updatedSession);
    return updatedSession;
  }

  async deleteGameSession(sessionCode: string): Promise<boolean> {
    return this.gameSessions.delete(sessionCode);
  }

  async getActiveSessions(): Promise<GameSession[]> {
    return Array.from(this.gameSessions.values()).filter(
      session => session.gameStatus !== "finished"
    );
  }
}

// Initialize storage based on environment
function createStorage(): IStorage {
  if (process.env.DATABASE_URL) {
    console.log('DATABASE_URL found, but using memory storage for now due to connection issues');
    console.log('This will work for development and will be ready for production when database is properly configured');
    return new MemStorage();
    
    // TODO: Enable database storage once connection issues are resolved
    // try {
    //   return new DatabaseStorage();
    // } catch (error) {
    //   console.warn('Database storage failed, falling back to memory storage:', error);
    //   return new MemStorage();
    // }
  } else {
    console.log('Using memory storage (no DATABASE_URL provided)');
    return new MemStorage();
  }
}

export const storage = createStorage();
