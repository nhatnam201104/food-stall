import React, { memo, useCallback, useEffect, useRef } from "react";
import { StyleSheet, Text, View } from "react-native";
import * as Location from "expo-location";
import MapView, { Marker, Polyline, type Region } from "react-native-maps";
import type { PoiMarker } from "../../types/tourist.types";
import type { RouteCoordinate } from "../../services/routing.service";
import { useLocationStore } from "../../stores/locationStore";

interface MainMapProps {
  pois: PoiMarker[];
  activePoiId?: string | null;
  onSelectPoi?: (poi: PoiMarker) => void;
  /** Changing this key triggers a re-focus on user location */
  focusKey?: string | number;
  /** Tour route coordinates for drawing walking path between POIs */
  tourRouteCoordinates?: RouteCoordinate[];
  /** Map of poiId → sequence order number (for numbered markers in tour mode) */
  tourPoiOrder?: Record<string, number>;
}

/** Default region (Vietnam center) — used before GPS lock */
const DEFAULT_REGION: Region = {
  latitude: 10.762,
  longitude: 106.662,
  latitudeDelta: 0.05,
  longitudeDelta: 0.05,
};

// ─── Color picker based on category / priority ────────────────────────────────
const getPoiColor = (poi: PoiMarker): string => {
  const cat = (poi.category ?? "").toLowerCase();
  if (cat.includes("food") || cat.includes("restaurant") || cat.includes("eat"))
    return "#FF6B35"; // orange for food
  if (
    cat.includes("history") ||
    cat.includes("historic") ||
    cat.includes("heritage")
  )
    return "#8B4513"; // brown for history
  if (poi.priority > 5) return "#FFD700"; // gold for high priority
  return "#6366f1"; // indigo default
};

// ─── Emoji picker based on category / priority ────────────────────────────────
const getPoiEmoji = (poi: PoiMarker): string => {
  const cat = (poi.category ?? "").toLowerCase();
  if (cat.includes("food") || cat.includes("restaurant") || cat.includes("eat"))
    return "🍽️";
  if (
    cat.includes("history") ||
    cat.includes("historic") ||
    cat.includes("heritage")
  )
    return "🏛️";
  if (poi.priority > 5) return "🏆";
  return "🔸";
};

// ─── Individual POI Marker (memoized for performance) ─────────────────────────
interface PoiMarkerProps {
  poi: PoiMarker;
  isActive: boolean;
  onSelect: (poi: PoiMarker) => void;
  /** Sequence number for tour mode (1-based). undefined = normal mode */
  sequenceNumber?: number;
}

const PoiMarkerComponent = memo(
  ({ poi, isActive, onSelect, sequenceNumber }: PoiMarkerProps) => {
    const color = getPoiColor(poi);

    // Tour mode: show numbered circle marker
    if (sequenceNumber !== undefined) {
      return (
        <Marker
          coordinate={{
            latitude: Number(poi.latitude),
            longitude: Number(poi.longitude),
          }}
          title={`${sequenceNumber}. ${poi.name}`}
          description={poi.category ?? ""}
          onPress={() => onSelect(poi)}
          anchor={{ x: 0.5, y: 0.5 }}
        >
          <View
            style={[
              tourMarkerStyles.circle,
              isActive && tourMarkerStyles.circleActive,
            ]}
          >
            <Text style={tourMarkerStyles.number}>{sequenceNumber}</Text>
          </View>
        </Marker>
      );
    }

    // Normal mode: default pin marker
    return (
      <Marker
        coordinate={{
          latitude: Number(poi.latitude),
          longitude: Number(poi.longitude),
        }}
        pinColor={color}
        title={poi.name}
        description={poi.category ?? ""}
        onPress={() => onSelect(poi)}
      />
    );
  },
);

const PoiMarkerMemoized = memo(PoiMarkerComponent);

// ─── Tour marker styles ───────────────────────────────────────────────────────
const tourMarkerStyles = StyleSheet.create({
  circle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "#4f46e5",
    borderWidth: 2.5,
    borderColor: "#ffffff",
    alignItems: "center",
    justifyContent: "center",
    elevation: 4,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 3,
  },
  circleActive: {
    backgroundColor: "#dc2626",
    width: 38,
    height: 38,
    borderRadius: 19,
    borderWidth: 3,
  },
  number: {
    color: "#ffffff",
    fontWeight: "800",
    fontSize: 14,
  },
});

