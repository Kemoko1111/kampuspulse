import { NextRequest, NextResponse } from "next/server";
import { handleApiError } from "@/lib/errors/app-error";
import { requireRole } from "@/lib/middleware/auth";
import { validateCsrf } from "@/lib/middleware/csrf";
import { z } from "zod";

// This route referenced things that don't exist on `reviews`: a "status"
// column (only a boolean is_hidden exists) and FK constraints named
// reviews_user_id_fkey/reviews_product_id_fkey (the real columns/constraints
// are reviewer_id/reviewed_id -> profiles; reference_id is a polymorphic
// pointer to products/tasks/rides/deliveries depending on `type`, with no FK
// at all since it can't point at more than one table). Every GET here would
// have errored ("could not find relationship..."), and every PATCH would
// have errored too (unknown column "status") — this page has likely never
// worked. Fixed to use the real schema.
export async function GET(request: NextRequest) {
  try {
    const { supabase } = await requireRole(["admin"]);

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "20");
    const status = searchParams.get("status");
    const search = searchParams.get("search");
    const offset = (page - 1) * limit;

    let query = supabase
      .from("reviews")
      .select(`
        *,
        reviewer:profiles!reviews_reviewer_id_fkey(full_name)
      `, { count: "exact" })
      .order("created_at", { ascending: false });

    if (status === "hidden") query = query.eq("is_hidden", true);
    else if (status === "published") query = query.eq("is_hidden", false);
    if (search) query = query.ilike("comment", `%${search}%`);
    query = query.range(offset, offset + limit - 1);

    const { data, error, count } = await query;
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });

    const reviews = (data || []) as { type: string; reference_id: string }[];
    const productIds = reviews.filter((r) => r.type === "product").map((r) => r.reference_id);

    let productTitles: Record<string, string> = {};
    if (productIds.length > 0) {
      const { data: products } = await supabase
        .from("products")
        .select("id, title")
        .in("id", productIds);
      productTitles = Object.fromEntries(
        ((products || []) as { id: string; title: string }[]).map((p) => [p.id, p.title])
      );
    }

    const enriched = reviews.map((r) => ({
      ...r,
      product: r.type === "product" ? { title: productTitles[r.reference_id] || "Unknown Product" } : null,
    }));

    return NextResponse.json({ data: enriched, count, page, limit });
  } catch (error) {
    return handleApiError(error);
  }
}

const patchSchema = z.object({
  reviewId: z.string().uuid(),
  action: z.enum(["hidden", "published"]),
});

export async function PATCH(request: NextRequest) {
  try {
    await validateCsrf(request);
    const { supabase, profile } = await requireRole(["admin"]);
    const body = patchSchema.parse(await request.json());

    const { error } = await supabase
      .from("reviews")
      .update({ is_hidden: body.action === "hidden" } as never)
      .eq("id", body.reviewId);

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });

    await supabase.from("admin_logs").insert({
      admin_id: profile.id,
      action: body.action === "hidden" ? "hide_review" : "approve_review",
      resource_type: "review",
      resource_id: body.reviewId,
    } as never);

    return NextResponse.json({ success: true });
  } catch (error) {
    return handleApiError(error);
  }
}
