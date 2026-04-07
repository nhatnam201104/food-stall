import { StatusCodes } from "http-status-codes";
import { AppError } from "../../errors/app-error";

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

// ─── OSRM Public API ────────────────────────────────────────────────────────────

const OSRM_BASE_URL = "https://router.project-osrm.org/route/v1";

/**
 * Fetch walking route between multiple waypoints using OSRM public API.
 * Server-side call — no CORS issues.
 */
async function fetchOsrmRoute(
  waypoints: RouteCoordinate[],
): Promise<RouteResult | null> {
  if (waypoints.length < 2) return null;

  // OSRM expects: lng,lat;lng,lat;...
  const coordsStr = waypoints
    .map((wp) => `${wp.longitude},${wp.latitude}`)
    .join(";");

  const url = `${OSRM_BASE_URL}/foot/${coordsStr}?overview=full&geometries=geojson`;

  console.log("[Routing] Fetching OSRM:", url);

  const response = await fetch(url);

  if (!response.ok) {
    console.error("[Routing] OSRM error:", response.status);
    throw new AppError(
      `OSRM API error: ${response.status}`,
      StatusCodes.BAD_GATEWAY,
      "ROUTING_ERROR",
    );
  }

  const data = await response.json();

  if (data.code !== "Ok" || !data.routes || data.routes.length === 0) {
    console.warn("[Routing] No valid route from OSRM");
    return null;
  }

  const route = data.routes[0];
  const geojsonCoords: number[][] = route.geometry.coordinates;

  console.log(
    `[Routing] OSRM success: ${geojsonCoords.length} coords, ${Math.round(route.distance)}m`,
  );

  // Convert GeoJSON [lng, lat] to {latitude, longitude}
  const coordinates: RouteCoordinate[] = geojsonCoords.map(
    ([lng, lat]: number[]) => ({ latitude: lat, longitude: lng }),
  );

  return {
    coordinates,
    totalDistanceMeters: route.distance,
    totalDurationSeconds: route.duration,
  };
}

// ─── Fallback: straight-line route ──────────────────────────────────────────────

function buildStraightLineRoute(waypoints: RouteCoordinate[]): RouteResult {
  let totalDistance = 0;
  for (let i = 1; i < waypoints.length; i++) {
    const dLat = waypoints[i].latitude - waypoints[i - 1].latitude;
    const dLng = waypoints[i].longitude - waypoints[i - 1].longitude;
    totalDistance += Math.sqrt(dLat * dLat + dLng * dLng) * 111320;
  }

  return {
    coordinates: waypoints.map((wp) => ({ ...wp })),
    totalDistanceMeters: totalDistance,
    totalDurationSeconds: totalDistance / 1.4,
  };
}

// ─── Public API ─────────────────────────────────────────────────────────────────

export const routingService = {
  /**
   * Get walking route for a list of coordinates (in order).
   * Tries OSRM first, falls back to straight-line.
   */
  async getRoute(waypoints: RouteCoordinate[]): Promise<RouteResult> {
    try {
      const route = await fetchOsrmRoute(waypoints);
      if (route && route.coordinates.length > 0) return route;
    } catch (err) {
      console.warn("[Routing] OSRM failed, using straight-line:", err);
    }

    return buildStraightLineRoute(waypoints);
  },
};