// ─── Main Map Component ───────────────────────────────────────────────────────
const MainMapComponent = ({
  pois,
  activePoiId,
  onSelectPoi,
  focusKey,
  tourRouteCoordinates,
  tourPoiOrder,
}: MainMapProps) => {
  const mapRef = useRef<MapView | null>(null);
  const hasAnimatedToUser = useRef(false);
  const locationSubscription = useRef<Location.LocationSubscription | null>(
    null,
  );

  const setUserLocation = useLocationStore((s) => s.setUserLocation);
  const userLocation = useLocationStore((s) => s.userLocation);
  const hasPermission = useLocationStore((s) => s.hasPermission);
  const hasInitialLocation = useLocationStore((s) => s.hasInitialLocation);

  // ─── Compute initial region from user location or default ────────────────
  const initialRegion: Region = userLocation
    ? {
        latitude: userLocation.latitude,
        longitude: userLocation.longitude,
        latitudeDelta: 0.01,
        longitudeDelta: 0.01,
      }
    : DEFAULT_REGION;

  // ─── Auto-focus on user location + nearby POIs ───────────────────────────
  // When the map spins up and user location is available, automatically
  // zoom to the user's position. Includes a retry mechanism in case the
  // map ref isn't ready on the first location fix.
  const animateToUserLocation = useCallback(
    (attempt = 0) => {
      if (!userLocation) return;

      const map = mapRef.current;
      if (!map) {
        // Map ref not ready yet — retry up to 5 times with 300ms delay
        if (attempt < 5) {
          setTimeout(() => animateToUserLocation(attempt + 1), 300);
        }
        return;
      }

      // Find POIs within 2km of user for the initial viewport
      const NEARBY_RADIUS_M = 2000;
      const nearbyPois = pois.filter((poi) => {
        const dLat = Number(poi.latitude) - userLocation.latitude;
        const dLng = Number(poi.longitude) - userLocation.longitude;
        const dist = Math.sqrt(dLat * dLat + dLng * dLng) * 111320; // rough meters
        return dist <= NEARBY_RADIUS_M;
      });

      if (nearbyPois.length > 0) {
        // Fit all nearby POIs + user location in the viewport
        const coordinates = [
          {
            latitude: userLocation.latitude,
            longitude: userLocation.longitude,
          },
          ...nearbyPois.map((p) => ({
            latitude: Number(p.latitude),
            longitude: Number(p.longitude),
          })),
        ];

        const minLat = Math.min(...coordinates.map((c) => c.latitude));
        const maxLat = Math.max(...coordinates.map((c) => c.latitude));
        const minLng = Math.min(...coordinates.map((c) => c.longitude));
        const maxLng = Math.max(...coordinates.map((c) => c.longitude));

        // Add padding so markers aren't at the edge
        const latPadding = (maxLat - minLat) * 0.3 || 0.005;
        const lngPadding = (maxLng - minLng) * 0.3 || 0.005;

        map.animateToRegion(
          {
            latitude: (minLat + maxLat) / 2,
            longitude: (minLng + maxLng) / 2,
            latitudeDelta: maxLat - minLat + latPadding * 2,
            longitudeDelta: maxLng - minLng + lngPadding * 2,
          },
          1000,
        );
      } else {
        // No nearby POIs — just zoom to user at street level
        map.animateCamera(
          {
            center: {
              latitude: userLocation.latitude,
              longitude: userLocation.longitude,
            },
            zoom: 16,
          },
          { duration: 1000 },
        );
      }
    },
    [userLocation, pois],
  );

  useEffect(() => {
    // Only trigger auto-focus once when we first get a user location
    if (!hasInitialLocation || !userLocation) return;
    if (hasAnimatedToUser.current) return;
    hasAnimatedToUser.current = true;

    animateToUserLocation();
  }, [hasInitialLocation, userLocation, animateToUserLocation]);

  // ─── Re-focus when focusKey changes (e.g. tour starts) ────────────────
  useEffect(() => {
    if (!focusKey) return;
    // Reset the flag so auto-focus can fire again
    hasAnimatedToUser.current = false;
  }, [focusKey]);

  // ─── Start watching user position ──────────────────────────────────────
  useEffect(() => {
    if (!hasPermission) return;

    let cancelled = false;

    const startWatching = async () => {
      try {
        // Request foreground location permission first
        const { status } = await Location.requestForegroundPermissionsAsync();
        if (status !== "granted") return;

        // Get initial position immediately for faster focus
        try {
          const initialPos = await Location.getCurrentPositionAsync({
            accuracy: Location.Accuracy.Balanced,
          });
          if (!cancelled) {
            const { latitude, longitude } = initialPos.coords;
            setUserLocation({ latitude, longitude });
          }
        } catch {
          // getCurrentPosition may fail indoors — watchPosition will retry
        }

        // Then watch for continuous updates
        locationSubscription.current = await Location.watchPositionAsync(
          {
            accuracy: Location.Accuracy.Balanced,
            timeInterval: 5000,
            distanceInterval: 5,
          },
          (location) => {
            if (cancelled) return;
            const { latitude, longitude } = location.coords;
            setUserLocation({ latitude, longitude });
          },
        );
      } catch {
        // Location subscription failed — map still works without tracking
      }
    };

    void startWatching();

    return () => {
      cancelled = true;
      locationSubscription.current?.remove();
      locationSubscription.current = null;
    };
  }, [hasPermission, setUserLocation]);

  // ─── Debug: log tour route coordinates ──────────────────────────────────
  useEffect(() => {
    console.log(
      "[SimulatedMap] tourRouteCoordinates:",
      tourRouteCoordinates?.length ?? 0,
      tourRouteCoordinates && tourRouteCoordinates.length > 0
        ? `first: ${JSON.stringify(tourRouteCoordinates[0])} last: ${JSON.stringify(tourRouteCoordinates[tourRouteCoordinates.length - 1])}`
        : "",
    );

    // Auto-zoom to fit tour route when coordinates arrive
    if (
      tourRouteCoordinates &&
      tourRouteCoordinates.length >= 2 &&
      mapRef.current
    ) {
      const lats = tourRouteCoordinates.map((c) => c.latitude);
      const lngs = tourRouteCoordinates.map((c) => c.longitude);
      const minLat = Math.min(...lats);
      const maxLat = Math.max(...lats);
      const minLng = Math.min(...lngs);
      const maxLng = Math.max(...lngs);

      const latDelta = maxLat - minLat;
      const lngDelta = maxLng - minLng;

      // Ensure minimum zoom level for very close points
      const minDelta = 0.001; // ~100m
      const padding = 0.0005;

      mapRef.current.animateToRegion(
        {
          latitude: (minLat + maxLat) / 2,
          longitude: (minLng + maxLng) / 2,
          latitudeDelta: Math.max(latDelta + padding * 2, minDelta),
          longitudeDelta: Math.max(lngDelta + padding * 2, minDelta),
        },
        1000,
      );
    }
  }, [tourRouteCoordinates]);

  // ─── Memoized callback for marker selection ────────────────────────────
  const handleSelectPoi = useCallback(
    (poi: PoiMarker) => {
      onSelectPoi?.(poi);
    },
    [onSelectPoi],
  );

  const isTourMode = !!tourRouteCoordinates && tourRouteCoordinates.length >= 2;

  return (
    <View style={styles.container}>
      <MapView
        ref={mapRef}
        style={[styles.grid, isTourMode && styles.gridTour]}
        initialRegion={initialRegion}
        showsUserLocation={true}
        followsUserLocation={true}
        showsMyLocationButton={true}
        mapType="standard"
      >
        {/* ── Tour walking route polyline ─────────────────────────────────── */}
        {tourRouteCoordinates && tourRouteCoordinates.length >= 2 && (
          <>
            {/* Shadow/border line for visibility */}
            <Polyline
              coordinates={tourRouteCoordinates}
              strokeColor="rgba(255,255,255,0.8)"
              strokeWidth={8}
            />
            {/* Main route line — solid, thick, bright */}
            <Polyline
              coordinates={tourRouteCoordinates}
              strokeColor="#4f46e5"
              strokeWidth={5}
            />
          </>
        )}

        {pois.map((poi) => (
          <PoiMarkerMemoized
            key={poi.id}
            poi={poi}
            isActive={poi.id === activePoiId}
            onSelect={handleSelectPoi}
            sequenceNumber={tourPoiOrder?.[poi.id]}
          />
        ))}
      </MapView>
      <Text style={styles.hint}>
        Live map • {pois.length} POIs •{" "}
        {hasPermission ? "GPS active" : "GPS off"}
      </Text>
    </View>
  );
};

export const SimulatedMap = memo(MainMapComponent);

const styles = StyleSheet.create({
  container: {
    borderRadius: 14,
    backgroundColor: "#f4f4ff",
    borderWidth: 1,
    borderColor: "#d8d8ff",
    overflow: "hidden",
  },
  grid: {
    height: 280,
    backgroundColor: "#eef0ff",
  },
  gridTour: {
    height: 280,
  },
  hint: {
    fontSize: 11,
    color: "#6b7280",
    paddingHorizontal: 10,
    paddingVertical: 8,
  },
});
