"use client";

/**
 * Despite the filename, this is a Leaflet + OpenStreetMap map — no Google
 * Maps, no API key, no billing account required. The filename and component
 * name are kept as "GoogleMap" only so the three consuming pages
 * (ezzyride booking, ezzyride track, rider dashboard) don't need import
 * changes; the public prop contract below is identical to the old Google
 * version.
 *
 * Free services used:
 *  - Tiles:     OpenStreetMap        (https://tile.openstreetmap.org)
 *  - Geocoding: Nominatim            (https://nominatim.openstreetmap.org)
 *  - Routing:   OSRM public demo     (https://router.project-osrm.org)
 *
 * Nominatim/OSRM are free public endpoints with soft rate limits, so
 * geocoding is debounced and routing falls back to a straight line +
 * haversine estimate if OSRM is unreachable, so a ride can always be booked.
 */

import { useEffect, useRef, useState, useCallback } from "react";
import { createPortal } from "react-dom";
import type * as LeafletNS from "leaflet";
import "leaflet/dist/leaflet.css";

interface GoogleMapProps {
  pickup?: { lat: number; lng: number; address?: string };
  destination?: { lat: number; lng: number; address?: string };
  riderLocation?: { lat: number; lng: number };
  onPickupSelect?: (lat: number, lng: number, address: string) => void;
  onDestinationSelect?: (lat: number, lng: number, address: string) => void;
  onRouteCalculated?: (distanceKm: number, durationMinutes: number) => void;
  height?: string;
  interactive?: boolean;
}

const UCC_CENTER: [number, number] = [5.1053, -1.2466]; // University of Cape Coast

interface Suggestion {
  label: string;
  lat: number;
  lng: number;
}

interface DropdownState {
  target: "pickup" | "destination";
  rect: { top: number; left: number; width: number };
  items: Suggestion[];
}

function haversineKm(a: [number, number], b: [number, number]): number {
  const R = 6371;
  const dLat = ((b[0] - a[0]) * Math.PI) / 180;
  const dLng = ((b[1] - a[1]) * Math.PI) / 180;
  const lat1 = (a[0] * Math.PI) / 180;
  const lat2 = (b[0] * Math.PI) / 180;
  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.sin(dLng / 2) ** 2 * Math.cos(lat1) * Math.cos(lat2);
  return 2 * R * Math.asin(Math.sqrt(h));
}

// Small colored dot marker via divIcon — avoids the well-known Leaflet
// broken-default-marker-image problem with bundlers entirely (no external
// PNGs to 404 or whitelist in the CSP).
function dotIcon(L: typeof LeafletNS, color: string): LeafletNS.DivIcon {
  return L.divIcon({
    className: "",
    html: `<span style="display:block;width:16px;height:16px;border-radius:9999px;background:${color};border:3px solid white;box-shadow:0 0 0 1px rgba(0,0,0,0.3)"></span>`,
    iconSize: [16, 16],
    iconAnchor: [8, 8],
  });
}

