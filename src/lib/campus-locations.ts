export interface CampusLocation {
  name: string;
  address: string;
  lat: number;
  lng: number;
}

export const UCC_CENTER = { lat: 5.1053, lng: -1.2466 };

export const CAMPUS_LOCATIONS: CampusLocation[] = [
  { name: "Atlantic Hall", address: "Atlantic Hall, UCC", lat: 5.1053, lng: -1.2466 },
  { name: "Main Library", address: "Main Library, UCC", lat: 5.1089, lng: -1.2501 },
  { name: "Science Market", address: "Science Market, Cape Coast", lat: 5.1021, lng: -1.2412 },
  { name: "Valco Hall", address: "Valco Hall, UCC", lat: 5.1038, lng: -1.2489 },
  { name: "Casely Hayford", address: "Casely Hayford Hall, UCC", lat: 5.1067, lng: -1.2445 },
  { name: "Main Campus", address: "University of Cape Coast Main Campus", lat: 5.1053, lng: -1.2466 },
];

export function matchCampusLocation(text: string): CampusLocation | null {
  const normalized = text.toLowerCase().trim();
  if (!normalized) return null;

  return (
    CAMPUS_LOCATIONS.find(
      (loc) =>
        normalized.includes(loc.name.toLowerCase()) ||
        loc.name.toLowerCase().includes(normalized) ||
        normalized.includes(loc.address.toLowerCase())
    ) ?? null
  );
}

export function resolveCoords(
  address: string,
  coords: { lat: number; lng: number } | null
): { lat: number; lng: number } {
  if (coords) return coords;
  const match = matchCampusLocation(address);
  if (match) return { lat: match.lat, lng: match.lng };
  return UCC_CENTER;
}

function haversineKm(
  a: { lat: number; lng: number },
  b: { lat: number; lng: number }
): number {
  const toRad = (deg: number) => (deg * Math.PI) / 180;
  const dLat = toRad(b.lat - a.lat);
  const dLng = toRad(b.lng - a.lng);
  const lat1 = toRad(a.lat);
  const lat2 = toRad(b.lat);
  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLng / 2) ** 2;
  return 6371 * 2 * Math.atan2(Math.sqrt(h), Math.sqrt(1 - h));
}

export function estimateCampusTrip(
  pickup: string,
  destination: string,
  pickupCoords: { lat: number; lng: number } | null,
  destinationCoords: { lat: number; lng: number } | null,
  distanceKm: number | null,
  durationMinutes: number | null
) {
  const pickupResolved = resolveCoords(pickup, pickupCoords);
  const destResolved = resolveCoords(destination, destinationCoords);
  const km = distanceKm ?? Math.max(0.8, haversineKm(pickupResolved, destResolved));
  const mins = durationMinutes ?? Math.ceil(km * 4 + 5);

  return { pickupResolved, destResolved, km, mins };
}
