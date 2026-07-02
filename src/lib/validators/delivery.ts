import { z } from "zod";

export const createDeliverySchema = z.object({
  pickupAddress: z.string().min(5),
  pickupLat: z.number(),
  pickupLng: z.number(),
  destinationAddress: z.string().min(5),
  destinationLat: z.number(),
  destinationLng: z.number(),
  distanceKm: z.number().positive(),
  durationMinutes: z.number().int().positive(),
  deliveryType: z.enum(["food", "package", "marketplace", "document", "student_to_student"]),
  packageDescription: z.string().max(500).optional(),
});
