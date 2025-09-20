import { sql } from "drizzle-orm";
import { pgTable, text, varchar, timestamp, integer } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const jobApplications = pgTable("job_applications", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  company: text("company").notNull(),
  position: text("position").notNull(),
  status: text("status").notNull().default("applied"), // applied, interview, offer, rejected
  applicationDate: timestamp("application_date").notNull().defaultNow(),
  salary: integer("salary"),
  location: text("location"),
  jobUrl: text("job_url"),
  notes: text("notes"),
  contactEmail: text("contact_email"),
  contactName: text("contact_name"),
  nextStepDate: timestamp("next_step_date"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const insertJobApplicationSchema = createInsertSchema(jobApplications).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
}).extend({
  applicationDate: z.string().optional(),
  nextStepDate: z.string().optional(),
});

export type InsertJobApplication = z.infer<typeof insertJobApplicationSchema>;
export type JobApplication = typeof jobApplications.$inferSelect;

// Interviews table for detailed interview scheduling and notes
export const interviews = pgTable("interviews", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  applicationId: varchar("application_id").notNull().references(() => jobApplications.id, { onDelete: "cascade" }),
  interviewType: text("interview_type").notNull(), // phone, video, onsite, final
  scheduledDate: timestamp("scheduled_date").notNull(),
  duration: integer("duration"), // minutes
  interviewerName: text("interviewer_name"),
  interviewerEmail: text("interviewer_email"),
  location: text("location"), // for onsite or meeting link for video
  notes: text("notes"),
  feedback: text("feedback"),
  status: text("status").notNull().default("scheduled"), // scheduled, completed, cancelled, rescheduled
  round: integer("round").default(1), // interview round number
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const insertInterviewSchema = createInsertSchema(interviews).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
}).extend({
  scheduledDate: z.string(),
});

export type InsertInterview = z.infer<typeof insertInterviewSchema>;
export type Interview = typeof interviews.$inferSelect;

export const interviewTypes = ["phone", "video", "onsite", "final"] as const;
export type InterviewType = typeof interviewTypes[number];

export const interviewStatuses = ["scheduled", "completed", "cancelled", "rescheduled"] as const;
export type InterviewStatus = typeof interviewStatuses[number];

export const applicationStatuses = ["applied", "interview", "offer", "rejected"] as const;
export type ApplicationStatus = typeof applicationStatuses[number];
