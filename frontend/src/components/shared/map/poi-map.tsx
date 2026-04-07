import L from "leaflet";
import { useMemo } from "react";
import {
  MapContainer,
  Marker,
  Polyline,
  Popup,
  TileLayer,
  useMapEvents,
} from "react-leaflet";
import { DEFAULT_MAP_VIEW } from "../../../constants";
import type { PointOfInterest } from "../../../types";
import markerRetina from "leaflet/dist/images/marker-icon-2x.png";
import markerIcon from "leaflet/dist/images/marker-icon.png";
import markerShadow from "leaflet/dist/images/marker-shadow.png";

const defaultMarkerIcon = L.icon({
  iconRetinaUrl: markerRetina,
  iconUrl: markerIcon,
  shadowUrl: markerShadow,
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
});

interface PoiMapProps {
  pois?: PointOfInterest[];
  markers?: Array<{
    id: string;
    name: string;
    latitude: number;
    longitude: number;
    approvalStatus?: string;
    isActive?: boolean;
    sequenceOrder?: number;
  }>;
  routePath?: Array<[number, number]>;
  height?: number;
  selectedPosition?: { latitude: number; longitude: number } | null;
  onPickPosition?: (latitude: number, longitude: number) => void;
  onMarkerClick?: (poi: PointOfInterest) => void;
}

const PickPositionLayer = ({
  onPickPosition,
}: {
  onPickPosition?: (latitude: number, longitude: number) => void;
}) => {
  useMapEvents({
    click(event) {
      if (!onPickPosition) return;
      const { lat, lng } = event.latlng;
      onPickPosition(lat, lng);
    },
  });

  return null;
};

const PoiMap = ({
  pois = [],
  markers,
  routePath,
  height = 500,
  selectedPosition,
  onPickPosition,
  onMarkerClick,
}: PoiMapProps) => {
  const effectiveMarkers = useMemo(
    () =>
      markers ||
      pois.map((poi, index) => ({
        id: poi.id,
        name: poi.name,
        latitude: Number(poi.latitude),
        longitude: Number(poi.longitude),
        approvalStatus: poi.approvalStatus,
        isActive: poi.isActive,
        sequenceOrder: index + 1,
      })),
    [markers, pois],
  );

  return (
    <div
      style={{
        width: "100%",
        height,
        borderRadius: 12,
        overflow: "hidden",
        border: "1px solid #e8e8e8",
      }}
    >
      <MapContainer
        center={DEFAULT_MAP_VIEW.center}
        zoom={DEFAULT_MAP_VIEW.zoom}
        style={{ width: "100%", height: "100%" }}
      >
        <TileLayer
          attribution="&copy; OpenStreetMap contributors"
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <PickPositionLayer onPickPosition={onPickPosition} />

        {selectedPosition && (
          <Marker
            icon={defaultMarkerIcon}
            position={[selectedPosition.latitude, selectedPosition.longitude]}
          >
            <Popup>Selected POI Position</Popup>
          </Marker>
        )}

        {routePath && routePath.length >= 2 && (
          <Polyline
            positions={routePath}
            pathOptions={{ color: "#1677ff", weight: 4, opacity: 0.9 }}
          />
        )}

        {effectiveMarkers.map((marker) => (
          <Marker
            key={marker.id}
            icon={defaultMarkerIcon}
            position={[marker.latitude, marker.longitude]}
            eventHandlers={{
              click: () => {
                const poi = pois.find((item) => item.id === marker.id);
                if (poi) onMarkerClick?.(poi);
              },
            }}
          >
            <Popup>
              <strong>{marker.name}</strong>
              {marker.sequenceOrder ? (
                <div style={{ marginTop: 6 }}>
                  Order: #{marker.sequenceOrder}
                </div>
              ) : null}
              {marker.approvalStatus ? (
                <div style={{ marginTop: 6 }}>
                  Status: {marker.approvalStatus}
                </div>
              ) : null}
              {typeof marker.isActive === "boolean" ? (
                <div>Active: {marker.isActive ? "Yes" : "No"}</div>
              ) : null}
            </Popup>
          </Marker>
        ))}
      </MapContainer>
    </div>
  );
};

export default PoiMap;
