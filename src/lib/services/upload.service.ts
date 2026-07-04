import type { TypedSupabaseClient } from "@/lib/supabase/types";
import { AppError } from "@/lib/errors/app-error";

const BUCKET_LIMITS: Record<string, { maxSize: number; types: string[] }> = {
  avatars: { maxSize: 2 * 1024 * 1024, types: ["image/jpeg", "image/png", "image/webp"] },
  "product-images": { maxSize: 5 * 1024 * 1024, types: ["image/jpeg", "image/png", "image/webp", "image/gif"] },
  "store-banners": { maxSize: 5 * 1024 * 1024, types: ["image/jpeg", "image/png", "image/webp"] },
  "rider-documents": { maxSize: 10 * 1024 * 1024, types: ["image/jpeg", "image/png", "image/webp", "application/pdf"] },
  "task-attachments": { maxSize: 10 * 1024 * 1024, types: ["image/jpeg", "image/png", "image/webp", "application/pdf"] },
};

// The "content type" being validated against BUCKET_LIMITS otherwise comes
// straight from the client-supplied multipart Content-Type for that form
// part — an attacker using a raw HTTP client (not a browser) can label
// arbitrary bytes as "image/png" to pass the allow-list check. Sniffing the
// real file signature and requiring it to agree with the claimed type
// closes that gap without pulling in a new dependency.
function sniffType(buffer: Buffer): string | null {
  if (buffer.length >= 3 && buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff) {
    return "image/jpeg";
  }
  if (
    buffer.length >= 8 &&
    buffer[0] === 0x89 && buffer[1] === 0x50 && buffer[2] === 0x4e && buffer[3] === 0x47 &&
    buffer[4] === 0x0d && buffer[5] === 0x0a && buffer[6] === 0x1a && buffer[7] === 0x0a
  ) {
    return "image/png";
  }
  if (
    buffer.length >= 6 &&
    buffer[0] === 0x47 && buffer[1] === 0x49 && buffer[2] === 0x46 && buffer[3] === 0x38
  ) {
    return "image/gif";
  }
  if (
    buffer.length >= 12 &&
    buffer.toString("ascii", 0, 4) === "RIFF" &&
    buffer.toString("ascii", 8, 12) === "WEBP"
  ) {
    return "image/webp";
  }
  if (buffer.length >= 4 && buffer.toString("ascii", 0, 4) === "%PDF") {
    return "application/pdf";
  }
  return null;
}

// Storage object keys aren't a real filesystem, so classic "../.." traversal
// isn't directly achievable, but an unsanitized file.name still injects
// uncontrolled structure (slashes, etc.) into the key under the user's own
// prefix. Keep only a safe basename.
function safeFileName(name: string): string {
  const base = name.split(/[/\\]/).pop() || "file";
  return base.replace(/[^a-zA-Z0-9._-]/g, "_").slice(-100);
}

export class UploadService {
  constructor(private supabase: TypedSupabaseClient) {}

  validate(bucket: string, contentType: string, size: number, buffer?: Buffer) {
    const limits = BUCKET_LIMITS[bucket];
    if (!limits) throw new AppError("Invalid bucket", 400);
    if (!limits.types.includes(contentType)) {
      throw new AppError(`Invalid file type. Allowed: ${limits.types.join(", ")}`, 400);
    }
    if (size > limits.maxSize) {
      throw new AppError(`File too large. Max: ${limits.maxSize / 1024 / 1024}MB`, 400);
    }
    if (buffer) {
      const actualType = sniffType(buffer);
      if (!actualType || actualType !== contentType) {
        throw new AppError("File content doesn't match its declared type", 400);
      }
    }
  }

  async upload(bucket: string, path: string, file: Buffer, contentType: string) {
    this.validate(bucket, contentType, file.length, file);

    const { data, error } = await this.supabase.storage
      .from(bucket)
      .upload(safeUploadPath(path), file, { contentType, upsert: true });

    if (error) throw new AppError(error.message, 400);

    const { data: urlData } = this.supabase.storage.from(bucket).getPublicUrl(data.path);
    return { path: data.path, url: urlData.publicUrl };
  }
}

function safeUploadPath(path: string): string {
  const parts = path.split("/");
  const fileName = parts.pop() || "file";
  return [...parts, safeFileName(fileName)].join("/");
}
