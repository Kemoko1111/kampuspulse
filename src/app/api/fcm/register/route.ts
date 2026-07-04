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

// Called on sign-out. fcm_tokens is upserted on (profile_id, token) rather
// than a unique constraint on token alone, so a shared/reused device that
// switches accounts would otherwise leave the previous user's row in place —
// they'd keep getting push notifications on a device someone else is now
// signed into. Removing this device's token for the current profile on
// sign-out means the next user's registerFcmToken() call starts clean.
export async function DELETE(request: NextRequest) {
  try {
    const { supabase, profile } = await requireProfile();
    const body = schema.pick({ token: true }).parse(await request.json());

    const { error } = await supabase
      .from("fcm_tokens")
      .delete()
      .eq("profile_id", profile.id)
      .eq("token", body.token);

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ success: true });
  } catch (error) {
    return handleApiError(error);
  }
}
