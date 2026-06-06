import { z } from "zod";

export const addToCartSchema = z.object({
  productId: z.string().uuid(),
  quantity: z.number().int().positive().default(1),
});

export const updateCartSchema = z.object({
  productId: z.string().uuid(),
  quantity: z.number().int().min(0),
});
