import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET() {
  try {
    const supabase = await createClient();
    
    // Get count of online riders
    const { count, error } = await supabase
      .from('rider_profiles')
      .select('*', { count: 'exact', head: true })
      .eq('is_available', true);

    if (error) throw error;

    // Get a few actual online riders for the sidebar
    const { data: onlineRiders, error: ridersError } = await supabase
      .from('rider_profiles')
      .select('id, user_id, rating, total_trips, current_lat, current_lng, profiles!rider_profiles_user_id_fkey(full_name, avatar_url)')
      .eq('is_available', true)
      .limit(3);

    if (ridersError) throw ridersError;

    type OnlineRiderRow = {
      id: string;
      rating: number | null;
      total_trips: number | null;
      current_lat: number | null;
      current_lng: number | null;
      profiles: { full_name: string | null; avatar_url: string | null } | null;
    };

    const formattedRiders = (onlineRiders as OnlineRiderRow[]).map((r) => ({
      id: r.id,
      name: r.profiles?.full_name || 'Rider',
      avatar: r.profiles?.avatar_url,
      rating: r.rating || 5.0,
      trips: r.total_trips || 0,
      lat: r.current_lat,
      lng: r.current_lng,
    }));

    return NextResponse.json({ 
      count: count || 0,
      riders: formattedRiders
    });
  } catch (error) {
    console.error('Error fetching online riders:', error);
    return NextResponse.json({ error: 'Failed to fetch online riders' }, { status: 500 });
  }
}
