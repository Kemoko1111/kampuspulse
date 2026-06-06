import { NextRequest, NextResponse } from "next/server";
import { handleApiError } from "@/lib/errors/app-error";
import { requireProfile } from "@/lib/middleware/auth";
import { validateCsrf } from "@/lib/middleware/csrf";
import { addToCartSchema, updateCartSchema } from "@/lib/validators/cart";
import { CartRepository } from "@/lib/repositories/cart.repository";

export async function GET() {
  try {
    const { supabase, profile } = await requireProfile();
    const repo = new CartRepository(supabase);
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
    const body = addToCartSchema.parse(await request.json());
    const repo = new CartRepository(supabase);

    const { data: product } = await supabase
      .from("products")
      .select("stock_quantity, status")
      .eq("id", body.productId)
      .single();

    const productData = product as { status: string } | null;
    if (!productData || productData.status !== "active") {
      return NextResponse.json({ error: "Product unavailable" }, { status: 400 });
    }

    const { data, error } = await repo.upsert(profile.id, body.productId, body.quantity);
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ data }, { status: 201 });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function PATCH(request: NextRequest) {
  try {
    await validateCsrf(request);
    const { supabase, profile } = await requireProfile();
    const body = updateCartSchema.parse(await request.json());
    const repo = new CartRepository(supabase);

    if (body.quantity === 0) {
      await repo.remove(profile.id, body.productId);
      return NextResponse.json({ success: true });
    }

    const { data, error } = await repo.upsert(profile.id, body.productId, body.quantity);
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ data });
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
    const repo = new CartRepository(supabase);

    if (productId) {
      await repo.remove(profile.id, productId);
    } else {
      await repo.clear(profile.id);
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    return handleApiError(error);
  }
}
