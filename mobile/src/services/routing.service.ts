import axiosInstance from "../configs/axios.config";
import type { TourDetail } from "../types/tourist.types";

// ─── Types ──────────────────────────────────────────────────────────────────────

export interface RouteCoordinate {
  latitude: number;
  longitude: number;
}

export interface RouteResult {
  coordinates: RouteCoordinate[];
  totalDistanceMeters: number;
  totalDurationSeconds: number;
}

// ─── Fallback: straight-line route ──────────────────────────────────────────────

function buildStraightLineRoute(waypoints: RouteCoordinate[]): RouteResult {
  const coordinates: RouteCoordinate[] = [];

  for (const wp of waypoints) {
    coordinates.push({ ...wp });
  }

  // Calculate rough total distance
  let totalDistance = 0;
  for (let i = 1; i < waypoints.length; i++) {
    const dLat = waypoints[i].latitude - waypoints[i - 1].latitude;
    const dLng = waypoints[i].longitude - waypoints[i - 1].longitude;
    totalDistance += Math.sqrt(dLat * dLat + dLng * dLng) * 111320;
  }

  return {
    coordinates,
    totalDistanceMeters: totalDistance,
    totalDurationSeconds: totalDistance / 1.4, // ~walking speed
  };
}

// ─── Public API ─────────────────────────────────────────────────────────────────

/**
 * Get walking route for a tour's POIs in sequence order.
 *
 * Calls backend proxy which calls OSRM for real road-following route.
 * Falls back to straight-line if backend fails.
 *
 * @param tour - TourDetail with tourPois array
 * @returns RouteResult with coordinates forming the walking path
 */
export async function getTourRoute(tour: TourDetail): Promise<RouteResult> {
  // Sort POIs by sequenceOrder to ensure correct visit order
  const sortedPois = [...tour.tourPois].sort(
    (a, b) => a.sequenceOrder - b.sequenceOrder,
  );

  console.log(
    "[Routing] getTourRoute called for tour:",
    tour.name,
    "POIs:",
    sortedPois.length,
  );

  const waypoints: RouteCoordinate[] = sortedPois.map((tp) => ({
    latitude: Number(tp.poi.latitude),
    longitude: Number(tp.poi.longitude),
  }));

  console.log("[Routing] Waypoints:", JSON.stringify(waypoints));

  try {
    console.log("[Routing] Calling backend /tourist/tours/route...");
    const response = await axiosInstance.post("/tourist/tours/route", {
      waypoints,
    });
    const data = response.data?.data;

    if (data?.coordinates && data.coordinates.length > 0) {
      console.log(
        "[Routing] Backend route success, coords:",
        data.coordinates.length,
      );
      return {
        coordinates: data.coordinates,
        totalDistanceMeters: data.totalDistanceMeters ?? 0,
        totalDurationSeconds: data.totalDurationSeconds ?? 0,
      };
    }

    console.log("[Routing] Backend returned empty coordinates");
  } catch (err) {
    console.log("[Routing] Backend route failed, using straight-line:", err);
  }

  console.log("[Routing] Using straight-line fallback");
  return buildStraightLineRoute(waypoints);
}
