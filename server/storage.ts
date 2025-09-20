import { type JobApplication, type InsertJobApplication, jobApplications, type Interview, type InsertInterview, interviews } from "@shared/schema";
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
  
  // Interviews
  getInterviewsByApplicationId(applicationId: string): Promise<Interview[]>;
  getInterviewById(id: string): Promise<Interview | undefined>;
  createInterview(interview: InsertInterview): Promise<Interview>;
  updateInterview(id: string, interview: Partial<InsertInterview>): Promise<Interview | undefined>;
  deleteInterview(id: string): Promise<boolean>;
  getUpcomingInterviews(): Promise<Interview[]>;
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
    return result.rowCount ? result.rowCount > 0 : false;
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

  // Interview methods
  async getInterviewsByApplicationId(applicationId: string): Promise<Interview[]> {
    return await db
      .select()
      .from(interviews)
      .where(eq(interviews.applicationId, applicationId))
      .orderBy(desc(interviews.scheduledDate));
  }

  async getInterviewById(id: string): Promise<Interview | undefined> {
    const [interview] = await db.select().from(interviews).where(eq(interviews.id, id));
    return interview || undefined;
  }

  async createInterview(insertInterview: InsertInterview): Promise<Interview> {
    const [interview] = await db
      .insert(interviews)
      .values({
        ...insertInterview,
        scheduledDate: new Date(insertInterview.scheduledDate),
      })
      .returning();
    return interview;
  }

  async updateInterview(id: string, updateData: Partial<InsertInterview>): Promise<Interview | undefined> {
    const [interview] = await db
      .update(interviews)
      .set({
        ...updateData,
        scheduledDate: updateData.scheduledDate 
          ? new Date(updateData.scheduledDate) 
          : undefined,
        updatedAt: new Date(),
      })
      .where(eq(interviews.id, id))
      .returning();
    return interview || undefined;
  }

  async deleteInterview(id: string): Promise<boolean> {
    const result = await db.delete(interviews).where(eq(interviews.id, id));
    return result.rowCount ? result.rowCount > 0 : false;
  }

  async getUpcomingInterviews(): Promise<Interview[]> {
    const today = new Date();
    return await db
      .select()
      .from(interviews)
      .where(sql`${interviews.scheduledDate} >= ${today} AND ${interviews.status} = 'scheduled'`)
      .orderBy(interviews.scheduledDate);
  }
}

export const storage = new DatabaseStorage();
