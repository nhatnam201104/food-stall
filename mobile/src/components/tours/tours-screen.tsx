import { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, FlatList, Pressable, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { tourService } from '../../services/tour.service';
import type { TourListItem } from '../../types/tourist.types';
import { styles } from './tours-screen.styles';

const ToursScreen = () => {
  const [items, setItems] = useState<TourListItem[]>([]);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [loading, setLoading] = useState(false);

  const fetchTours = async (targetPage: number, append = false) => {
    setLoading(true);
    try {
      const res = await tourService.list({ search: search.trim() || undefined, page: targetPage, limit: 10 });
      const data = res.data.data || [];
      const pagination = res.data.pagination;

      setItems((prev) => (append ? [...prev, ...data] : data));
      setPage(targetPage);
      setHasMore(Boolean(pagination && pagination.page < pagination.totalPages));
    } catch (err) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message || 'Cannot load tours';
      Alert.alert('Tour error', msg);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void fetchTours(1, false);
  }, []);

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Search Tours</Text>
        <TextInput
          style={styles.input}
          value={search}
          onChangeText={setSearch}
          placeholder="Search by tour name"
          autoCapitalize="none"
        />
        <Pressable style={styles.searchBtn} onPress={() => void fetchTours(1, false)} disabled={loading}>
          <Text style={styles.searchBtnText}>{loading ? 'Loading...' : 'Search'}</Text>
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
          renderItem={({ item }) => (
            <View style={styles.card}>
              <Text style={styles.cardTitle}>{item.name}</Text>
              {!!item.description && <Text numberOfLines={2} style={styles.cardDesc}>{item.description}</Text>}
              <Text style={styles.cardMeta}>POIs: {item._count.tourPois} • Duration: {item.estimatedDurationMinutes ?? '-'} min</Text>
            </View>
          )}
          ListFooterComponent={
            hasMore ? (
              <Pressable style={styles.moreBtn} onPress={() => void fetchTours(page + 1, true)} disabled={loading}>
                <Text style={styles.moreBtnText}>{loading ? 'Loading...' : 'Load More'}</Text>
              </Pressable>
            ) : null
          }
        />
      )}
    </SafeAreaView>
  );
};

export default ToursScreen;
