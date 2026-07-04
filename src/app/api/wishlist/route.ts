import { NextRequest, NextResponse } from "next/server";
import { handleApiError } from "@/lib/errors/app-error";
import { requireProfile } from "@/lib/middleware/auth";
import { validateCsrf } from "@/lib/middleware/csrf";
import { addToWishlistSchema } from "@/lib/validators/wishlist";
import { WishlistRepository } from "@/lib/repositories/wishlist.repository";

export async function GET() {
  try {
    const { supabase, profile } = await requireProfile();
    const repo = new WishlistRepository(supabase);
    const { data, error } = await repo.findByUser(profile.id);
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
    const body = addToWishlistSchema.parse(await request.json());
    const repo = new WishlistRepository(supabase);

    const { data, error } = await repo.add(profile.id, body.productId);
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ data }, { status: 201 });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function DELETE(request: NextRequest) {
  try {
    await validateCsrf(request);
    const { supabase, profile } = await requireProfile();
    const { searchParams } = new URL(request.url);
    const productId = searchParams.get("productId");

    if (!productId) {
      return NextResponse.json({ error: "productId is required" }, { status: 400 });
    }

    const repo = new WishlistRepository(supabase);
    const { error } = await repo.remove(profile.id, productId);
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });

    return NextResponse.json({ success: true });
  } catch (error) {
    return handleApiError(error);
  }
}
