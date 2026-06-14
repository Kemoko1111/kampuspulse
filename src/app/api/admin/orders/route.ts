import { NextRequest, NextResponse } from "next/server";
import { handleApiError } from "@/lib/errors/app-error";
import { requireRole } from "@/lib/middleware/auth";

export async function GET(request: NextRequest) {
  try {
    const { supabase } = await requireRole(["admin"]);

    const { searchParams } = new URL(request.url);
    const status = searchParams.get("status");
    const search = searchParams.get("search");
    const page = parseInt(searchParams.get("page") || "1", 10);
    const limit = parseInt(searchParams.get("limit") || "20", 10);
    const dateFrom = searchParams.get("dateFrom");
    const dateTo = searchParams.get("dateTo");
    const offset = (page - 1) * limit;

    let query = supabase
      .from("orders")
      .select(
        `
        id,
        total_amount,
        delivery_fee,
        status,
        payment_method,
        payment_status,
        delivery_address,
        notes,
        created_at,
        buyer:profiles!orders_buyer_id_fkey (
          id,
          full_name,
          phone,
          avatar_url,
          hall_of_residence
        ),
        seller:profiles!orders_seller_id_fkey (
          id,
          full_name
        ),
        order_items (
          id,
          quantity,
          unit_price,
          total_price
        )
      `,
        { count: "exact" }
      )
      .is("deleted_at", null)
      .order("created_at", { ascending: false });

    // Filter by status
    if (status && status !== "all") {
      query = query.eq("status", status);
    }

    // Filter by date range
    if (dateFrom) {
      query = query.gte("created_at", new Date(dateFrom).toISOString());
    }
    if (dateTo) {
      // Include the entire end day
      const endDate = new Date(dateTo);
      endDate.setHours(23, 59, 59, 999);
      query = query.lte("created_at", endDate.toISOString());
    }

    // Search by buyer name or order id
    if (search) {
      // Use or filter to search buyer name or order id
      query = query.or(
        `id.eq.${search},buyer.full_name.ilike.%${search}%`
      );
    }

    // Paginate
    query = query.range(offset, offset + limit - 1);

    const { data, error, count } = await query;

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    const total = count || 0;
    const totalPages = Math.ceil(total / limit);

    return NextResponse.json({
      orders: data || [],
      total,
      page,
      limit,
      totalPages,
    });
  } catch (error) {
    return handleApiError(error);
  }
}
