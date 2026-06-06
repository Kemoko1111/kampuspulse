import { z } from "zod";

export const createOrderSchema = z.object({
  deliveryAddress: z.string().min(5).max(500),
  notes: z.string().max(1000).optional(),
  paymentMethod: z.enum(["mtn_momo", "telecel", "airteltigo", "card", "wallet"]).default("mtn_momo"),
});

export const orderQuerySchema = z.object({
  status: z.string().optional(),
});
