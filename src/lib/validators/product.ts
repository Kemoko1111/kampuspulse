import { z } from "zod";

export const createProductSchema = z.object({
  title: z.string().min(3).max(200),
  description: z.string().max(5000).optional(),
  price: z.number().positive(),
  originalPrice: z.number().positive().optional(),
  categoryId: z.string().uuid().optional().nullable(),
  condition: z.enum(["new", "like_new", "good", "fair", "poor"]).default("new"),
  images: z.array(z.string().url()).max(10).default([]),
  tags: z.array(z.string()).max(20).default([]),
  location: z.string().max(200).optional(),
  stockQuantity: z.number().int().positive().default(1),
});

export const updateProductSchema = createProductSchema.partial();

export const productQuerySchema = z.object({
  category: z.string().optional(),
  search: z.string().optional(),
  sort: z.string().default("created_at"),
  order: z.enum(["asc", "desc"]).default("desc"),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  page: z.coerce.number().int().min(1).default(1),
  condition: z.string().optional(),
  minPrice: z.coerce.number().optional(),
  maxPrice: z.coerce.number().optional(),
});
