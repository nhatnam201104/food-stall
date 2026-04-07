import { memo, useCallback, useEffect } from "react";
import { Alert, Pressable, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useTourStore } from "../../stores/tourStore";
import { useLocationStore } from "../../stores/locationStore";

/** Haversine distance in meters between two lat/lng points */
function getDistanceMeters(
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

function formatDistance(meters: number): string {
  if (meters < 1000) return `${meters.toFixed(0)}m`;
  return `${(meters / 1000).toFixed(1)}km`;
}

/**
 * TourOverlay — Shows tour instructions on top of the map.
 *
 * Displays:
 * - Tour name and progress (Step X of Y)
 * - Current/next POI name and distance
 * - Navigation controls (Skip, Navigate, End Tour)
 * - Warning messages for errors
 */
const TourOverlayComponent = () => {
  const insets = useSafeAreaInsets();
  const activeTour = useTourStore((s) => s.activeTour);
  const currentStepIndex = useTourStore((s) => s.currentStepIndex);
  const tourStatus = useTourStore((s) => s.tourStatus);
  const error = useTourStore((s) => s.error);
  const nextStep = useTourStore((s) => s.nextStep);
  const prevStep = useTourStore((s) => s.prevStep);
  const endTour = useTourStore((s) => s.endTour);
  const pauseTour = useTourStore((s) => s.pauseTour);
  const resumeTour = useTourStore((s) => s.resumeTour);
  const setError = useTourStore((s) => s.setError);

  const userLocation = useLocationStore((s) => s.userLocation);
  const checkTourProximity = useTourStore((s) => s.checkTourProximity);

  // ── Auto-trigger audio when user reaches current tour stop ────────────
  useEffect(() => {
    if (tourStatus === "active" && userLocation) {
      checkTourProximity();
    }
  }, [tourStatus, userLocation, checkTourProximity]);

  const handleEndTour = useCallback(() => {
    Alert.alert(
      "End Tour?",
      "Are you sure you want to stop following this tour?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "End Tour",
          style: "destructive",
          onPress: () => endTour(),
        },
      ],
    );
  }, [endTour]);

  const handleSkip = useCallback(() => {
    if (!activeTour) return;

    const currentPoi = activeTour.tourPois[currentStepIndex];
    Alert.alert(
      "Skip Stop?",
      `Skip "${currentPoi.poi.name}" and go to the next stop?`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Skip",
          style: "default",
          onPress: () => nextStep(),
        },
      ],
    );
  }, [activeTour, currentStepIndex, nextStep]);

  // ── Don't render if no tour is active ──────────────────────────────────
  if (!activeTour || tourStatus === "idle") return null;

  const totalSteps = activeTour.tourPois.length;
  const currentPoi = activeTour.tourPois[currentStepIndex];
  const isCompleted = tourStatus === "completed";

  // ── Distance to current POI ────────────────────────────────────────────
  const distanceText =
    userLocation && currentPoi
      ? formatDistance(
          getDistanceMeters(
            userLocation.latitude,
            userLocation.longitude,
            Number(currentPoi.poi.latitude),
            Number(currentPoi.poi.longitude),
          ),
        )
      : "calculating...";

  // ── Distance warning (>1km from next stop) ─────────────────────────────
  const isFarAway =
    userLocation &&
    currentPoi &&
    getDistanceMeters(
      userLocation.latitude,
      userLocation.longitude,
      Number(currentPoi.poi.latitude),
      Number(currentPoi.poi.longitude),
    ) > 1000;

  // ── Completed state ────────────────────────────────────────────────────
  if (isCompleted) {
    return (
      <View style={styles.container}>
        <View style={[styles.card, styles.completedCard]}>
          <Text style={styles.completedEmoji}>🎉</Text>
          <Text style={styles.tourName}>Tour Completed!</Text>
          <Text style={styles.progressText}>
            You've visited all {totalSteps} stops of "{activeTour.name}"
          </Text>
          <Pressable style={styles.endBtn} onPress={endTour}>
            <Text style={styles.endBtnText}>Back to Map</Text>
          </Pressable>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* ── Error banner ──────────────────────────────────────────────── */}
      {error && (
        <View style={styles.errorBanner}>
          <Text style={styles.errorText}>⚠️ {error}</Text>
          <Pressable onPress={() => setError(null)} hitSlop={8}>
            <Text style={styles.errorDismiss}>✕</Text>
          </Pressable>
        </View>
      )}

      {/* ── Tour instruction card ─────────────────────────────────────── */}
      <View style={styles.card}>
        {/* Header: Tour name + progress */}
        <View style={styles.cardHeader}>
          <Text style={styles.tourName} numberOfLines={1}>
            🗺️ {activeTour.name}
          </Text>
          <Text style={styles.progressBadge}>
            {currentStepIndex + 1}/{totalSteps}
          </Text>
        </View>

        {/* Progress bar */}
        <View style={styles.progressBarBg}>
          <View
            style={[
              styles.progressBarFill,
              { width: `${((currentStepIndex + 1) / totalSteps) * 100}%` },
            ]}
          />
        </View>

        {/* Current stop info */}
        {currentPoi && (
          <View style={styles.stopInfo}>
            <Text style={styles.stopLabel}>
              {currentStepIndex === 0
                ? "🚶 Head to first stop"
                : "🚶 Head to next stop"}
            </Text>
            <Text style={styles.stopName} numberOfLines={1}>
              {currentPoi.poi.name}
            </Text>
            <Text style={styles.stopDistance}>📍 {distanceText} away</Text>
          </View>
        )}

        {/* Distance warning */}
        {isFarAway && (
          <View style={styles.warningRow}>
            <Text style={styles.warningText}>
              ⚠️ You're far from this stop. Head towards it to hear the audio
              guide.
            </Text>
          </View>
        )}

        {/* Controls */}
        <View style={styles.controlsRow}>
          {currentStepIndex > 0 && (
            <Pressable style={styles.prevBtn} onPress={prevStep}>
              <Text style={styles.prevBtnText}>← Back</Text>
            </Pressable>
          )}

          <Pressable style={styles.skipBtn} onPress={handleSkip}>
            <Text style={styles.skipBtnText}>Skip</Text>
          </Pressable>

          {tourStatus === "active" ? (
            <Pressable style={styles.pauseBtn} onPress={pauseTour}>
              <Text style={styles.pauseBtnText}>⏸ Pause</Text>
            </Pressable>
          ) : (
            <Pressable style={styles.resumeBtn} onPress={resumeTour}>
              <Text style={styles.resumeBtnText}>▶ Resume</Text>
            </Pressable>
          )}

          <Pressable style={styles.endBtnSmall} onPress={handleEndTour}>
            <Text style={styles.endBtnSmallText}>✕ End</Text>
          </Pressable>
        </View>
      </View>
    </View>
  );
};

