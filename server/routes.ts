import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { insertJobApplicationSchema } from "@shared/schema";
import { z } from "zod";

export async function registerRoutes(app: Express): Promise<Server> {
  // Get all applications
  app.get("/api/applications", async (req, res) => {
    try {
      const applications = await storage.getAllApplications();
      res.json(applications);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch applications" });
    }
  });

  // Get application by ID
  app.get("/api/applications/:id", async (req, res) => {
    try {
      const application = await storage.getApplicationById(req.params.id);
      if (!application) {
        return res.status(404).json({ message: "Application not found" });
      }
      res.json(application);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch application" });
    }
  });

  // Create new application
  app.post("/api/applications", async (req, res) => {
    try {
      const validatedData = insertJobApplicationSchema.parse(req.body);
      const application = await storage.createApplication(validatedData);
      res.status(201).json(application);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid application data", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to create application" });
    }
  });

  // Update application
  app.put("/api/applications/:id", async (req, res) => {
    try {
      const validatedData = insertJobApplicationSchema.partial().parse(req.body);
      const application = await storage.updateApplication(req.params.id, validatedData);
      if (!application) {
        return res.status(404).json({ message: "Application not found" });
      }
      res.json(application);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid application data", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to update application" });
    }
  });

  // Delete application
  app.delete("/api/applications/:id", async (req, res) => {
    try {
      const deleted = await storage.deleteApplication(req.params.id);
      if (!deleted) {
        return res.status(404).json({ message: "Application not found" });
      }
      res.json({ message: "Application deleted successfully" });
    } catch (error) {
      res.status(500).json({ message: "Failed to delete application" });
    }
  });

  // Get applications by status
  app.get("/api/applications/status/:status", async (req, res) => {
    try {
      const applications = await storage.getApplicationsByStatus(req.params.status);
      res.json(applications);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch applications by status" });
    }
  });

  // Search applications
  app.get("/api/applications/search/:query", async (req, res) => {
    try {
      const applications = await storage.searchApplications(req.params.query);
      res.json(applications);
    } catch (error) {
      res.status(500).json({ message: "Failed to search applications" });
    }
  });

  // Get application statistics
  app.get("/api/stats", async (req, res) => {
    try {
      const stats = await storage.getApplicationStats();
      res.json(stats);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch statistics" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
