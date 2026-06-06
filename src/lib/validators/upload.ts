import { z } from "zod";

export const uploadSchema = z.object({
  bucket: z.enum(["avatars", "product-images", "store-banners", "rider-documents", "task-attachments"]),
  fileName: z.string().min(1).max(255),
  contentType: z.string().min(1),
});
