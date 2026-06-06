import { describe, it, expect } from "vitest";
import { calculateFare, haversineDistance, findNearestRider } from "@/lib/services/fare.service";

describe("FareService", () => {
  const settings = { base_fare: 5, per_km_rate: 2.5, per_min_rate: 0.5 };

  it("calculates fare correctly", () => {
    const fare = calculateFare(10, 20, settings);
    expect(fare).toBe(5 + 10 * 2.5 + 20 * 0.5);
  });

  it("calculates haversine distance", () => {
    const dist = haversineDistance(5.1053, -1.2466, 5.1153, -1.2566);
    expect(dist).toBeGreaterThan(0);
    expect(dist).toBeLessThan(20);
  });

  it("finds nearest rider", () => {
    const riders = [
      { current_lat: 5.11, current_lng: -1.25 },
      { current_lat: 5.105, current_lng: -1.247 },
      { current_lat: null, current_lng: null },
    ];
    const nearest = findNearestRider(riders, 5.1053, -1.2466);
    expect(nearest?.current_lat).toBe(5.105);
  });

  it("returns null when no riders available", () => {
    expect(findNearestRider([], 5.1, -1.2)).toBeNull();
  });
});
