import { type JobApplication, type InsertJobApplication, jobApplications } from "@shared/schema";
import { db } from "./db";
import { eq, desc, sql, ilike, or } from "drizzle-orm";

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

export class DatabaseStorage implements IStorage {
  async getAllApplications(): Promise<JobApplication[]> {
    return await db.select().from(jobApplications).orderBy(desc(jobApplications.createdAt));
  }

  async getApplicationById(id: string): Promise<JobApplication | undefined> {
    const [application] = await db.select().from(jobApplications).where(eq(jobApplications.id, id));
    return application || undefined;
  }

  async createApplication(insertApplication: InsertJobApplication): Promise<JobApplication> {
    const [application] = await db
      .insert(jobApplications)
      .values({
        ...insertApplication,
        status: insertApplication.status || "applied",
        applicationDate: insertApplication.applicationDate 
          ? new Date(insertApplication.applicationDate) 
          : new Date(),
        nextStepDate: insertApplication.nextStepDate 
          ? new Date(insertApplication.nextStepDate) 
          : null,
      })
      .returning();
    return application;
  }

  async updateApplication(id: string, updateData: Partial<InsertJobApplication>): Promise<JobApplication | undefined> {
    const [application] = await db
      .update(jobApplications)
      .set({
        ...updateData,
        applicationDate: updateData.applicationDate 
          ? new Date(updateData.applicationDate) 
          : undefined,
        nextStepDate: updateData.nextStepDate 
          ? new Date(updateData.nextStepDate) 
          : undefined,
        updatedAt: new Date(),
      })
      .where(eq(jobApplications.id, id))
      .returning();
    return application || undefined;
  }

  async deleteApplication(id: string): Promise<boolean> {
    const result = await db.delete(jobApplications).where(eq(jobApplications.id, id));
    return result.rowCount > 0;
  }

  async getApplicationsByStatus(status: string): Promise<JobApplication[]> {
    return await db
      .select()
      .from(jobApplications)
      .where(eq(jobApplications.status, status))
      .orderBy(desc(jobApplications.createdAt));
  }

  async searchApplications(query: string): Promise<JobApplication[]> {
    return await db
      .select()
      .from(jobApplications)
      .where(
        or(
          ilike(jobApplications.company, `%${query}%`),
          ilike(jobApplications.position, `%${query}%`),
          ilike(jobApplications.status, `%${query}%`)
        )
      )
      .orderBy(desc(jobApplications.createdAt));
  }

  async getApplicationStats(): Promise<{
    total: number;
    interviews: number;
    offers: number;
    rejected: number;
    responseRate: number;
  }> {
    const [stats] = await db
      .select({
        total: sql<number>`cast(count(*) as integer)`,
        interviews: sql<number>`cast(count(*) filter (where status = 'interview') as integer)`,
        offers: sql<number>`cast(count(*) filter (where status = 'offer') as integer)`,
        rejected: sql<number>`cast(count(*) filter (where status = 'rejected') as integer)`,
      })
      .from(jobApplications);

    const responded = stats.interviews + stats.offers + stats.rejected;
    const responseRate = stats.total > 0 ? Math.round((responded / stats.total) * 100) : 0;

    return {
      total: stats.total,
      interviews: stats.interviews,
      offers: stats.offers,
      rejected: stats.rejected,
      responseRate,
    };
  }
}

export const storage = new DatabaseStorage();
