import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { insertJobApplicationSchema } from "@shared/schema";
import { LinkedInService } from "./linkedin-service";
import { linkedInJobSchema, bulkImportSchema } from "@shared/linkedin-types";
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

  // LinkedIn Integration Routes
  
  // Parse LinkedIn job URL or text
  app.post("/api/linkedin/parse-job", async (req, res) => {
    try {
      const { jobUrl, jobText } = req.body;
      
      if (!jobUrl && !jobText) {
        return res.status(400).json({ message: "Either jobUrl or jobText is required" });
      }

      let jobData;
      
      if (jobText) {
        // Parse from pasted text
        jobData = LinkedInService.parseJobFromText(jobText, jobUrl);
      } else if (jobUrl) {
        // Parse from URL
        jobData = await LinkedInService.parseJobUrl(jobUrl);
        if (!jobData) {
          return res.status(400).json({ message: "Failed to parse LinkedIn job URL" });
        }
      }

      res.json(jobData);
    } catch (error) {
      console.error("LinkedIn job parsing error:", error);
      res.status(500).json({ message: "Failed to parse LinkedIn job data" });
    }
  });

  // Bulk import from CSV
  app.post("/api/linkedin/bulk-import", async (req, res) => {
    try {
      const { csvData } = req.body;
      
      if (!csvData) {
        return res.status(400).json({ message: "CSV data is required" });
      }

      const jobs = LinkedInService.parseCsvData(csvData);
      const applications = [];

      // Convert parsed jobs to applications and save them
      for (const job of jobs) {
        const applicationData = {
          company: job.company || "Unknown Company",
          position: job.title || "Unknown Position",
          status: "applied" as const,
          location: job.location || "",
          jobUrl: job.jobUrl || "",
          notes: job.description ? `LinkedIn Import: ${job.description.substring(0, 200)}...` : "Imported from LinkedIn",
          applicationDate: new Date().toISOString(),
        };

        try {
          const validatedData = insertJobApplicationSchema.parse(applicationData);
          const application = await storage.createApplication(validatedData);
          applications.push(application);
        } catch (validationError) {
          console.error("Validation error for application:", validationError);
          // Continue with other applications even if one fails
        }
      }

      res.json({
        message: `Successfully imported ${applications.length} applications`,
        applications,
        totalProcessed: jobs.length,
      });
    } catch (error) {
      console.error("Bulk import error:", error);
      res.status(500).json({ message: "Failed to import applications" });
    }
  });

  // Create application from LinkedIn job data
  app.post("/api/linkedin/create-application", async (req, res) => {
    try {
      const { jobData, applicationData = {} } = req.body;
      
      if (!jobData?.title || !jobData?.company) {
        return res.status(400).json({ message: "Job title and company are required" });
      }

      const mergedData = {
        company: jobData.company,
        position: jobData.title,
        status: "applied" as const,
        location: jobData.location || "",
        jobUrl: jobData.jobUrl || "",
        notes: jobData.description ? `LinkedIn Import: ${jobData.description.substring(0, 200)}...` : "",
        applicationDate: new Date().toISOString(),
        ...applicationData, // Allow overrides
      };

      const validatedData = insertJobApplicationSchema.parse(mergedData);
      const application = await storage.createApplication(validatedData);
      
      res.status(201).json(application);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid application data", errors: error.errors });
      }
      console.error("LinkedIn application creation error:", error);
      res.status(500).json({ message: "Failed to create application from LinkedIn data" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
