import { NextRequest, NextResponse } from "next/server";
import { handleApiError } from "@/lib/errors/app-error";
import { requireRole } from "@/lib/middleware/auth";
import { validateCsrf } from "@/lib/middleware/csrf";
import { broadcastNotificationSchema } from "@/lib/validators/notification";
import { NotificationService } from "@/lib/services/notification.service";

export async function GET() {
  try {
    const { supabase } = await requireRole(["admin"]);

    const { data, error } = await supabase
      .from("notification_broadcasts")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(50);

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ data });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function POST(request: NextRequest) {
  try {
    await validateCsrf(request);
    const { supabase, profile } = await requireRole(["admin"]);
    const body = broadcastNotificationSchema.parse(await request.json());

    let targetsQuery = supabase.from("profiles").select("id");
    if (body.audience === "students") {
      targetsQuery = targetsQuery.eq("role", "student");
    } else if (body.audience === "riders") {
      targetsQuery = targetsQuery.eq("role", "rider");
    }

    const { data: targets, error: targetsError } = await targetsQuery;
    if (targetsError) return NextResponse.json({ error: targetsError.message }, { status: 500 });

    const recipients = (targets || []) as { id: string }[];

    // NotificationService.notify() is single-recipient, so we fan out with
    // Promise.all rather than one-request-at-a-time. Fine at this app's
    // scale; a failure for one recipient shouldn't block the rest.
    const notifService = new NotificationService(supabase);
    const results = await Promise.allSettled(
      recipients.map((r) =>
        notifService.notify({
          userId: r.id,
          type: "system",
          title: body.title,
          body: body.body,
        })
      )
    );
    const recipientCount = results.filter((r) => r.status === "fulfilled").length;

    const { data: broadcast, error: insertError } = await supabase
      .from("notification_broadcasts")
      .insert({
        title: body.title,
        body: body.body,
        audience: body.audience,
        recipient_count: recipientCount,
        sent_by: profile.id,
      } as never)
      .select()
      .single();

    if (insertError) return NextResponse.json({ error: insertError.message }, { status: 500 });

    return NextResponse.json({ data: broadcast }, { status: 201 });
  } catch (error) {
    return handleApiError(error);
  }
}
