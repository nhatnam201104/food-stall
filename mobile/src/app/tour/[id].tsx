import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Image,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { tourService } from "../../services/tour.service";
import { useTourStore } from "../../stores/tourStore";
import type { TourDetail } from "../../types/tourist.types";
import { getFullImageUrl } from "../../utils/image-url.util";

export default function TourDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const startTour = useTourStore((s) => s.startTour);

  const [tour, setTour] = useState<TourDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [starting, setStarting] = useState(false);

  useEffect(() => {
    if (!id) return;

    const load = async () => {
      setLoading(true);
      try {
        const res = await tourService.detail(id);
        setTour(res.data.data ?? null);
      } catch (err) {
        const msg =
          (err as { response?: { data?: { message?: string } } })?.response
            ?.data?.message ?? "Cannot load tour details";
        Alert.alert("Error", msg, [
          { text: "OK", onPress: () => router.back() },
        ]);
      } finally {
        setLoading(false);
      }
    };

    void load();
  }, [id, router]);

  const handleStartTour = () => {
    if (!tour) return;
    setStarting(true);
    try {
      startTour(tour);
      // Navigate to map tab — setStarting not reset intentionally (screen unmounts)
      router.replace("/(tabs)" as any);
    } catch {
      Alert.alert("Error", "Failed to start tour");
      setStarting(false);
    }
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.center}>
          <ActivityIndicator size="large" color="#4f46e5" />
          <Text style={styles.loadingText}>Loading tour...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (!tour) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.center}>
          <Text style={styles.errorText}>Tour not found</Text>
          <Pressable style={styles.backBtn} onPress={() => router.back()}>
            <Text style={styles.backBtnText}>Go Back</Text>
          </Pressable>
        </View>
      </SafeAreaView>
    );
  }

  const totalPois = tour.tourPois?.length ?? 0;

  return (
    <SafeAreaView style={styles.container} edges={["bottom"]}>
      <ScrollView contentContainerStyle={styles.scroll}>
        {/* Cover image */}
        {!!tour.coverImageUrl && (
          <Image
            source={{ uri: getFullImageUrl(tour.coverImageUrl) ?? undefined }}
            style={styles.coverImage}
            resizeMode="cover"
          />
        )}

        <View style={styles.content}>
          {/* Header */}
          <Text style={styles.tourName}>{tour.name}</Text>

          {/* Meta badges */}
          <View style={styles.badgeRow}>
            <View style={styles.badge}>
              <Text style={styles.badgeText}>📍 {totalPois} stops</Text>
            </View>
            {!!tour.estimatedDurationMinutes && (
              <View style={styles.badge}>
                <Text style={styles.badgeText}>
                  ⏱ {tour.estimatedDurationMinutes} min
                </Text>
              </View>
            )}
          </View>

          {/* Description */}
          {!!tour.description && (
            <Text style={styles.description}>{tour.description}</Text>
          )}

          {/* POI list */}
          <Text style={styles.sectionTitle}>Tour Stops</Text>
          {tour.tourPois && tour.tourPois.length > 0 ? (
            <View style={styles.poiList}>
              {tour.tourPois.map((tp, index) => (
                <View key={tp.id} style={styles.poiItem}>
                  <View style={styles.poiOrderBadge}>
                    <Text style={styles.poiOrderText}>{index + 1}</Text>
                  </View>
                  <View style={styles.poiInfo}>
                    <Text style={styles.poiName}>{tp.poi.name}</Text>
                    {!!tp.poi.description && (
                      <Text style={styles.poiDesc} numberOfLines={2}>
                        {tp.poi.description}
                      </Text>
                    )}
                    {tp.isMandatory && (
                      <View style={styles.mandatoryBadge}>
                        <Text style={styles.mandatoryText}>Required</Text>
                      </View>
                    )}
                  </View>
                </View>
              ))}
            </View>
          ) : (
            <Text style={styles.emptyPois}>No stops in this tour.</Text>
          )}
        </View>
      </ScrollView>

      {/* Start Tour Button — fixed at bottom */}
      <View style={styles.footer}>
        <Pressable
          style={[styles.startBtn, starting && styles.startBtnDisabled]}
          onPress={handleStartTour}
          disabled={starting || totalPois === 0}
        >
          {starting ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.startBtnText}>
              ▶ Start Tour ({totalPois} stops)
            </Text>
          )}
        </Pressable>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f8fafc" },
  center: { flex: 1, justifyContent: "center", alignItems: "center", gap: 12 },
  loadingText: { color: "#6b7280", marginTop: 8 },
  errorText: { color: "#dc2626", fontSize: 16 },
  backBtn: {
    backgroundColor: "#4f46e5",
    borderRadius: 10,
    paddingHorizontal: 20,
    paddingVertical: 10,
  },
  backBtnText: { color: "#fff", fontWeight: "700" },
  scroll: { flexGrow: 1 },
  coverImage: { width: "100%", height: 220, backgroundColor: "#e5e7eb" },
  content: { padding: 16, gap: 12 },
  tourName: { fontSize: 24, fontWeight: "800", color: "#111827" },
  badgeRow: { flexDirection: "row", gap: 8, flexWrap: "wrap" },
  badge: {
    backgroundColor: "#ede9fe",
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  badgeText: { fontSize: 13, fontWeight: "600", color: "#4f46e5" },
  description: { fontSize: 15, color: "#374151", lineHeight: 22 },
  sectionTitle: {
    fontSize: 17,
    fontWeight: "700",
    color: "#111827",
    marginTop: 4,
  },
  poiList: { gap: 8 },
  poiItem: {
    backgroundColor: "#fff",
    borderRadius: 10,
    padding: 12,
    borderWidth: 1,
    borderColor: "#e5e7eb",
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 10,
  },
  poiOrderBadge: {
    backgroundColor: "#4f46e5",
    borderRadius: 20,
    width: 28,
    height: 28,
    justifyContent: "center",
    alignItems: "center",
    flexShrink: 0,
  },
  poiOrderText: { color: "#fff", fontWeight: "700", fontSize: 13 },
  poiInfo: { flex: 1, gap: 2 },
  poiName: { fontSize: 15, fontWeight: "700", color: "#111827" },
  poiDesc: { fontSize: 13, color: "#6b7280" },
  mandatoryBadge: {
    backgroundColor: "#fef3c7",
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 2,
    alignSelf: "flex-start",
    marginTop: 2,
  },
  mandatoryText: { fontSize: 11, fontWeight: "600", color: "#92400e" },
  emptyPois: { color: "#6b7280", fontStyle: "italic" },
  footer: {
    padding: 14,
    backgroundColor: "#fff",
    borderTopWidth: 1,
    borderTopColor: "#e5e7eb",
  },
  startBtn: {
    backgroundColor: "#4f46e5",
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: "center",
  },
  startBtnDisabled: { opacity: 0.6 },
  startBtnText: { color: "#fff", fontWeight: "800", fontSize: 16 },
});
