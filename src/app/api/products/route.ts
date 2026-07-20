import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { handleApiError } from "@/lib/errors/app-error";
import { rateLimit } from "@/lib/middleware/rate-limit";
import { requireProfile } from "@/lib/middleware/auth";
import { validateCsrf } from "@/lib/middleware/csrf";
import { sanitizeObject } from "@/lib/middleware/sanitize";
import { createProductSchema, productQuerySchema } from "@/lib/validators/product";
import { ProductRepository } from "@/lib/repositories/product.repository";

export async function GET(request: NextRequest) {
  try {
    const ip = request.headers.get("x-forwarded-for") || "anonymous";
    await rateLimit(ip);

    const supabase = await createClient();
    const { searchParams } = new URL(request.url);
    const query = productQuerySchema.parse(Object.fromEntries(searchParams));
    const offset = (query.page - 1) * query.limit;

    const repo = new ProductRepository(supabase);
    const { data, error, count } = await repo.findMany({ ...query, offset });

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ data, count, page: query.page, limit: query.limit });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function POST(request: NextRequest) {
  try {
    await validateCsrf(request);
    const { supabase, profile } = await requireProfile();

    // Peer marketplace: any signed-in student can list an item. seller_id is
    // forced to their own profile id below, so they can't list as someone else.
    const body = sanitizeObject(
      createProductSchema.parse(await request.json()),
      ["title", "description", "location"]
    );

    // The `products_insert` RLS policy (migrations/009_rls_policies.sql)
    // already enforces seller_id ownership at the database layer too — no
    // need to bypass it with the service-role client (that was only ever a
    // workaround for a since-fixed RLS bug, tracked in a since-deleted
    // supabase/fix_products_rls.sql).
    const repo = new ProductRepository(supabase);
    const { data, error } = await repo.create({
      seller_id: profile.id,
      title: body.title,
      description: body.description,
      price: body.price,
      original_price: body.originalPrice || null,
      category_id: body.categoryId || null,
      condition: body.condition,
      images: body.images,
      tags: body.tags,
      location: body.location || null,
      stock_quantity: body.stockQuantity,
      status: "active",
    });

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ data }, { status: 201 });
  } catch (error) {
    return handleApiError(error);
  }
}
