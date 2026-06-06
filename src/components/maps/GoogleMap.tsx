"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { Loader } from "@googlemaps/js-api-loader";

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
  const [map, setMap] = useState<google.maps.Map | null>(null);
  const [directionsRenderer, setDirectionsRenderer] = useState<google.maps.DirectionsRenderer | null>(null);
  const markersRef = useRef<google.maps.Marker[]>([]);

  const clearMarkers = useCallback(() => {
    markersRef.current.forEach((m) => m.setMap(null));
    markersRef.current = [];
  }, []);

  const mapsApiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;
  const hasValidMapsKey = Boolean(
    mapsApiKey &&
    !mapsApiKey.startsWith("placeholder") &&
    !mapsApiKey.startsWith("your_")
  );
  const [loadError, setLoadError] = useState<string | null>(null);

  useEffect(() => {
    if (!mapRef.current || !hasValidMapsKey) return;

    const loader = new Loader({
      apiKey: mapsApiKey!,
      version: "weekly",
      libraries: ["places", "geometry"],
    });

    loader.load().then(() => {
      setLoadError(null);
      const newMap = new google.maps.Map(mapRef.current!, {
        center: { lat: 5.1053, lng: -1.2466 },
        zoom: 14,
        disableDefaultUI: false,
        styles: [{ featureType: "poi", elementType: "labels", stylers: [{ visibility: "off" }] }],
      });

      const renderer = new google.maps.DirectionsRenderer({
        map: newMap,
        suppressMarkers: false,
        polylineOptions: { strokeColor: "#3b82f6", strokeWeight: 5 },
      });

      setMap(newMap);
      setDirectionsRenderer(renderer);

      if (interactive && onPickupSelect) {
        const pickupInput = document.getElementById("pickup-input") as HTMLInputElement;
        if (pickupInput) {
          const autocomplete = new google.maps.places.Autocomplete(pickupInput);
          autocomplete.addListener("place_changed", () => {
            const place = autocomplete.getPlace();
            if (place.geometry?.location) {
              onPickupSelect(
                place.geometry.location.lat(),
                place.geometry.location.lng(),
                place.formatted_address || ""
              );
            }
          });
        }
      }

      if (interactive && onDestinationSelect) {
        const destInput = document.getElementById("destination-input") as HTMLInputElement;
        if (destInput) {
          const autocomplete = new google.maps.places.Autocomplete(destInput);
          autocomplete.addListener("place_changed", () => {
            const place = autocomplete.getPlace();
            if (place.geometry?.location) {
              onDestinationSelect(
                place.geometry.location.lat(),
                place.geometry.location.lng(),
                place.formatted_address || ""
              );
            }
          });
        }
      }
    }).catch((err: Error) => {
      console.error("Google Maps failed to load:", err);
      setLoadError(
        err.message?.includes("ApiNotActivated")
          ? "Enable Maps JavaScript API, Places API, and Directions API in Google Cloud Console."
          : err.message?.includes("InvalidKey")
            ? "Invalid Google Maps API key. Check NEXT_PUBLIC_GOOGLE_MAPS_API_KEY in .env.local."
            : "Google Maps failed to load. Ensure billing is enabled and APIs are activated."
      );
    });
  }, [hasValidMapsKey, interactive, mapsApiKey, onPickupSelect, onDestinationSelect]);

  useEffect(() => {
    if (!map || !directionsRenderer) return;

    clearMarkers();

    if (pickup && destination) {
      const directionsService = new google.maps.DirectionsService();
      directionsService.route(
        {
          origin: { lat: pickup.lat, lng: pickup.lng },
          destination: { lat: destination.lat, lng: destination.lng },
          travelMode: google.maps.TravelMode.DRIVING,
        },
        (result, status) => {
          if (status === "OK" && result) {
            directionsRenderer.setDirections(result);
            const leg = result.routes[0]?.legs[0];
            if (leg && onRouteCalculated) {
              const distanceKm = (leg.distance?.value || 0) / 1000;
              const durationMinutes = Math.ceil((leg.duration?.value || 0) / 60);
              onRouteCalculated(distanceKm, durationMinutes);
            }
          }
        }
      );
    } else {
      directionsRenderer.setDirections({ routes: [] } as unknown as google.maps.DirectionsResult);
      if (pickup) {
        markersRef.current.push(
          new google.maps.Marker({
            map,
            position: { lat: pickup.lat, lng: pickup.lng },
            title: "Pickup",
            icon: { url: "http://maps.google.com/mapfiles/ms/icons/green-dot.png" },
          })
        );
      }
    }

    if (riderLocation) {
      markersRef.current.push(
        new google.maps.Marker({
          map,
          position: { lat: riderLocation.lat, lng: riderLocation.lng },
          title: "Rider",
          icon: { url: "http://maps.google.com/mapfiles/ms/icons/blue-dot.png" },
        })
      );
    }
  }, [map, directionsRenderer, pickup, destination, riderLocation, onRouteCalculated, clearMarkers]);

  if (!hasValidMapsKey) {
    return (
      <div className="bg-muted rounded-xl flex flex-col items-center justify-center gap-2 p-6 text-center" style={{ height }}>
        <p className="text-muted-foreground text-sm font-medium">Google Maps API key required</p>
        <p className="text-muted-foreground text-xs max-w-sm">
          Add your key to <code className="text-foreground">.env.local</code> as{" "}
          <code className="text-foreground">NEXT_PUBLIC_GOOGLE_MAPS_API_KEY</code>, then restart the dev server.
        </p>
      </div>
    );
  }

  if (loadError) {
    return (
      <div className="bg-muted rounded-xl flex flex-col items-center justify-center gap-2 p-6 text-center" style={{ height }}>
        <p className="text-red-400 text-sm font-medium">Map could not load</p>
        <p className="text-muted-foreground text-xs max-w-sm">{loadError}</p>
      </div>
    );
  }

  return <div ref={mapRef} className="rounded-xl w-full" style={{ height }} />;
}
