import { z } from "zod";

export const initializePaymentSchema = z.object({
  amount: z.number().positive(),
  email: z.string().email(),
  orderId: z.string().uuid().optional(),
  taskId: z.string().uuid().optional(),
  rideId: z.string().uuid().optional(),
  paymentMethod: z.enum(["mtn_momo", "telecel", "airteltigo", "card"]).default("mtn_momo"),
  phone: z.string().optional(),
});

export const refundSchema = z.object({
  transactionId: z.string().uuid(),
  amount: z.number().positive(),
  reason: z.string().max(500).optional(),
});

export const verifyPaymentSchema = z.object({
  reference: z.string().min(1),
});
