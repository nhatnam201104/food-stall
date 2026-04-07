import { useEffect, useRef } from "react";
import type { PoiMarker } from "../types/tourist.types";
import { poiService } from "../services/poi.service";
import { useAudioStore } from "../stores/audioStore";
import { useLocationStore } from "../stores/locationStore";
import type { PoiDetail } from "../types/tourist.types";
import type { TriggerType } from "../types/audio.types";

const EARTH_RADIUS_METERS = 6371000;

function haversineDistance(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number,
): number {
  const toRad = (deg: number) => (deg * Math.PI) / 180;

  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) *
      Math.cos(toRad(lat2)) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return EARTH_RADIUS_METERS * c;
}

const GEOFENCE_RADIUS_METERS = 50;

interface LatLng {
  latitude: number;
  longitude: number;
}

export function useGeofencing() {
  const triggerPoi = useAudioStore((s: any) => s.triggerPoi);
  const userLocation = useLocationStore((s: any) => s.userLocation);
  const poisRef = useRef<PoiMarker[]>([]);
  const lastTriggeredRef = useRef<Map<string, number>>(new Map());

  // Fetch POIs once
  useEffect(() => {
    poiService
      .listAll(1, 500)
      .then((res: any) => {
        poisRef.current = res.data.data || [];
      })
      .catch(() => {});
  }, []);

  // Check geofence on location change
  useEffect(() => {
    if (!userLocation || poisRef.current.length === 0) return;

    const now = Date.now();
    const nearby: PoiMarker[] = [];

    for (const poi of poisRef.current) {
      const dist = haversineDistance(
        userLocation.latitude,
        userLocation.longitude,
        Number(poi.latitude),
        Number(poi.longitude),
      );

      if (dist <= GEOFENCE_RADIUS_METERS) {
        nearby.push(poi);
      }
    }

    for (const poi of nearby) {
      const last = lastTriggeredRef.current.get(poi.id) || 0;
      if (now - last < 30000) continue; // 30s throttle

      lastTriggeredRef.current.set(poi.id, now);

      poiService
        .detail(poi.id)
        .then((res: any) => {
          triggerPoi(res.data.data, "proximity");
        })
        .catch(() => {});
    }
  }, [userLocation, triggerPoi]);
}
