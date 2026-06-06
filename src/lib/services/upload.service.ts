import type { TypedSupabaseClient } from "@/lib/supabase/types";
import { AppError } from "@/lib/errors/app-error";

const BUCKET_LIMITS: Record<string, { maxSize: number; types: string[] }> = {
  avatars: { maxSize: 2 * 1024 * 1024, types: ["image/jpeg", "image/png", "image/webp"] },
  "product-images": { maxSize: 5 * 1024 * 1024, types: ["image/jpeg", "image/png", "image/webp", "image/gif"] },
  "store-banners": { maxSize: 5 * 1024 * 1024, types: ["image/jpeg", "image/png", "image/webp"] },
  "rider-documents": { maxSize: 10 * 1024 * 1024, types: ["image/jpeg", "image/png", "image/webp", "application/pdf"] },
  "task-attachments": { maxSize: 10 * 1024 * 1024, types: ["image/jpeg", "image/png", "image/webp", "application/pdf"] },
};

export class UploadService {
  constructor(private supabase: TypedSupabaseClient) {}

  validate(bucket: string, contentType: string, size: number) {
    const limits = BUCKET_LIMITS[bucket];
    if (!limits) throw new AppError("Invalid bucket", 400);
    if (!limits.types.includes(contentType)) {
      throw new AppError(`Invalid file type. Allowed: ${limits.types.join(", ")}`, 400);
    }
    if (size > limits.maxSize) {
      throw new AppError(`File too large. Max: ${limits.maxSize / 1024 / 1024}MB`, 400);
    }
  }

  async upload(bucket: string, path: string, file: Buffer, contentType: string) {
    this.validate(bucket, contentType, file.length);

    const { data, error } = await this.supabase.storage
      .from(bucket)
      .upload(path, file, { contentType, upsert: true });

    if (error) throw new AppError(error.message, 400);

    const { data: urlData } = this.supabase.storage.from(bucket).getPublicUrl(data.path);
    return { path: data.path, url: urlData.publicUrl };
  }
}
