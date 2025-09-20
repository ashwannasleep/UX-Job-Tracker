import { z } from "zod";

// LinkedIn Profile Data Types
export const linkedInProfileSchema = z.object({
  name: z.string(),
  headline: z.string().optional(),
  location: z.string().optional(),
  email: z.string().email().optional(),
  profileUrl: z.string().url(),
  summary: z.string().optional(),
  experience: z.array(z.object({
    title: z.string(),
    company: z.string(),
    duration: z.string(),
    description: z.string().optional(),
  })).optional(),
  skills: z.array(z.string()).optional(),
});

// LinkedIn Job Data Types  
export const linkedInJobSchema = z.object({
  title: z.string(),
  company: z.string(),
  location: z.string().optional(),
  description: z.string().optional(),
  jobUrl: z.string().url(),
  postedDate: z.string().optional(),
  employmentType: z.string().optional(),
  seniorityLevel: z.string().optional(),
  industries: z.array(z.string()).optional(),
});

// Bulk Import Types
export const bulkImportSchema = z.object({
  applications: z.array(z.object({
    company: z.string(),
    position: z.string(),
    status: z.enum(["applied", "interview", "offer", "rejected"]).default("applied"),
    applicationDate: z.string().optional(),
    location: z.string().optional(),
    jobUrl: z.string().url().optional(),
    notes: z.string().optional(),
    contactEmail: z.string().email().optional(),
    contactName: z.string().optional(),
    salary: z.number().optional(),
  })),
});

export type LinkedInProfile = z.infer<typeof linkedInProfileSchema>;
export type LinkedInJob = z.infer<typeof linkedInJobSchema>;
export type BulkImport = z.infer<typeof bulkImportSchema>;

// LinkedIn URL parsing utilities
export const LINKEDIN_JOB_URL_REGEX = /linkedin\.com\/jobs\/view\/(\d+)/;
export const LINKEDIN_PROFILE_URL_REGEX = /linkedin\.com\/in\/([a-zA-Z0-9-]+)/;