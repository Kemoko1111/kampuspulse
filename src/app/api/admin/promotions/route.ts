import { NextRequest, NextResponse } from 'next/server';
import { handleApiError } from '@/lib/errors/app-error';
import { requireRole } from '@/lib/middleware/auth';
import { validateCsrf } from '@/lib/middleware/csrf';

export async function GET(request: NextRequest) {
  try {
    const { supabase } = await requireRole(['admin']);
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const status = searchParams.get('status');
    const search = searchParams.get('search');
    const offset = (page - 1) * limit;

    let query = supabase
      .from('promotions')
      .select('*', { count: 'exact' })
      .order('created_at', { ascending: false });

    if (status) query = query.eq('status', status);
    if (search) query = query.ilike('code', `%${search}%`);
    query = query.range(offset, offset + limit - 1);

    const { data, error, count } = await query;
    if (error) {
      // Table might not exist yet
      if (error.message.includes('relation') || error.code === '42P01') {
        return NextResponse.json({ data: [], count: 0, page, limit });
      }
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
    return NextResponse.json({ data, count, page, limit });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function POST(request: NextRequest) {
  try {
    await validateCsrf(request);
    const { supabase, profile } = await requireRole(['admin']);
    const body = await request.json();

    const { data, error } = await supabase.from('promotions').insert({
      code: body.code?.toUpperCase(),
      description: body.description,
      discount_type: body.discount_type,
      discount_value: body.discount_value,
      min_order_amount: body.min_order_amount || 0,
      max_uses: body.max_uses || null,
      expires_at: body.expires_at || null,
      status: 'active',
      created_by: profile.id,
    } as never).select().single();

    if (error) {
        if (error.message.includes('relation') || error.code === '42P01') {
             return NextResponse.json({ error: "The promotions table has not been created in the database yet." }, { status: 500 });
        }
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
    return NextResponse.json({ data });
  } catch (error) {
    return handleApiError(error);
  }
}
