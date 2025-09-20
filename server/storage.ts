import { type JobApplication, type InsertJobApplication } from "@shared/schema";
import { randomUUID } from "crypto";

export interface IStorage {
  // Job Applications
  getAllApplications(): Promise<JobApplication[]>;
  getApplicationById(id: string): Promise<JobApplication | undefined>;
  createApplication(application: InsertJobApplication): Promise<JobApplication>;
  updateApplication(id: string, application: Partial<InsertJobApplication>): Promise<JobApplication | undefined>;
  deleteApplication(id: string): Promise<boolean>;
  getApplicationsByStatus(status: string): Promise<JobApplication[]>;
  searchApplications(query: string): Promise<JobApplication[]>;
  getApplicationStats(): Promise<{
    total: number;
    interviews: number;
    offers: number;
    rejected: number;
    responseRate: number;
  }>;
}

export class MemStorage implements IStorage {
  private applications: Map<string, JobApplication>;

  constructor() {
    this.applications = new Map();
  }

  async getAllApplications(): Promise<JobApplication[]> {
    return Array.from(this.applications.values()).sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
  }

  async getApplicationById(id: string): Promise<JobApplication | undefined> {
    return this.applications.get(id);
  }

  async createApplication(insertApplication: InsertJobApplication): Promise<JobApplication> {
    const id = randomUUID();
    const now = new Date();
    const application: JobApplication = {
      ...insertApplication,
      id,
      status: insertApplication.status || "applied",
      salary: insertApplication.salary ?? null,
      location: insertApplication.location ?? null,
      jobUrl: insertApplication.jobUrl ?? null,
      notes: insertApplication.notes ?? null,
      contactEmail: insertApplication.contactEmail ?? null,
      contactName: insertApplication.contactName ?? null,
      applicationDate: insertApplication.applicationDate 
        ? new Date(insertApplication.applicationDate) 
        : now,
      nextStepDate: insertApplication.nextStepDate 
        ? new Date(insertApplication.nextStepDate) 
        : null,
      createdAt: now,
      updatedAt: now,
    };
    this.applications.set(id, application);
    return application;
  }

  async updateApplication(id: string, updateData: Partial<InsertJobApplication>): Promise<JobApplication | undefined> {
    const application = this.applications.get(id);
    if (!application) return undefined;

    const updatedApplication: JobApplication = {
      ...application,
      ...updateData,
      applicationDate: updateData.applicationDate 
        ? new Date(updateData.applicationDate) 
        : application.applicationDate,
      nextStepDate: updateData.nextStepDate 
        ? new Date(updateData.nextStepDate) 
        : application.nextStepDate,
      updatedAt: new Date(),
    };

    this.applications.set(id, updatedApplication);
    return updatedApplication;
  }

  async deleteApplication(id: string): Promise<boolean> {
    return this.applications.delete(id);
  }

  async getApplicationsByStatus(status: string): Promise<JobApplication[]> {
    return Array.from(this.applications.values())
      .filter(app => app.status === status)
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }

  async searchApplications(query: string): Promise<JobApplication[]> {
    const lowerQuery = query.toLowerCase();
    return Array.from(this.applications.values())
      .filter(app => 
        app.company.toLowerCase().includes(lowerQuery) ||
        app.position.toLowerCase().includes(lowerQuery) ||
        app.status.toLowerCase().includes(lowerQuery)
      )
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }

  async getApplicationStats(): Promise<{
    total: number;
    interviews: number;
    offers: number;
    rejected: number;
    responseRate: number;
  }> {
    const applications = Array.from(this.applications.values());
    const total = applications.length;
    const interviews = applications.filter(app => app.status === "interview").length;
    const offers = applications.filter(app => app.status === "offer").length;
    const rejected = applications.filter(app => app.status === "rejected").length;
    const responded = interviews + offers + rejected;
    const responseRate = total > 0 ? Math.round((responded / total) * 100) : 0;

    return {
      total,
      interviews,
      offers,
      rejected,
      responseRate,
    };
  }
}

export const storage = new MemStorage();
