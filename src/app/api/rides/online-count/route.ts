import { NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { requireAuth } from '@/lib/middleware/auth';
import { handleApiError } from '@/lib/errors/app-error';

export async function GET() {
  try {
    // This is an aggregate "N riders online" widget shown to any signed-in
    // user, not just those with an active ride against a specific rider — so
    // it intentionally reads via the admin client (RLS now scopes
    // rider_profiles reads to own-row / active-ride / admin only, see
    // migration 030). The route itself must gate access instead.
    await requireAuth();
    const supabase = createAdminClient();

    // Count only riders who would ACTUALLY match a booking — same filters as
    // RideRepository.findAvailableRiders (available + verified + has a known
    // location). Counting is_available alone could show "3 riders online"
    // while matchRider finds zero.
    const { count, error } = await supabase
      .from('rider_profiles')
      .select('*', { count: 'exact', head: true })
      .eq('is_available', true)
      .eq('is_verified', true)
      .not('current_lat', 'is', null)
      .not('current_lng', 'is', null);

    if (error) throw error;

    // Get a few actual online riders for the sidebar. Only non-sensitive
    // fields are exposed here — exact GPS coordinates are never rendered by
    // any caller and must not leave this endpoint (see PROJECT_AUDIT.md).
    const { data: onlineRiders, error: ridersError } = await supabase
      .from('rider_profiles')
      .select('id, rating, total_trips, profiles!rider_profiles_user_id_fkey(full_name, avatar_url)')
      .eq('is_available', true)
      .eq('is_verified', true)
      .not('current_lat', 'is', null)
      .not('current_lng', 'is', null)
      .limit(3);

    if (ridersError) throw ridersError;

    type OnlineRiderRow = {
      id: string;
      rating: number | null;
      total_trips: number | null;
      profiles: { full_name: string | null; avatar_url: string | null } | null;
    };

    const formattedRiders = (onlineRiders as OnlineRiderRow[]).map((r) => ({
      id: r.id,
      name: r.profiles?.full_name || 'Rider',
      avatar: r.profiles?.avatar_url,
      rating: r.rating || 5.0,
      trips: r.total_trips || 0,
    }));

    return NextResponse.json({
      count: count || 0,
      riders: formattedRiders
    });
  } catch (error) {
    return handleApiError(error);
  }
}
