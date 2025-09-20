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

export const applicationStatuses = ["applied", "interview", "offer", "rejected"] as const;
export type ApplicationStatus = typeof applicationStatuses[number];
