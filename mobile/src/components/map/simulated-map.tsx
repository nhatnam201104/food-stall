import React, { memo, useCallback, useEffect, useMemo, useRef } from 'react';
import { Image, StyleSheet, Text, View } from 'react-native';
import MapView, { Marker, type Region } from 'react-native-maps';
import type { PoiMarker } from '../../types/tourist.types';

interface Bounds {
  minLat: number;
  maxLat: number;
  minLng: number;
  maxLng: number;
}

interface SimulatedMapProps {
  pois: PoiMarker[];
  bounds: Bounds;
  onSelectPoi?: (poi: PoiMarker) => void;
}

const clamp = (value: number, min: number, max: number): number => Math.max(min, Math.min(value, max));

const SimulatedMapComponent = ({ pois, bounds, onSelectPoi }: SimulatedMapProps) => {
  const mapRef = useRef<MapView | null>(null);
  const latRange = Math.max(bounds.maxLat - bounds.minLat, 0.0001);
  const lngRange = Math.max(bounds.maxLng - bounds.minLng, 0.0001);
  const latitude = clamp((bounds.minLat + bounds.maxLat) / 2, -85, 85);
  const longitude = clamp((bounds.minLng + bounds.maxLng) / 2, -180, 180);
  const latitudeDelta = Math.max(latRange * 1.4, 0.01);
  const longitudeDelta = Math.max(lngRange * 1.4, 0.01);

  const initialRegion = useMemo<Region>(() => ({
    latitude,
    longitude,
    latitudeDelta,
    longitudeDelta,
  }), [latitude, longitude, latitudeDelta, longitudeDelta]);

  const focusVinhKhanhRegion = useCallback(() => {
    mapRef.current?.animateToRegion(initialRegion, 450);
  }, [initialRegion]);

  useEffect(() => {
    const timer = setTimeout(() => {
      focusVinhKhanhRegion();
    }, 250);

    return () => {
      clearTimeout(timer);
    };
  }, [focusVinhKhanhRegion]);

  return (
    <View style={styles.container}>
      <MapView
        ref={mapRef}
        style={styles.grid}
        initialRegion={initialRegion}
        onMapReady={focusVinhKhanhRegion}
        mapType="standard"
      >
        {pois.map((poi) => {
          return (
            <Marker
              key={poi.id}
              coordinate={{ latitude: poi.latitude, longitude: poi.longitude }}
              anchor={{ x: 0.5, y: 0.5 }}
              centerOffset={{ x: 0, y: 0 }}
              title={poi.name}
              description={poi.imageUrl ? 'POI có hình ảnh' : 'POI'}
              onPress={() => onSelectPoi?.(poi)}
            >
              <View style={styles.markerWrap} collapsable={false}>
                {poi.imageUrl ? (
                  <Image source={{ uri: poi.imageUrl }} style={styles.markerImage} />
                ) : (
                  <View style={styles.dotOuter}>
                    <View style={styles.dot} />
                  </View>
                )}
              </View>
            </Marker>
          );
        })}
      </MapView>
      <Text style={styles.hint}>Native map provider • Focus: Khu phố ẩm thực Vĩnh Khánh</Text>
    </View>
  );
};

export const SimulatedMap = memo(SimulatedMapComponent);

const styles = StyleSheet.create({
  container: {
    borderRadius: 14,
    backgroundColor: '#f4f4ff',
    borderWidth: 1,
    borderColor: '#d8d8ff',
    overflow: 'hidden',
  },
  grid: {
    height: 240,
    backgroundColor: '#eef0ff',
  },
  markerWrap: {
    alignItems: 'center',
    justifyContent: 'center',
    width: 40,
    height: 40,
    overflow: 'visible',
  },
  dotOuter: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: '#ffffff',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#d1d5db',
    elevation: 3,
  },
  dot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#6366f1',
  },
  markerImage: {
    width: 36,
    height: 36,
    borderRadius: 18,
    borderWidth: 2,
    borderColor: '#fff',
    backgroundColor: '#e5e7eb',
    elevation: 3,
  },
  hint: {
    fontSize: 11,
    color: '#6b7280',
    paddingHorizontal: 10,
    paddingVertical: 8,
  },
});
