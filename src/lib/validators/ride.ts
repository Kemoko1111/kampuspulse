import { z } from "zod";

export const createRideSchema = z.object({
  pickupAddress: z.string().min(5),
  pickupLat: z.number(),
  pickupLng: z.number(),
  destinationAddress: z.string().min(5),
  destinationLat: z.number(),
  destinationLng: z.number(),
  distanceKm: z.number().positive(),
  durationMinutes: z.number().int().positive(),
  paymentMethod: z.enum(["mtn_momo", "telecel", "airteltigo", "card", "wallet"]).default("mtn_momo"),
  notes: z.string().max(500).optional(),
});

export const updateRideSchema = z.object({
  status: z.enum(["searching", "accepted", "en_route", "arrived", "in_progress", "completed", "cancelled"]).optional(),
  riderId: z.string().uuid().optional(),
});

export const riderLocationSchema = z.object({
  lat: z.number(),
  lng: z.number(),
});

export const riderAvailabilitySchema = z.object({
  isAvailable: z.boolean(),
});
