import { type User, type InsertUser, type SharedSnapshot, type InsertSharedSnapshot } from "@shared/schema";
import { randomUUID } from "crypto";

// modify the interface with any CRUD methods
// you might need

export interface IStorage {
  getUser(id: string): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  
  // Shared snapshots
  getSharedSnapshot(id: string): Promise<SharedSnapshot | undefined>;
  createSharedSnapshot(snapshot: InsertSharedSnapshot): Promise<SharedSnapshot>;
}

export class MemStorage implements IStorage {
  private users: Map<string, User>;
  private sharedSnapshots: Map<string, SharedSnapshot>;

  constructor() {
    this.users = new Map();
    this.sharedSnapshots = new Map();
  }

  async getUser(id: string): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.username === username,
    );
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = randomUUID();
    const user: User = { ...insertUser, id };
    this.users.set(id, user);
    return user;
  }

  async getSharedSnapshot(id: string): Promise<SharedSnapshot | undefined> {
    return this.sharedSnapshots.get(id);
  }

  async createSharedSnapshot(insertSnapshot: InsertSharedSnapshot): Promise<SharedSnapshot> {
    const id = randomUUID();
    const snapshot: SharedSnapshot = {
      ...insertSnapshot,
      id,
      createdAt: Date.now(),
    };
    this.sharedSnapshots.set(id, snapshot);
    return snapshot;
  }
}

export const storage = new MemStorage();