export default function GoogleMap({
  pickup,
  destination,
  riderLocation,
  onPickupSelect,
  onDestinationSelect,
  onRouteCalculated,
  height = "400px",
  interactive = true,
}: GoogleMapProps) {
  const mapRef = useRef<HTMLDivElement>(null);
  const leafletRef = useRef<typeof LeafletNS | null>(null);
  const mapInstanceRef = useRef<LeafletNS.Map | null>(null);
  const markersRef = useRef<LeafletNS.Layer[]>([]);
  const routeLayerRef = useRef<LeafletNS.Layer | null>(null);
  const [mapReady, setMapReady] = useState(false);
  const [dropdown, setDropdown] = useState<DropdownState | null>(null);

  // Keep the latest callbacks in refs so the input listeners (attached once)
  // always call the current handler without re-registering on every render.
  const cbRef = useRef({ onPickupSelect, onDestinationSelect });
  cbRef.current = { onPickupSelect, onDestinationSelect };

  const clearMarkers = useCallback(() => {
    const map = mapInstanceRef.current;
    if (!map) return;
    markersRef.current.forEach((m) => map.removeLayer(m));
    markersRef.current = [];
  }, []);

  // ── Initialize the map (client-only; leaflet touches window/document) ──
  useEffect(() => {
    let cancelled = false;
    (async () => {
      const L = (await import("leaflet")).default ?? (await import("leaflet"));
      if (cancelled || !mapRef.current || mapInstanceRef.current) return;
      leafletRef.current = L as typeof LeafletNS;

      const map = L.map(mapRef.current, {
        center: UCC_CENTER,
        zoom: 14,
        zoomControl: true,
      });
      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
        maxZoom: 19,
      }).addTo(map);

      // Tap-to-pick: first tap sets pickup, second sets destination, then it
      // cycles — mirrors the Google version's behavior of letting the user
      // drop points directly on the map. Reverse-geocode so the callback
      // still receives a human-readable address string.
      if (interactive) {
        map.on("click", async (e: LeafletNS.LeafletMouseEvent) => {
          const { lat, lng } = e.latlng;
          const address = await reverseGeocode(lat, lng);
          const hasPickup = cbRef.current.onPickupSelect && !pickupSetRef.current;
          if (hasPickup) {
            pickupSetRef.current = true;
            cbRef.current.onPickupSelect?.(lat, lng, address);
          } else {
            pickupSetRef.current = false;
            cbRef.current.onDestinationSelect?.(lat, lng, address);
          }
        });
      }

      mapInstanceRef.current = map;
      setMapReady(true);
      // Leaflet mis-measures its container if it mounts before layout settles.
      setTimeout(() => map.invalidateSize(), 100);
    })();

    return () => {
      cancelled = true;
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Alternates which point a map-tap assigns; lives in a ref so the click
  // handler (registered once) can read/update it without re-binding.
  const pickupSetRef = useRef(false);

  // ── Draw markers + route whenever pickup/destination/rider change ──
  useEffect(() => {
    const L = leafletRef.current;
    const map = mapInstanceRef.current;
    if (!L || !map || !mapReady) return;

    clearMarkers();
    if (routeLayerRef.current) {
      map.removeLayer(routeLayerRef.current);
      routeLayerRef.current = null;
    }

    const bounds: [number, number][] = [];

    if (pickup) {
      markersRef.current.push(
        L.marker([pickup.lat, pickup.lng], { icon: dotIcon(L, "#22c55e") })
          .addTo(map)
          .bindTooltip("Pickup")
      );
      bounds.push([pickup.lat, pickup.lng]);
    }
    if (destination) {
      markersRef.current.push(
        L.marker([destination.lat, destination.lng], { icon: dotIcon(L, "#ef4444") })
          .addTo(map)
          .bindTooltip("Destination")
      );
      bounds.push([destination.lat, destination.lng]);
    }
    if (riderLocation) {
      markersRef.current.push(
        L.marker([riderLocation.lat, riderLocation.lng], { icon: dotIcon(L, "#3b82f6") })
          .addTo(map)
          .bindTooltip("Rider")
      );
      bounds.push([riderLocation.lat, riderLocation.lng]);
    }

    // Draw the driving route between pickup & destination.
    if (pickup && destination) {
      let active = true;
      (async () => {
        const geo = await fetchRoute(pickup, destination);
        if (!active || !mapInstanceRef.current) return;
        const line = L.polyline(geo.coords, { color: "#3b82f6", weight: 5, opacity: 0.85 }).addTo(map);
        routeLayerRef.current = line;
        onRouteCalculated?.(geo.distanceKm, geo.durationMin);
        map.fitBounds(line.getBounds(), { padding: [40, 40] });
      })();
      return () => {
        active = false;
      };
    }

    if (bounds.length === 1) {
      map.setView(bounds[0], 15);
    } else if (bounds.length > 1) {
      map.fitBounds(bounds, { padding: [40, 40] });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pickup, destination, riderLocation, mapReady]);

  // ── Autocomplete wired onto the consumer's #pickup-input/#destination-input ──
  // Google's version attached Places Autocomplete to these inputs by DOM id;
  // we replicate that so consuming pages need no changes. A debounced
  // Nominatim query populates a portal dropdown positioned under the focused
  // input.
  useEffect(() => {
    if (!interactive) return;
    const pickupInput = document.getElementById("pickup-input") as HTMLInputElement | null;
    const destInput = document.getElementById("destination-input") as HTMLInputElement | null;

    let timer: ReturnType<typeof setTimeout>;
    const makeHandler = (target: "pickup" | "destination", input: HTMLInputElement) => async () => {
      clearTimeout(timer);
      const q = input.value.trim();
      if (q.length < 3) {
        setDropdown(null);
        return;
      }
      timer = setTimeout(async () => {
        const items = await geocode(q);
        if (items.length === 0) {
          setDropdown(null);
          return;
        }
        const r = input.getBoundingClientRect();
        setDropdown({
          target,
          rect: { top: r.bottom + window.scrollY, left: r.left + window.scrollX, width: r.width },
          items,
        });
      }, 600);
    };

    const pickupHandler = pickupInput ? makeHandler("pickup", pickupInput) : null;
    const destHandler = destInput ? makeHandler("destination", destInput) : null;
    if (pickupInput && pickupHandler) pickupInput.addEventListener("input", pickupHandler);
    if (destInput && destHandler) destInput.addEventListener("input", destHandler);

    return () => {
      clearTimeout(timer);
      if (pickupInput && pickupHandler) pickupInput.removeEventListener("input", pickupHandler);
      if (destInput && destHandler) destInput.removeEventListener("input", destHandler);
    };
  }, [interactive, mapReady]);

  const chooseSuggestion = (s: Suggestion) => {
    if (!dropdown) return;
    const cb = dropdown.target === "pickup" ? cbRef.current.onPickupSelect : cbRef.current.onDestinationSelect;
    cb?.(s.lat, s.lng, s.label);
    setDropdown(null);
  };

  return (
    <>
      <div ref={mapRef} className="rounded-xl w-full" style={{ height }} />
      {dropdown &&
        typeof document !== "undefined" &&
        createPortal(
          <ul
            className="absolute z-[9999] max-h-56 overflow-y-auto rounded-xl border border-white/10 bg-neutral-900/95 backdrop-blur shadow-xl text-sm"
            style={{ top: dropdown.rect.top + 4, left: dropdown.rect.left, width: dropdown.rect.width }}
          >
            {dropdown.items.map((s, i) => (
              <li key={i}>
                <button
                  type="button"
                  onClick={() => chooseSuggestion(s)}
                  className="block w-full text-left px-3 py-2 hover:bg-white/10 transition-colors truncate"
                >
                  {s.label}
                </button>
              </li>
            ))}
          </ul>,
          document.body
        )}
    </>
  );
}

// ── Free geocoding/routing helpers ──

async function geocode(query: string): Promise<Suggestion[]> {
  try {
    // Bias results toward Ghana / the campus region; countrycodes=gh keeps
    // suggestions relevant for a Cape Coast student app.
    const url = `https://nominatim.openstreetmap.org/search?format=json&limit=5&countrycodes=gh&q=${encodeURIComponent(query)}`;
    const res = await fetch(url, { headers: { Accept: "application/json" } });
    if (!res.ok) return [];
    const data = (await res.json()) as { display_name: string; lat: string; lon: string }[];
    return data.map((d) => ({ label: d.display_name, lat: parseFloat(d.lat), lng: parseFloat(d.lon) }));
  } catch {
    return [];
  }
}

async function reverseGeocode(lat: number, lng: number): Promise<string> {
  try {
    const url = `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}`;
    const res = await fetch(url, { headers: { Accept: "application/json" } });
    if (!res.ok) return `${lat.toFixed(5)}, ${lng.toFixed(5)}`;
    const data = (await res.json()) as { display_name?: string };
    return data.display_name || `${lat.toFixed(5)}, ${lng.toFixed(5)}`;
  } catch {
    return `${lat.toFixed(5)}, ${lng.toFixed(5)}`;
  }
}

async function fetchRoute(
  a: { lat: number; lng: number },
  b: { lat: number; lng: number }
): Promise<{ coords: [number, number][]; distanceKm: number; durationMin: number }> {
  try {
    const url = `https://router.project-osrm.org/route/v1/driving/${a.lng},${a.lat};${b.lng},${b.lat}?overview=full&geometries=geojson`;
    const res = await fetch(url);
    if (res.ok) {
      const data = (await res.json()) as {
        routes?: { distance: number; duration: number; geometry: { coordinates: [number, number][] } }[];
      };
      const route = data.routes?.[0];
      if (route) {
        // GeoJSON is [lng, lat]; Leaflet wants [lat, lng].
        const coords = route.geometry.coordinates.map((c) => [c[1], c[0]] as [number, number]);
        return { coords, distanceKm: route.distance / 1000, durationMin: Math.ceil(route.duration / 60) };
      }
    }
  } catch {
    // fall through to straight-line estimate
  }
  // Fallback: straight line + haversine so a ride can still be created even
  // if the OSRM demo server is down or rate-limited.
  const p1: [number, number] = [a.lat, a.lng];
  const p2: [number, number] = [b.lat, b.lng];
  const km = haversineKm(p1, p2);
  return { coords: [p1, p2], distanceKm: km, durationMin: Math.ceil((km / 25) * 60) }; // ~25km/h urban
}
