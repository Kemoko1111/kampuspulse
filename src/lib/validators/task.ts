import { z } from "zod";

export const createTaskSchema = z.object({
  title: z.string().min(5).max(200),
  description: z.string().min(10).max(5000),
  category: z.enum(["academic", "delivery", "printing", "food", "laundry", "tech", "design", "event", "other"]),
  reward: z.number().min(5),
  deadline: z.string().datetime(),
  location: z.string().max(200).optional(),
  images: z.array(z.string().url()).max(5).default([]),
  isUrgent: z.boolean().default(false),
});

export const updateTaskSchema = z.object({
  status: z.enum(["open", "assigned", "in_progress", "completed", "cancelled", "disputed"]).optional(),
  title: z.string().min(5).max(200).optional(),
  description: z.string().min(10).max(5000).optional(),
});

export const applyTaskSchema = z.object({
  coverMessage: z.string().max(1000).optional(),
  proposedPrice: z.number().positive().optional(),
});

export const acceptApplicationSchema = z.object({
  applicationId: z.string().uuid(),
});

export const rejectApplicationSchema = z.object({
  applicationId: z.string().uuid(),
});
