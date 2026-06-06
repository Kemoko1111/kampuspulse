import { NextRequest, NextResponse } from "next/server";
import { handleApiError } from "@/lib/errors/app-error";
import { requireProfile } from "@/lib/middleware/auth";
import { z } from "zod";

const schema = z.object({
  token: z.string().min(1),
  deviceInfo: z.string().optional(),
});

export async function POST(request: NextRequest) {
  try {
    const { supabase, profile } = await requireProfile();
    const body = schema.parse(await request.json());

    const { data, error } = await supabase
      .from("fcm_tokens")
      .upsert(
        { profile_id: profile.id, token: body.token, device_info: body.deviceInfo } as never,
        { onConflict: "profile_id,token" }
      )
      .select()
      .single();

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ data });
  } catch (error) {
    return handleApiError(error);
  }
}
