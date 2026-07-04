import { z } from "zod";

export const validatePromotionSchema = z.object({
  code: z.string().min(1).max(50),
  orderAmount: z.number().nonnegative(),
});