export const TourOverlay = memo(TourOverlayComponent);

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 0,
  },
  errorBanner: {
    backgroundColor: "#fef2f2",
    borderWidth: 1,
    borderColor: "#fca5a5",
    borderRadius: 10,
    padding: 10,
    marginBottom: 6,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  errorText: {
    flex: 1,
    fontSize: 13,
    color: "#dc2626",
    fontWeight: "500",
  },
  errorDismiss: {
    fontSize: 16,
    color: "#dc2626",
    fontWeight: "700",
    paddingHorizontal: 4,
  },
  card: {
    backgroundColor: "#ffffff",
    borderRadius: 14,
    padding: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.12,
    shadowRadius: 6,
    elevation: 6,
    borderWidth: 1,
    borderColor: "#e5e7eb",
  },
  completedCard: {
    alignItems: "center",
    gap: 6,
  },
  completedEmoji: {
    fontSize: 36,
  },
  progressText: {
    fontSize: 13,
    color: "#6b7280",
    textAlign: "center",
  },
  cardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 6,
  },
  tourName: {
    fontSize: 15,
    fontWeight: "700",
    color: "#111827",
    flex: 1,
    marginRight: 8,
  },
  progressBadge: {
    fontSize: 12,
    fontWeight: "700",
    color: "#4f46e5",
    backgroundColor: "#ede9fe",
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  progressBarBg: {
    height: 4,
    backgroundColor: "#e5e7eb",
    borderRadius: 2,
    marginBottom: 10,
    overflow: "hidden",
  },
  progressBarFill: {
    height: "100%",
    backgroundColor: "#4f46e5",
    borderRadius: 2,
  },
  stopInfo: {
    marginBottom: 8,
  },
  stopLabel: {
    fontSize: 11,
    fontWeight: "600",
    color: "#6b7280",
    textTransform: "uppercase",
    marginBottom: 2,
  },
  stopName: {
    fontSize: 16,
    fontWeight: "700",
    color: "#111827",
  },
  stopDistance: {
    fontSize: 12,
    color: "#6b7280",
    marginTop: 2,
  },
  warningRow: {
    backgroundColor: "#fffbeb",
    borderWidth: 1,
    borderColor: "#fcd34d",
    borderRadius: 8,
    padding: 8,
    marginBottom: 8,
  },
  warningText: {
    fontSize: 12,
    color: "#92400e",
    fontWeight: "500",
  },
  controlsRow: {
    flexDirection: "row",
    gap: 6,
    alignItems: "center",
  },
  prevBtn: {
    backgroundColor: "#f3f4f6",
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 7,
  },
  prevBtnText: {
    fontSize: 12,
    fontWeight: "600",
    color: "#374151",
  },
  skipBtn: {
    backgroundColor: "#fef3c7",
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 7,
  },
  skipBtnText: {
    fontSize: 12,
    fontWeight: "600",
    color: "#92400e",
  },
  pauseBtn: {
    backgroundColor: "#dbeafe",
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 7,
    flex: 1,
    alignItems: "center",
  },
  pauseBtnText: {
    fontSize: 12,
    fontWeight: "600",
    color: "#1e40af",
  },
  resumeBtn: {
    backgroundColor: "#d1fae5",
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 7,
    flex: 1,
    alignItems: "center",
  },
  resumeBtnText: {
    fontSize: 12,
    fontWeight: "600",
    color: "#065f46",
  },
  endBtnSmall: {
    backgroundColor: "#fef2f2",
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 7,
  },
  endBtnSmallText: {
    fontSize: 12,
    fontWeight: "600",
    color: "#dc2626",
  },
  endBtn: {
    backgroundColor: "#4f46e5",
    borderRadius: 10,
    paddingHorizontal: 20,
    paddingVertical: 10,
    marginTop: 4,
  },
  endBtnText: {
    color: "#fff",
    fontWeight: "700",
    fontSize: 14,
  },
});
