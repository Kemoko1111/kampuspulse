import { NextRequest, NextResponse } from "next/server";
import { handleApiError } from "@/lib/errors/app-error";
import { requireRole } from "@/lib/middleware/auth";
import { validateCsrf } from "@/lib/middleware/csrf";
import { z } from "zod";

const SETTINGS_KEY = "app_settings";

const DEFAULT_SETTINGS = {
  orderNotifications: true,
  autoAssignRiders: false,
  requireVerification: true,
  maintenanceMode: false,
};

const settingsSchema = z.object({
  orderNotifications: z.boolean().optional(),
  autoAssignRiders: z.boolean().optional(),
  requireVerification: z.boolean().optional(),
  maintenanceMode: z.boolean().optional(),
});

export async function GET() {
  try {
    const { supabase } = await requireRole(["admin"]);
    const { data } = await supabase
      .from("platform_settings")
      .select("value")
      .eq("key", SETTINGS_KEY)
      .maybeSingle();

    const value = (data as { value?: object } | null)?.value;
    return NextResponse.json({ data: { ...DEFAULT_SETTINGS, ...value } });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function PATCH(request: NextRequest) {
  try {
    await validateCsrf(request);
    const { supabase } = await requireRole(["admin"]);
    const updates = settingsSchema.parse(await request.json());

    const { data: existing } = await supabase
      .from("platform_settings")
      .select("value")
      .eq("key", SETTINGS_KEY)
      .maybeSingle();

    const merged = {
      ...DEFAULT_SETTINGS,
      ...((existing as { value?: object } | null)?.value),
      ...updates,
    };

    const { error } = await supabase
      .from("platform_settings")
      .upsert({ key: SETTINGS_KEY, value: merged } as never, { onConflict: "key" });

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ data: merged });
  } catch (error) {
    return handleApiError(error);
  }
}
