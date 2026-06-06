import { NextRequest, NextResponse } from "next/server";
import { handleApiError } from "@/lib/errors/app-error";
import { requireProfile } from "@/lib/middleware/auth";
import { validateCsrf } from "@/lib/middleware/csrf";

export async function GET() {
  try {
    const { supabase, profile } = await requireProfile();

    const { data, error } = await supabase
      .from("chat_rooms")
      .select(`*, messages(id, content, type, is_read, created_at, sender_id)`)
      .contains("participants", [profile.id])
      .order("last_message_at", { ascending: false });

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ data });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function POST(request: NextRequest) {
  try {
    await validateCsrf(request);
    const { supabase, profile } = await requireProfile();
    const { recipientId } = await request.json();

    const { data: existing } = await supabase
      .from("chat_rooms")
      .select("id")
      .contains("participants", [profile.id, recipientId])
      .eq("is_group", false)
      .single();

    if (existing) return NextResponse.json({ data: existing });

    const { data, error } = await supabase
      .from("chat_rooms")
      .insert({ participants: [profile.id, recipientId], is_group: false } as never)
      .select()
      .single();

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ data }, { status: 201 });
  } catch (error) {
    return handleApiError(error);
  }
}
