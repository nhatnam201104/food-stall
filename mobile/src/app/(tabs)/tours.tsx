import { useCallback, useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { router } from "expo-router";
import { tourService } from "../../services/tour.service";
import { useTourStore } from "../../stores/tourStore";
import type { TourListItem } from "../../types/tourist.types";

const DEBOUNCE_MS = 500;

export default function ToursScreen() {
  const [items, setItems] = useState<TourListItem[]>([]);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [loading, setLoading] = useState(false);
  const [selectingTourId, setSelectingTourId] = useState<string | null>(null);
  const debounceTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const startTour = useTourStore((s) => s.startTour);

  const fetchTours = useCallback(
    async (targetPage: number, append = false, searchTerm?: string) => {
      setLoading(true);
      try {
        const term = searchTerm ?? search;
        const res = await tourService.list({
          search: term.trim() || undefined,
          page: targetPage,
          limit: 10,
        });
        const data = res.data.data || [];
        const pagination = res.data.pagination;

        setItems((prev) => (append ? [...prev, ...data] : data));
        setPage(targetPage);
        setHasMore(
          Boolean(pagination && pagination.page < pagination.totalPages),
        );
      } catch (err) {
        const msg =
          (err as { response?: { data?: { message?: string } } })?.response
            ?.data?.message || "Cannot load tours";
        Alert.alert("Tour error", msg);
      } finally {
        setLoading(false);
      }
    },
    [search],
  );

  // ── Debounced auto-search: fires after user stops typing ──────────────
  const handleSearchChange = useCallback(
    (text: string) => {
      setSearch(text);

      if (debounceTimer.current) {
        clearTimeout(debounceTimer.current);
      }

      debounceTimer.current = setTimeout(() => {
        void fetchTours(1, false, text);
      }, DEBOUNCE_MS);
    },
    [fetchTours],
  );

  // ── Clear search and reload all tours ─────────────────────────────────
  const handleClearSearch = useCallback(() => {
    setSearch("");
    if (debounceTimer.current) {
      clearTimeout(debounceTimer.current);
    }
    void fetchTours(1, false, "");
  }, [fetchTours]);

  // ── Cleanup debounce timer on unmount ─────────────────────────────────
  useEffect(() => {
    return () => {
      if (debounceTimer.current) {
        clearTimeout(debounceTimer.current);
      }
    };
  }, []);

  // ── Handle tour selection: fetch detail → start tour → navigate to map ─
  const handleSelectTour = useCallback(
    async (tourItem: TourListItem) => {
      if (selectingTourId) return; // prevent double-tap
      setSelectingTourId(tourItem.id);

      try {
        const res = await tourService.detail(tourItem.id);
        const tourDetail = res.data.data;

        if (!tourDetail) {
          Alert.alert("Error", "Tour details not available.");
          return;
        }

        if (!tourDetail.tourPois || tourDetail.tourPois.length === 0) {
          Alert.alert(
            "No Stops",
            "This tour has no stops yet. Please try another tour.",
          );
          return;
        }

        startTour(tourDetail);
        router.navigate("/");
      } catch (err) {
        const msg =
          (err as { response?: { data?: { message?: string } } })?.response
            ?.data?.message || "Cannot load tour details";
        Alert.alert("Tour Error", msg);
      } finally {
        setSelectingTourId(null);
      }
    },
    [selectingTourId, startTour],
  );

  // ── Initial load ──────────────────────────────────────────────────────
  useEffect(() => {
    void fetchTours(1, false);
  }, []);

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Search Tours</Text>
        <View style={styles.searchRow}>
          <TextInput
            style={styles.input}
            value={search}
            onChangeText={handleSearchChange}
            placeholder="Search by tour name..."
            autoCapitalize="none"
            returnKeyType="search"
            onSubmitEditing={() => {
              if (debounceTimer.current) clearTimeout(debounceTimer.current);
              void fetchTours(1, false);
            }}
          />
          {search.length > 0 && (
            <Pressable style={styles.clearBtn} onPress={handleClearSearch}>
              <Text style={styles.clearBtnText}>✕</Text>
            </Pressable>
          )}
        </View>
        <Pressable
          style={styles.searchBtn}
          onPress={() => void fetchTours(1, false)}
          disabled={loading}
        >
          <Text style={styles.searchBtnText}>
            {loading ? "Loading..." : "Search"}
          </Text>
        </Pressable>
      </View>

      {loading && items.length === 0 ? (
        <ActivityIndicator style={{ marginTop: 20 }} />
      ) : (
        <FlatList
          data={items}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.list}
          ListEmptyComponent={<Text style={styles.empty}>No tours found</Text>}
          renderItem={({ item }) => {
            const isSelecting = selectingTourId === item.id;
            return (
              <Pressable
                style={[styles.card, isSelecting && styles.cardSelecting]}
                onPress={() => void handleSelectTour(item)}
                disabled={isSelecting || !!selectingTourId}
              >
                <Text style={styles.cardTitle}>{item.name}</Text>
                {!!item.description && (
                  <Text numberOfLines={2} style={styles.cardDesc}>
                    {item.description}
                  </Text>
                )}
                <View style={styles.cardFooter}>
                  <Text style={styles.cardMeta}>
                    POIs: {item._count.tourPois} • Duration:{" "}
                    {item.estimatedDurationMinutes ?? "-"} min
                  </Text>
                  <Text style={styles.cardAction}>
                    {isSelecting ? "Loading..." : "Start Tour →"}
                  </Text>
                </View>
              </Pressable>
            );
          }}
          ListFooterComponent={
            hasMore ? (
              <Pressable
                style={styles.moreBtn}
                onPress={() => void fetchTours(page + 1, true)}
                disabled={loading}
              >
                <Text style={styles.moreBtnText}>
                  {loading ? "Loading..." : "Load More"}
                </Text>
              </Pressable>
            ) : null
          }
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f8fafc" },
  header: { padding: 14, gap: 8 },
  title: { fontSize: 22, fontWeight: "700", color: "#111827" },
  searchRow: {
    flexDirection: "row",
    alignItems: "center",
    position: "relative",
  },
  input: {
    flex: 1,
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: "#d1d5db",
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingRight: 36,
    height: 42,
  },
  clearBtn: {
    position: "absolute",
    right: 8,
    height: 42,
    width: 28,
    alignItems: "center",
    justifyContent: "center",
  },
  clearBtnText: {
    fontSize: 14,
    color: "#9ca3af",
    fontWeight: "600",
  },
  searchBtn: {
    backgroundColor: "#4f46e5",
    borderRadius: 10,
    alignItems: "center",
    paddingVertical: 10,
  },
  searchBtnText: { color: "#fff", fontWeight: "700" },
  list: { padding: 14, paddingTop: 0 },
  card: {
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: "#e5e7eb",
    borderRadius: 10,
    padding: 10,
    marginBottom: 10,
  },
  cardSelecting: {
    opacity: 0.6,
    borderColor: "#4f46e5",
  },
  cardTitle: { fontSize: 16, fontWeight: "700", color: "#111827" },
  cardDesc: { fontSize: 13, color: "#374151", marginTop: 4 },
  cardFooter: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 6,
  },
  cardMeta: { fontSize: 12, color: "#6b7280" },
  cardAction: {
    fontSize: 12,
    fontWeight: "700",
    color: "#4f46e5",
  },
  empty: { color: "#6b7280", textAlign: "center", marginTop: 18 },
  moreBtn: {
    marginTop: 6,
    marginBottom: 20,
    backgroundColor: "#0ea5e9",
    paddingVertical: 10,
    borderRadius: 10,
    alignItems: "center",
  },
  moreBtnText: { color: "#fff", fontWeight: "700" },
});
