import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
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
    const { profile } = await requireProfile();
    const body = sanitizeObject(
      createProductSchema.parse(await request.json()),
      ["title", "description", "location"]
    );

    // Use service role after auth check — avoids broken RLS until fix_products_rls.sql is applied
    const admin = createAdminClient();
    const repo = new ProductRepository(admin);
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
