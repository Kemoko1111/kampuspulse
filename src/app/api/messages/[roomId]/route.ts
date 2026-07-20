import { NextRequest, NextResponse } from "next/server";
import { handleApiError } from "@/lib/errors/app-error";
import { requireProfile } from "@/lib/middleware/auth";
import { validateCsrf } from "@/lib/middleware/csrf";
import { sanitizeText } from "@/lib/middleware/sanitize";
import { createAdminClient } from "@/lib/supabase/admin";
import { NotificationService } from "@/lib/services/notification.service";
import { logger } from "@/lib/logger";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ roomId: string }> }
) {
  try {
    const { roomId } = await params;
    const { supabase, profile } = await requireProfile();

    const { data: rawRoom } = await supabase
      .from("chat_rooms")
      .select("participants")
      .eq("id", roomId)
      .single();

    const room = rawRoom as { participants: string[] } | null;
    if (!room || !room.participants.includes(profile.id)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get("limit") || "50");

    const { data, error } = await supabase
      .from("messages")
      .select(`*, sender:profiles!messages_sender_id_fkey(id, full_name, avatar_url)`)
      .eq("room_id", roomId)
      .order("created_at", { ascending: false })
      .limit(limit);

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });

    await supabase
      .from("messages")
      .update({ is_read: true } as never)
      .eq("room_id", roomId)
      .neq("sender_id", profile.id)
      .eq("is_read", false);

    return NextResponse.json({ data: data?.reverse() });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ roomId: string }> }
) {
  try {
    await validateCsrf(request);
    const { roomId } = await params;
    const { supabase, profile } = await requireProfile();

    const { data: rawRoom } = await supabase
      .from("chat_rooms")
      .select("participants")
      .eq("id", roomId)
      .single();

    const room = rawRoom as { participants: string[] } | null;
    if (!room || !room.participants.includes(profile.id)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const body = await request.json();
    const content = sanitizeText(body.content);

    const { data, error } = await supabase
      .from("messages")
      .insert({
        room_id: roomId,
        sender_id: profile.id,
        content,
        type: body.type || "text",
        file_url: body.fileUrl || null,
        is_read: false,
      } as never)
      .select(`*, sender:profiles!messages_sender_id_fkey(id, full_name, avatar_url)`)
      .single();

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });

    await supabase
      .from("chat_rooms")
      .update({ last_message_at: new Date().toISOString() } as never)
      .eq("id", roomId);

    const recipientId = room.participants.find((p) => p !== profile.id);
    if (recipientId) {
      const { data: senderProfile } = await supabase
        .from("profiles")
        .select("full_name")
        .eq("id", profile.id)
        .single();

      const sender = senderProfile as { full_name: string | null } | null;
      // Route through NotificationService so the recipient also gets a device
      // push (respecting their push preference), not just an in-app row.
      // Service-role client because it writes to another user's notifications
      // and reads their fcm_tokens. Best-effort — a push hiccup mustn't fail
      // the message send.
      try {
        await new NotificationService(createAdminClient()).notify({
          userId: recipientId,
          type: "message",
          title: `New message from ${sender?.full_name || "Someone"}`,
          body: content.slice(0, 80),
          data: { room_id: roomId, sender_id: profile.id },
        });
      } catch (e) {
        logger.error("Message notification failed", e, { roomId });
      }
    }

    return NextResponse.json({ data }, { status: 201 });
  } catch (error) {
    return handleApiError(error);
  }
}
