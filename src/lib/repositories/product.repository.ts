import type { TypedSupabaseClient } from "@/lib/supabase/types";

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export class ProductRepository {
  constructor(private supabase: TypedSupabaseClient) {}

  async findMany(params: {
    category?: string;
    search?: string;
    sort?: string;
    order?: string;
    limit: number;
    offset: number;
    condition?: string;
    minPrice?: number;
    maxPrice?: number;
  }) {
    // The EDWOM UI sends a category *slug* ("electronics"), but products.category_id
    // is a UUID — filtering with the slug directly makes Postgres throw
    // "invalid input syntax for type uuid", which surfaced as "Failed to load
    // products" the instant a user tapped any category tab. Resolve slug->id
    // first; still accept a raw UUID so admin/other callers keep working.
    let categoryId: string | undefined;
    if (params.category && params.category !== "all") {
      if (UUID_RE.test(params.category)) {
        categoryId = params.category;
      } else {
        const { data: cat } = await this.supabase
          .from("categories")
          .select("id")
          .eq("slug", params.category)
          .maybeSingle();
        // No matching slug -> return an empty set rather than every product,
        // so an unknown category reads as "nothing here" not "ignore the filter".
        categoryId = (cat as { id: string } | null)?.id ?? "00000000-0000-0000-0000-000000000000";
      }
    }

    let query = this.supabase
      .from("products")
      .select(`
        *,
        seller:profiles!products_seller_id_fkey(id, full_name, avatar_url, rating, is_verified),
        category:categories(id, name, slug)
      `, { count: "exact" })
      .eq("status", "active")
      .is("deleted_at", null);

    if (categoryId) {
      query = query.eq("category_id", categoryId);
    }
    if (params.search) {
      query = query.or(`title.ilike.%${params.search}%,description.ilike.%${params.search}%`);
    }
    if (params.condition) query = query.eq("condition", params.condition);
    if (params.minPrice) query = query.gte("price", params.minPrice);
    if (params.maxPrice) query = query.lte("price", params.maxPrice);

    query = query
      .order(params.sort as "created_at", { ascending: params.order === "asc" })
      .range(params.offset, params.offset + params.limit - 1);

    return query;
  }

  async findById(id: string) {
    return this.supabase
      .from("products")
      .select(`
        *,
        seller:profiles!products_seller_id_fkey(id, full_name, avatar_url, rating, is_verified, phone),
        category:categories(id, name, slug)
      `)
      .eq("id", id)
      .is("deleted_at", null)
      .single();
  }

  async create(data: Record<string, unknown>) {
    return this.supabase.from("products").insert(data as never).select().single();
  }

  async update(id: string, data: Record<string, unknown>) {
    return this.supabase.from("products").update(data as never).eq("id", id).select().single();
  }

  async softDelete(id: string) {
    return this.supabase
      .from("products")
      .update({ deleted_at: new Date().toISOString(), status: "sold" } as never)
      .eq("id", id)
      .select()
      .single();
  }
}
