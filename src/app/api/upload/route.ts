import { NextRequest, NextResponse } from "next/server";
import { handleApiError } from "@/lib/errors/app-error";
import { requireProfile } from "@/lib/middleware/auth";
import { validateCsrf } from "@/lib/middleware/csrf";
import { uploadSchema } from "@/lib/validators/upload";
import { UploadService } from "@/lib/services/upload.service";

export async function POST(request: NextRequest) {
  try {
    await validateCsrf(request);
    const { supabase, profile, user } = await requireProfile();
    const formData = await request.formData();
    const file = formData.get("file") as File | null;
    const bucket = formData.get("bucket") as string;

    uploadSchema.parse({ bucket, fileName: file?.name || "", contentType: file?.type || "" });

    if (!file) return NextResponse.json({ error: "No file provided" }, { status: 400 });

    const buffer = Buffer.from(await file.arrayBuffer());
    const path = `${user.id}/${Date.now()}_${file.name}`;

    const service = new UploadService(supabase);
    const result = await service.upload(bucket, path, buffer, file.type);

    if (bucket === "avatars") {
      await supabase.from("profiles").update({ avatar_url: result.url } as never).eq("id", profile.id);
    }

    return NextResponse.json({ data: result }, { status: 201 });
  } catch (error) {
    return handleApiError(error);
  }
}
