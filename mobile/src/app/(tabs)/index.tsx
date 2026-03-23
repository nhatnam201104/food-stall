import { useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Image,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { poiService } from '../../services/poi.service';
import { sessionService } from '../../services/session.service';
import { SimulatedMap } from '../../components/map/simulated-map';
import type { PoiDetail, PoiMarker } from '../../types/tourist.types';

const DEFAULT_BOUNDS = {
  minLat: 10.752,
  maxLat: 10.765,
  minLng: 106.698,
  maxLng: 106.7085,
};

const formatCoord = (value: unknown) => {
  if (typeof value === 'number' && Number.isFinite(value)) {
    return value.toFixed(6);
  }

  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed.toFixed(6) : 'N/A';
};

export default function HomeScreen() {
  const [pois, setPois] = useState<PoiMarker[]>([]);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [selectedPoi, setSelectedPoi] = useState<PoiDetail | null>(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [isDetailLoading, setIsDetailLoading] = useState(false);

  const loadPois = async (targetPage: number, append = false) => {
    setLoading(true);
    try {
      const res = await poiService.inView({
        ...DEFAULT_BOUNDS,
        page: targetPage,
        limit: 30,
      });

      const incoming = res.data.data || [];
      const pagination = res.data.pagination;

      setPois((prev) => (append ? [...prev, ...incoming] : incoming));
      setPage(targetPage);
      setHasMore(Boolean(pagination && pagination.page < pagination.totalPages));
    } catch (err) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message || 'Cannot load POIs';
      Alert.alert('POI error', msg);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadPois(1, false);
  }, []);

  const summary = useMemo(() => `Loaded ${pois.length} POIs around Vĩnh Khánh food street`, [pois.length]);

  const startSession = async () => {
    try {
      const res = await sessionService.start({ offlineMode: false, appVersion: 'mobile-mvp' });
      const id = res.data.data?.id;
      if (!id) return;
      setSessionId(id);
      Alert.alert('Session started', id);
    } catch (err) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message || 'Cannot start session';
      Alert.alert('Session error', msg);
    }
  };

  const endSession = async () => {
    if (!sessionId) return;
    try {
      await sessionService.end(sessionId);
      setSessionId(null);
      Alert.alert('Session ended');
    } catch (err) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message || 'Cannot end session';
      Alert.alert('Session error', msg);
    }
  };

  const openPoiDetail = async (poi: PoiMarker) => {
    setIsDetailOpen(true);
    setIsDetailLoading(true);

    try {
      const res = await poiService.detail(poi.id);
      setSelectedPoi(res.data.data || null);
    } catch (err) {
      setSelectedPoi(null);
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message || 'Cannot load POI detail';
      Alert.alert('POI detail error', msg);
    } finally {
      setIsDetailLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        <Text style={styles.title}>Map Discovery</Text>
        <Text style={styles.subtitle}>{summary}</Text>

        <SimulatedMap pois={pois} bounds={DEFAULT_BOUNDS} onSelectPoi={(poi) => void openPoiDetail(poi)} />

        <View style={styles.actionsRow}>
          <Pressable style={[styles.button, styles.primary]} onPress={() => void loadPois(1, false)} disabled={loading}>
            <Text style={styles.buttonText}>{loading ? 'Loading...' : 'Refresh View'}</Text>
          </Pressable>
          <Pressable
            style={[styles.button, styles.secondary, !hasMore && styles.disabled]}
            onPress={() => void loadPois(page + 1, true)}
            disabled={loading || !hasMore}
          >
            <Text style={styles.buttonText}>Load More</Text>
          </Pressable>
        </View>

        <View style={styles.actionsRow}>
          {!sessionId ? (
            <Pressable style={[styles.button, styles.primary]} onPress={() => void startSession()}>
              <Text style={styles.buttonText}>Start Session</Text>
            </Pressable>
          ) : (
            <Pressable style={[styles.button, styles.danger]} onPress={() => void endSession()}>
              <Text style={styles.buttonText}>End Session</Text>
            </Pressable>
          )}
        </View>

        <FlatList
          data={pois}
          keyExtractor={(item) => item.id}
          style={styles.list}
          renderItem={({ item }) => (
            <View style={styles.poiCard}>
              <Text style={styles.poiName}>{item.name}</Text>
              <Text style={styles.poiMeta}>Lat {formatCoord(item.latitude)} • Lng {formatCoord(item.longitude)}</Text>
            </View>
          )}
        />
      </View>

      <Modal visible={isDetailOpen} transparent animationType="slide" onRequestClose={() => setIsDetailOpen(false)}>
        <View style={styles.modalBackdrop}>
          <View style={styles.modalCard}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>POI Detail</Text>
              <Pressable onPress={() => setIsDetailOpen(false)}>
                <Text style={styles.modalClose}>Close</Text>
              </Pressable>
            </View>

            {isDetailLoading ? (
              <View style={styles.loadingWrap}>
                <ActivityIndicator size="small" color="#4f46e5" />
                <Text style={styles.loadingText}>Loading detail...</Text>
              </View>
            ) : selectedPoi ? (
              <ScrollView contentContainerStyle={styles.detailBody}>
                {!!selectedPoi.imageUrl && (
                  <Image source={{ uri: selectedPoi.imageUrl }} style={styles.coverImage} />
                )}
                <Text style={styles.detailName}>{selectedPoi.name}</Text>
                {!!selectedPoi.description && <Text style={styles.detailDescription}>{selectedPoi.description}</Text>}

                <View style={styles.detailSection}>
                  <Text style={styles.detailSectionTitle}>Coordinates</Text>
                  <Text style={styles.detailMeta}>Lat {formatCoord(selectedPoi.latitude)}</Text>
                  <Text style={styles.detailMeta}>Lng {formatCoord(selectedPoi.longitude)}</Text>
                  <Text style={styles.detailMeta}>Radius {selectedPoi.radiusMeters}m</Text>
                </View>

                {!!selectedPoi.merchant && (
                  <View style={styles.detailSection}>
                    <Text style={styles.detailSectionTitle}>Merchant</Text>
                    <Text style={styles.detailMeta}>{selectedPoi.merchant.shopName}</Text>
                    {!!selectedPoi.merchant.address && <Text style={styles.detailMeta}>{selectedPoi.merchant.address}</Text>}
                  </View>
                )}
              </ScrollView>
            ) : (
              <Text style={styles.emptyDetail}>No POI detail available.</Text>
            )}
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8fafc' },
  content: { flex: 1, padding: 14, gap: 10 },
  title: { fontSize: 22, fontWeight: '700', color: '#111827' },
  subtitle: { fontSize: 13, color: '#6b7280', marginBottom: 4 },
  actionsRow: { flexDirection: 'row', gap: 10 },
  button: {
    flex: 1,
    borderRadius: 10,
    paddingVertical: 10,
    alignItems: 'center',
  },
  primary: { backgroundColor: '#4f46e5' },
  secondary: { backgroundColor: '#0ea5e9' },
  danger: { backgroundColor: '#ef4444' },
  disabled: { opacity: 0.45 },
  buttonText: { color: '#fff', fontWeight: '700' },
  list: { marginTop: 6 },
  poiCard: {
    backgroundColor: '#fff',
    borderRadius: 10,
    padding: 10,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  poiName: { fontWeight: '700', color: '#111827' },
  poiMeta: { fontSize: 12, color: '#6b7280', marginTop: 4 },
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(15,23,42,0.45)',
    justifyContent: 'flex-end',
  },
  modalCard: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 18,
    borderTopRightRadius: 18,
    maxHeight: '70%',
    paddingBottom: 14,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  modalTitle: { fontSize: 16, fontWeight: '700', color: '#111827' },
  modalClose: { fontSize: 14, fontWeight: '700', color: '#4f46e5' },
  loadingWrap: { alignItems: 'center', gap: 8, paddingVertical: 20 },
  loadingText: { color: '#6b7280', fontSize: 13 },
  detailBody: { padding: 14, gap: 10 },
  coverImage: {
    width: '100%',
    height: 170,
    borderRadius: 12,
    backgroundColor: '#e5e7eb',
  },
  detailName: { fontSize: 18, fontWeight: '700', color: '#111827' },
  detailDescription: { fontSize: 14, lineHeight: 20, color: '#374151' },
  detailSection: {
    backgroundColor: '#f8fafc',
    borderWidth: 1,
    borderColor: '#e5e7eb',
    borderRadius: 10,
    padding: 10,
    gap: 4,
  },
  detailSectionTitle: { fontSize: 13, fontWeight: '700', color: '#111827' },
  detailMeta: { fontSize: 13, color: '#4b5563' },
  emptyDetail: { padding: 14, color: '#6b7280' },
});