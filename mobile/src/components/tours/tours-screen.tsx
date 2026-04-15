import { useCallback, useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Pressable,
  Text,
  TextInput,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Link } from "expo-router";
import { tourService } from "../../services/tour.service";
import type { TourListItem } from "../../types/tourist.types";
import { styles } from "./tours-screen.styles";

const LIMIT = 10;

const ToursScreen = () => {
  const [items, setItems] = useState<TourListItem[]>([]);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [loading, setLoading] = useState(false);
  // Separate state for the active search term — avoids stale closures in debounce
  const [activeSearch, setActiveSearch] = useState("");

  // Debounce timer ref
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const fetchTours = useCallback(
    async (targetPage: number, append = false) => {
      setLoading(true);
      try {
        const res = await tourService.list({
          search: activeSearch.trim() || undefined,
          page: targetPage,
          limit: LIMIT,
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
    [activeSearch],
  );

  // Initial load + re-run when activeSearch changes (via debounce)
  useEffect(() => {
    void fetchTours(1, false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fetchTours]);

  // Debounced search: auto-triggers 400ms after user stops typing
  const handleSearchChange = (text: string) => {
    setSearch(text);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      setActiveSearch(text);
      setPage(1);
      setHasMore(true);
    }, 400);
  };

  // Explicit Search button: fires immediately
  const handleSearchPress = () => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    setActiveSearch(search);
    setPage(1);
    setHasMore(true);
    void fetchTours(1, false);
  };

  // Load more: append next page
  const handleLoadMore = () => {
    if (!loading && hasMore) {
      void fetchTours(page + 1, true);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Search Tours</Text>
        <TextInput
          style={styles.input}
          value={search}
          onChangeText={handleSearchChange}
          placeholder="Search by tour name"
          autoCapitalize="none"
          returnKeyType="search"
          onSubmitEditing={handleSearchPress}
        />
        <Pressable
          style={styles.searchBtn}
          onPress={handleSearchPress}
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
          ListEmptyComponent={
            <Text style={styles.empty}>
              {activeSearch
                ? `No tours found for "${activeSearch}"`
                : "No tours found"}
            </Text>
          }
          renderItem={({ item }) => (
            <Link href={`/tour/${item.id}`} asChild>
              <Pressable style={styles.card}>
                <Text style={styles.cardTitle}>{item.name}</Text>
                {!!item.description && (
                  <Text numberOfLines={2} style={styles.cardDesc}>
                    {item.description}
                  </Text>
                )}
                <Text style={styles.cardMeta}>
                  POIs: {item._count.tourPois}
                  {" • "}
                  Duration: {item.estimatedDurationMinutes ?? "-"} min
                </Text>
              </Pressable>
            </Link>
          )}
          // Infinite scroll — triggers when user scrolls near the bottom
          onEndReached={handleLoadMore}
          onEndReachedThreshold={0.5}
          ListFooterComponent={
            hasMore && items.length > 0 ? (
              loading ? (
                <View style={styles.footerLoader}>
                  <ActivityIndicator size="small" color="#0ea5e9" />
                </View>
              ) : (
                <Pressable
                  style={styles.moreBtn}
                  onPress={handleLoadMore}
                  disabled={loading}
                >
                  <Text style={styles.moreBtnText}>Load More</Text>
                </Pressable>
              )
            ) : null
          }
        />
      )}
    </SafeAreaView>
  );
};

export default ToursScreen;
