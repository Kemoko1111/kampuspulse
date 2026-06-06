import type { TypedSupabaseClient } from "@/lib/supabase/types";

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
    let query = this.supabase
      .from("products")
      .select(`
        *,
        seller:profiles!products_seller_id_fkey(id, full_name, avatar_url, rating, is_verified),
        category:categories(id, name, slug)
      `, { count: "exact" })
      .eq("status", "active")
      .is("deleted_at", null);

    if (params.category && params.category !== "all") {
      query = query.eq("category_id", params.category);
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
