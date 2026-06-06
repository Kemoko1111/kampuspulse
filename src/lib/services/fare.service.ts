export interface FareSettings {
  base_fare: number;
  per_km_rate: number;
  per_min_rate: number;
}

export function calculateFare(
  distanceKm: number,
  durationMinutes: number,
  settings: FareSettings
): number {
  const fare =
    settings.base_fare +
    distanceKm * settings.per_km_rate +
    durationMinutes * settings.per_min_rate;
  return Math.round(fare * 100) / 100;
}

export function haversineDistance(
  lat1: number,
  lng1: number,
  lat2: number,
  lng2: number
): number {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

export function findNearestRider<T extends { current_lat: number | null; current_lng: number | null }>(
  riders: T[],
  pickupLat: number,
  pickupLng: number
): T | null {
  let nearest: T | null = null;
  let minDistance = Infinity;

  for (const rider of riders) {
    if (rider.current_lat == null || rider.current_lng == null) continue;
    const dist = haversineDistance(pickupLat, pickupLng, rider.current_lat, rider.current_lng);
    if (dist < minDistance) {
      minDistance = dist;
      nearest = rider;
    }
  }

  return nearest;
}
