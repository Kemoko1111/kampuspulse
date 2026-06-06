import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { handleApiError, AppError } from "@/lib/errors/app-error";
import { requireProfile } from "@/lib/middleware/auth";
import { validateCsrf } from "@/lib/middleware/csrf";
import { updateProductSchema } from "@/lib/validators/product";
import { ProductRepository } from "@/lib/repositories/product.repository";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const supabase = await createClient();
    const repo = new ProductRepository(supabase);
    const { data, error } = await repo.findById(id);

    if (error || !data) throw new AppError("Product not found", 404);

    const product = data as { views?: number };
    supabase.from("products").update({ views: (product.views || 0) + 1 } as never).eq("id", id);

    return NextResponse.json({ data });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await validateCsrf(request);
    const { id } = await params;
    const { supabase, profile } = await requireProfile();
    const body = updateProductSchema.parse(await request.json());

    const { data: rawProduct } = await supabase.from("products").select("seller_id").eq("id", id).single();
    const product = rawProduct as { seller_id: string } | null;
    if (!product || product.seller_id !== profile.id) throw new AppError("Forbidden", 403);

    const repo = new ProductRepository(supabase);
    const { data, error } = await repo.update(id, {
      ...(body.title && { title: body.title }),
      ...(body.description !== undefined && { description: body.description }),
      ...(body.price && { price: body.price }),
      ...(body.originalPrice !== undefined && { original_price: body.originalPrice }),
      ...(body.categoryId !== undefined && { category_id: body.categoryId }),
      ...(body.condition && { condition: body.condition }),
      ...(body.images && { images: body.images }),
      ...(body.tags && { tags: body.tags }),
      ...(body.location !== undefined && { location: body.location }),
      ...(body.stockQuantity && { stock_quantity: body.stockQuantity }),
    });

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ data });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await validateCsrf(request);
    const { id } = await params;
    const { supabase, profile } = await requireProfile();

    const { data: rawProduct } = await supabase.from("products").select("seller_id").eq("id", id).single();
    const product = rawProduct as { seller_id: string } | null;
    if (!product || product.seller_id !== profile.id) throw new AppError("Forbidden", 403);

    const repo = new ProductRepository(supabase);
    const { error } = await repo.softDelete(id);
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ success: true });
  } catch (error) {
    return handleApiError(error);
  }
}
