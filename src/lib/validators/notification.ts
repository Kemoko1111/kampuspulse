import { z } from "zod";

export const broadcastNotificationSchema = z.object({
  title: z.string().min(1).max(200),
  body: z.string().min(1).max(2000),
  audience: z.enum(["all", "students", "riders"]),
});
