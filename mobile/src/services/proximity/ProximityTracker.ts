import * as Location from "expo-location";
import { useAudioStore } from "../../stores/audioStore";
import { useLocationStore } from "../../stores/locationStore";
import { useTourStore } from "../../stores/tourStore";
import type { PoiMarker } from "../../types/tourist.types";

// ─── Configuration ────────────────────────────────────────────────────────────
const PROXIMITY_RADIUS_M = 30;
const DWELL_THRESHOLD_MS = 3000;

// ─── Types ────────────────────────────────────────────────────────────────────
interface TrackedPoi {
  poi: PoiMarker;
  distanceMeters: number;
  enteredAt: number | null;
}

// ─── Haversine distance (meters) ──────────────────────────────────────────────
function haversineDistanceMeters(
  lat1: number,
  lng1: number,
  lat2: number,
  lng2: number,
): number {
  const R = 6_371_000;
  const toRad = (deg: number) => (deg * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2;
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

/**
 * ProximityTracker — Monitors user location against POI list.
 *
 * Uses its own direct `expo-location` watchPosition subscription
 * so it works independently of the map component.
 *
 * When the user stays within range of a POI for the dwell threshold,
 * fires `onTrigger` with the POI id. If multiple POIs are within range,
 * selects the one with the highest priority (ties broken by closest distance).
 */
export class ProximityTracker {
  private pois: PoiMarker[] = [];
  private tracked: Map<string, TrackedPoi> = new Map();
  private storeUnsubscribe: (() => void) | null = null;
  private locationSubscription: Location.LocationSubscription | null = null;
  private lastCoords: { latitude: number; longitude: number } | null = null;
  private selectedPoiId: string | null = null;
  private dwellCheckInterval: ReturnType<typeof setInterval> | null = null;
  private playedPoiIds: Set<string> = new Set();
  private isPaused = false;
  private pausedAt = 0;
  private audioUnsubscribe: (() => void) | null = null;
  private destroyed = false;

  public onTrigger: ((poiId: string) => void) | null = null;

  constructor() {
    this.startTracking();
    this.subscribeToAudioStatus();
  }

  // ─── Public API ──────────────────────────────────────────────────────────

  setPois(pois: PoiMarker[]): void {
    this.pois = pois;
    const activeIds = new Set(pois.map((p) => p.id));

    // Remove tracked POIs that are no longer in the list
    for (const id of this.tracked.keys()) {
      if (!activeIds.has(id)) {
        this.tracked.delete(id);
      }
    }

    // Remove played POIs that are no longer in the list
    for (const id of this.playedPoiIds) {
      if (!activeIds.has(id)) {
        this.playedPoiIds.delete(id);
      }
    }

    // Clear selection if no longer valid
    if (this.selectedPoiId && !activeIds.has(this.selectedPoiId)) {
      this.selectedPoiId = null;
    }
  }

  /** Reset all played/tracked state — call when tour starts */
  resetState(): void {
    this.tracked.clear();
    this.playedPoiIds.clear();
    this.selectedPoiId = null;
    this.stopDwellCheck();
  }

  getSelectedPoiId(): string | null {
    return this.selectedPoiId;
  }

  getProximityState(poiId: string): {
    isNearby: boolean;
    enteredAt: number | null;
    distanceMeters: number;
  } {
    const tracked = this.tracked.get(poiId);
    if (tracked) {
      return {
        isNearby: true,
        enteredAt: tracked.enteredAt,
        distanceMeters: tracked.distanceMeters,
      };
    }
    const poi = this.pois.find((p) => p.id === poiId);
    if (poi && this.lastCoords) {
      const dist = haversineDistanceMeters(
        this.lastCoords.latitude,
        this.lastCoords.longitude,
        Number(poi.latitude),
        Number(poi.longitude),
      );
      return { isNearby: false, enteredAt: null, distanceMeters: dist };
    }
    return { isNearby: false, enteredAt: null, distanceMeters: -1 };
  }

  pause(): void {
    if (this.isPaused) return;
    this.isPaused = true;
    this.pausedAt = Date.now();
    this.stopDwellCheck();
  }

  resume(): void {
    if (!this.isPaused) return;
    this.isPaused = false;

    if (this.pausedAt > 0) {
      const pauseDuration = Date.now() - this.pausedAt;
      for (const [, t] of this.tracked) {
        if (t.enteredAt !== null) {
          t.enteredAt += pauseDuration;
        }
      }
    }

    this.pausedAt = 0;

    if (this.tracked.size > 0) {
      this.startDwellCheck();
    }
  }

  destroy(): void {
    this.destroyed = true;
    this.locationSubscription?.remove();
    this.locationSubscription = null;
    if (this.dwellCheckInterval) {
      clearInterval(this.dwellCheckInterval);
      this.dwellCheckInterval = null;
    }
    if (this.storeUnsubscribe) {
      this.storeUnsubscribe();
      this.storeUnsubscribe = null;
    }
    if (this.audioUnsubscribe) {
      this.audioUnsubscribe();
      this.audioUnsubscribe = null;
    }
    this.tracked.clear();
    this.pois = [];
  }

  // ─── Internal Logic ─────────────────────────────────────────────────────

  private startTracking(): void {
    this.storeUnsubscribe = useLocationStore.subscribe((state, prevState) => {
      if (state.userLocation !== prevState.userLocation && state.userLocation) {
        this.onLocationUpdate(state.userLocation);
      }
    });

    this.startDirectGpsWatching();

    const currentLocation = useLocationStore.getState().userLocation;
    if (currentLocation) {
      this.onLocationUpdate(currentLocation);
    }
  }

  private async startDirectGpsWatching(): Promise<void> {
    try {
      const { status } = await Location.getForegroundPermissionsAsync();
      if (status !== "granted") {
        const { status: newStatus } =
          await Location.requestForegroundPermissionsAsync();
        if (newStatus !== "granted") return;
      }

      try {
        const initialPos = await Location.getCurrentPositionAsync({
          accuracy: Location.Accuracy.High,
        });
        const coords = {
          latitude: initialPos.coords.latitude,
          longitude: initialPos.coords.longitude,
        };
        useLocationStore.getState().setUserLocation(coords);
        this.onLocationUpdate(coords);
      } catch {
        // Wait for watchPosition instead
      }

      this.locationSubscription = await Location.watchPositionAsync(
        {
          accuracy: Location.Accuracy.High,
          timeInterval: 3000,
          distanceInterval: 1,
        },
        (location) => {
          if (this.destroyed) return;
          const coords = {
            latitude: location.coords.latitude,
            longitude: location.coords.longitude,
          };
          useLocationStore.getState().setUserLocation(coords);
          this.onLocationUpdate(coords);
        },
      );
    } catch {
      // GPS watching failed
    }
  }

  private onLocationUpdate(coords: {
    latitude: number;
    longitude: number;
  }): void {
    if (this.destroyed) return;

    this.lastCoords = coords;
    if (this.pois.length === 0) return;

    const now = Date.now();

    const allDistances: Array<{
      poi: PoiMarker;
      distanceMeters: number;
    }> = [];

    for (const poi of this.pois) {
      const dist = haversineDistanceMeters(
        coords.latitude,
        coords.longitude,
        Number(poi.latitude),
        Number(poi.longitude),
      );
      allDistances.push({ poi, distanceMeters: dist });
    }

    allDistances.sort((a, b) => a.distanceMeters - b.distanceMeters);

    const nearbyPois = allDistances.filter(
      ({ distanceMeters }) => distanceMeters <= PROXIMITY_RADIUS_M,
    );

    // Reset timers for POIs no longer within range
    const nearbyIds = new Set(nearbyPois.map((n) => n.poi.id));
    for (const [id] of this.tracked.entries()) {
      if (!nearbyIds.has(id)) {
        this.tracked.delete(id);
      }
    }

    // If none within range → clear selection, stop dwell timer, clear played
    if (nearbyPois.length === 0) {
      this.selectedPoiId = null;
      this.stopDwellCheck();
      if (this.playedPoiIds.size > 0) {
        this.playedPoiIds.clear();
      }
      return;
    }

    // Pick highest priority (ties broken by closest distance)
    nearbyPois.sort((a, b) => {
      if (b.poi.priority !== a.poi.priority) {
        return b.poi.priority - a.poi.priority;
      }
      return a.distanceMeters - b.distanceMeters;
    });

    const selected = nearbyPois[0];
    this.selectedPoiId = selected.poi.id;

    // Update tracking for all nearby POIs (skip already-played ones)
    for (const { poi, distanceMeters } of nearbyPois) {
      if (this.playedPoiIds.has(poi.id)) continue;

      const existing = this.tracked.get(poi.id);
      if (existing) {
        existing.distanceMeters = distanceMeters;
      } else {
        this.tracked.set(poi.id, {
          poi,
          distanceMeters,
          enteredAt: now,
        });
      }
    }

    // If selected POI was already played, re-select from non-played tracked POIs
    if (this.selectedPoiId && this.playedPoiIds.has(this.selectedPoiId)) {
      this.selectedPoiId = null;
      for (const [id] of this.tracked) {
        if (!this.playedPoiIds.has(id)) {
          this.selectedPoiId = id;
          break;
        }
      }
      if (!this.selectedPoiId) {
        this.stopDwellCheck();
        return;
      }
    }

    // Check if selected POI has been near long enough
    const trackedSelected = this.tracked.get(selected.poi.id);
    if (!trackedSelected || trackedSelected.enteredAt === null) {
      this.startDwellCheck();
      return;
    }

    const elapsedMs = now - trackedSelected.enteredAt;

    if (elapsedMs < DWELL_THRESHOLD_MS) {
      if (!this.isPaused) {
        this.startDwellCheck();
      }
      return;
    }

    // Dwell time reached — trigger
    this.playedPoiIds.add(selected.poi.id);
    this.tracked.delete(selected.poi.id);
    this.stopDwellCheck();
    this.onTrigger?.(selected.poi.id);
  }

  // ─── Dwell Check Timer ──────────────────────────────────────────────────

  private startDwellCheck(): void {
    if (this.dwellCheckInterval) return;
    if (this.isPaused) return;

    this.dwellCheckInterval = setInterval(() => {
      if (this.destroyed) {
        this.stopDwellCheck();
        return;
      }

      this.reselectPoi();

      if (!this.selectedPoiId) {
        this.stopDwellCheck();
        return;
      }

      const tracked = this.tracked.get(this.selectedPoiId);
      if (!tracked || tracked.enteredAt === null) {
        this.stopDwellCheck();
        return;
      }

      const elapsedMs = Date.now() - tracked.enteredAt;

      if (elapsedMs >= DWELL_THRESHOLD_MS) {
        const triggeredId = this.selectedPoiId;

        if (this.playedPoiIds.has(triggeredId)) {
          this.tracked.delete(triggeredId);
          this.selectedPoiId = null;
          return;
        }

        this.playedPoiIds.add(triggeredId);
        this.tracked.delete(triggeredId);

        // Reset enteredAt for remaining non-played POIs
        const resetTime = Date.now();
        for (const [id, t] of this.tracked) {
          if (!this.playedPoiIds.has(id)) {
            t.enteredAt = resetTime;
          }
        }

        this.selectedPoiId = null;
        this.onTrigger?.(triggeredId);
      }
    }, 500);
  }

  private reselectPoi(): void {
    if (this.tracked.size === 0) {
      this.selectedPoiId = null;
      return;
    }

    const candidates: Array<{
      poi: PoiMarker;
      distanceMeters: number;
      enteredAt: number | null;
    }> = [];

    for (const [id, t] of this.tracked) {
      if (this.playedPoiIds.has(id)) continue;
      candidates.push({
        poi: t.poi,
        distanceMeters: t.distanceMeters,
        enteredAt: t.enteredAt,
      });
    }

    candidates.sort((a, b) => {
      if (b.poi.priority !== a.poi.priority) {
        return b.poi.priority - a.poi.priority;
      }
      return a.distanceMeters - b.distanceMeters;
    });

    this.selectedPoiId = candidates[0]?.poi.id ?? null;
  }

  private stopDwellCheck(): void {
    if (this.dwellCheckInterval) {
      clearInterval(this.dwellCheckInterval);
      this.dwellCheckInterval = null;
    }
  }

  // ─── Audio Status Subscription ──────────────────────────────────────────

  private subscribeToAudioStatus(): void {
    let previousStatus = useAudioStore.getState().status;

    this.audioUnsubscribe = useAudioStore.subscribe((state, prevState) => {
      const newStatus = state.status;
      if (newStatus === previousStatus) return;
      previousStatus = newStatus;

      const isPlaying =
        newStatus === "playing" ||
        newStatus === "loading" ||
        newStatus === "paused";

      if (isPlaying) {
        this.pause();
      } else if (newStatus === "idle") {
        this.resume();
      }
    });

    const initialStatus = useAudioStore.getState().status;
    const isInitiallyPlaying =
      initialStatus === "playing" ||
      initialStatus === "loading" ||
      initialStatus === "paused";
    if (isInitiallyPlaying) {
      this.isPaused = true;
    }
  }
}
