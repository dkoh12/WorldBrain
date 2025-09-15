import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { insertSharedSnapshotSchema } from "@shared/schema";

export async function registerRoutes(app: Express): Promise<Server> {
  // put application routes here
  // prefix all routes with /api

  // use storage to perform CRUD operations on the storage interface
  // e.g. storage.insertUser(user) or storage.getUserByUsername(username)

  // Share endpoints
  app.post("/api/share", async (req, res) => {
    try {
      const validatedData = insertSharedSnapshotSchema.parse(req.body);
      const snapshot = await storage.createSharedSnapshot(validatedData);
      const shareUrl = `${req.protocol}://${req.get('host')}/share/${snapshot.id}`;
      return res.json({ 
        success: true, 
        id: snapshot.id, 
        url: shareUrl 
      });
    } catch (error) {
      console.error('Error creating shared snapshot:', error);
      return res.status(400).json({ 
        success: false, 
        error: 'Invalid data provided' 
      });
    }
  });

  app.get("/api/share/:id", async (req, res) => {
    try {
      const snapshot = await storage.getSharedSnapshot(req.params.id);
      if (!snapshot) {
        return res.status(404).json({ 
          success: false, 
          error: 'Snapshot not found' 
        });
      }
      return res.json({ 
        success: true, 
        snapshot 
      });
    } catch (error) {
      console.error('Error retrieving shared snapshot:', error);
      return res.status(500).json({ 
        success: false, 
        error: 'Server error' 
      });
    }
  });

  const httpServer = createServer(app);

  return httpServer;
}
