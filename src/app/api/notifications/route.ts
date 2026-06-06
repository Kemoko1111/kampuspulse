import { NextRequest, NextResponse } from "next/server";
import { handleApiError } from "@/lib/errors/app-error";
import { requireProfile } from "@/lib/middleware/auth";
import { NotificationRepository } from "@/lib/repositories/notification.repository";

export async function GET(request: NextRequest) {
  try {
    const { supabase, profile } = await requireProfile();
    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get("limit") || "30");

    const repo = new NotificationRepository(supabase);
    const { data, error } = await repo.findByUser(profile.id);
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });

    const notifications = (data || []).slice(0, limit) as { is_read: boolean }[];
    const unreadCount = notifications.filter((n) => !n.is_read).length;

    return NextResponse.json({ data: notifications, unreadCount });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const { supabase, profile } = await requireProfile();
    const body = await request.json();
    const repo = new NotificationRepository(supabase);

    if (body.markAllRead) {
      await repo.markAllRead(profile.id);
    } else if (body.id) {
      await repo.markRead(body.id);
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    return handleApiError(error);
  }
}
