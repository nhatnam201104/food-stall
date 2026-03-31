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
import { AudioBottomSheet } from '../../components/audio/AudioBottomSheet';
import { AudioQueue } from '../../components/audio/AudioQueue';
import { SimulatedMap } from '../../components/map/simulated-map';
import { PoiResultModal } from '../../components/qr/PoiResultModal';
import { QRScannerModal } from '../../components/qr/QRScannerModal';
import { poiService } from '../../services/poi.service';
import { sessionService } from '../../services/session.service';
import { useAudioStore } from '../../stores/audioStore';
import type { PoiDetail, PoiMarker } from '../../types/tourist.types';
import { getFullImageUrl } from '../../utils/image-url.util';

const DEFAULT_BOUNDS = {
  minLat: 10.752,
  maxLat: 10.765,
  minLng: 106.698,
  maxLng: 106.7085,
};

const formatCoord = (value: unknown) => {
  if (typeof value === 'number' && Number.isFinite(value)) return value.toFixed(6);
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed.toFixed(6) : 'N/A';
};

export default function HomeScreen() {
  const [pois, setPois] = useState<PoiMarker[]>([]);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [sessionId, setSessionId] = useState<string | null>(null);

  // ── POI detail modal state ─────────────────────────────────────────────
  const [detailPoi, setDetailPoi] = useState<PoiDetail | null>(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [isDetailLoading, setIsDetailLoading] = useState(false);

  // ── QR modal state ─────────────────────────────────────────────────────
  const [isQrOpen, setIsQrOpen] = useState(false);
  const [qrPoi, setQrPoi] = useState<PoiDetail | null>(null);
  const [isQrLoading, setIsQrLoading] = useState(false);

  // ── Audio store ─────────────────────────────────────────────────────────
  const { triggerPoi, queue, status, activePoi, stop, errorMessage, clearError } =
    useAudioStore();

  // ── Cooldown for QR POI (live countdown) ───────────────────────────────
  const qrCooldownMs = useMemo(() => {
    if (!qrPoi || activePoi?.id !== qrPoi.id) return null;
    return null; // Will be computed live via state
  }, [qrPoi, activePoi]);

  // ── Auto-dismiss error toast ────────────────────────────────────────────
  useEffect(() => {
    if (errorMessage) {
      Alert.alert('Audio Error', errorMessage, [{ text: 'OK', onPress: clearError }]);
    }
  }, [errorMessage, clearError]);

  // ── Load POIs ──────────────────────────────────────────────────────────
  const loadPois = async (targetPage: number, append = false) => {
    setLoading(true);
    try {
      const res = await poiService.inView({ ...DEFAULT_BOUNDS, page: targetPage, limit: 30 });
      const incoming = res.data.data || [];
      const pagination = res.data.pagination;
      console.log(incoming);
      setPois((prev) => (append ? [...prev, ...incoming] : incoming));
      setPage(targetPage);
      setHasMore(Boolean(pagination && pagination.page < pagination.totalPages));
    } catch (err) {
      const msg =
        (err as { response?: { data?: { message?: string } } })?.response?.data?.message ??
        'Cannot load POIs';
      Alert.alert('POI error', msg);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadPois(1, false);
  }, []);

  const summary = useMemo(
    () => `Loaded ${pois.length} POIs around Vĩnh Khánh food street`,
    [pois.length],
  );

  // ── Session ──────────────────────────────────────────────────────────────
  const startSession = async () => {
    try {
      const res = await sessionService.start({ offlineMode: false, appVersion: 'mobile-mvp' });
      const id = res.data.data?.id;
      if (!id) return;
      setSessionId(id);
      Alert.alert('Phiên bắt đầu', id);
    } catch (err) {
      const msg =
        (err as { response?: { data?: { message?: string } } })?.response?.data?.message ??
        'Cannot start session';
      Alert.alert('Session error', msg);
    }
  };

  const endSession = async () => {
    if (!sessionId) return;
    try {
      await sessionService.end(sessionId);
      setSessionId(null);
      stop();
      Alert.alert('Phiên kết thúc');
    } catch (err) {
      const msg =
        (err as { response?: { data?: { message?: string } } })?.response?.data?.message ??
        'Cannot end session';
      Alert.alert('Session error', msg);
    }
  };

  // ── POI marker click → fetch detail + show modal ───────────────────────
  const openPoiDetail = async (poi: PoiMarker) => {
    setIsDetailOpen(true);
    setIsDetailLoading(true);

    try {
      const res = await poiService.detail(poi.id);
      const detail = res.data.data;
      setDetailPoi(detail ?? null);
    } catch (err2) {
      setDetailPoi(null);
      const msg =
        (err2 as { response?: { data?: { message?: string } } })?.response?.data?.message ??
        'Cannot load POI detail';
      Alert.alert('POI detail error', msg);
    } finally {
      setIsDetailLoading(false);
    }
  };

  // ── QR scan → fetch POI + show PoiResultModal ──────────────────────────
  const handleQrScanned = async (poi: PoiDetail) => {
    setIsQrOpen(false);
    setQrPoi(poi);
    setIsQrLoading(false);
  };

  // ── Play audio (reusable) ───────────────────────────────────────────────
  const playAudio = (poi: PoiDetail, triggerType: 'manual' | 'qr' | 'proximity') => {
    void triggerPoi(poi, triggerType);
  };

  const isCurrentPoiPlaying =
    activePoi?.id === detailPoi?.id &&
    (status === 'playing' || status === 'loading' || status === 'paused');

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        {/* ── Header row ────────────────────────────────────────────────── */}
        <View style={styles.headerRow}>
          <View>
            <Text style={styles.title}>Map Discovery</Text>
            <Text style={styles.subtitle}>{summary}</Text>
          </View>

          {/* QR scan button */}
          <Pressable style={styles.qrButton} onPress={() => setIsQrOpen(true)}>
            <Text style={styles.qrButtonIcon}>📷</Text>
            <Text style={styles.qrButtonText}>QR</Text>
          </Pressable>
        </View>

        {/* ── Map ──────────────────────────────────────────────────────── */}
        <SimulatedMap
          pois={pois}
          bounds={DEFAULT_BOUNDS}
          onSelectPoi={(poi) => void openPoiDetail(poi)}
        />

        {/* ── Action buttons ───────────────────────────────────────────── */}
        <View style={styles.actionsRow}>
          <Pressable
            style={[styles.button, styles.primary]}
            onPress={() => void loadPois(1, false)}
            disabled={loading}
          >
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

        {/* ── Queue ──────────────────────────────────────────────────── */}
        {queue.length > 0 && (
          <View style={styles.queueWrapper}>
            <AudioQueue />
          </View>
        )}

        {/* ── POI List ───────────────────────────────────────────────── */}
        <FlatList
          data={pois}
          keyExtractor={(item) => item.id}
          style={styles.list}
          renderItem={({ item }) => (
            <Pressable style={styles.poiCard} onPress={() => void openPoiDetail(item)}>
              <Text style={styles.poiName}>{item.name}</Text>
              <Text style={styles.poiMeta}>
                Lat {formatCoord(item.latitude)} • Lng {formatCoord(item.longitude)}
              </Text>
            </Pressable>
          )}
        />
      </View>

      {/* ── Audio Bottom Sheet ────────────────────────────────────────── */}
      <View style={styles.bottomSheetContainer}>
        <AudioBottomSheet />
      </View>

      {/* ── QR Scanner Modal ──────────────────────────────────────────── */}
      <QRScannerModal
        visible={isQrOpen}
        onClose={() => setIsQrOpen(false)}
        onQrScanned={handleQrScanned}
      />

      {/* ── QR Result: POI Detail Modal ───────────────────────────────── */}
      <PoiResultModal
        visible={qrPoi !== null}
        poi={qrPoi}
        loading={isQrLoading}
        cooldownMsRemaining={
          qrPoi && activePoi?.id === qrPoi.id ? qrCooldownMs : null
        }
        onClose={() => setQrPoi(null)}
        onPlayAudio={(poi) => playAudio(poi, 'qr')}
      />

      {/* ── POI Detail Modal (from map marker click) ─────────────────── */}
      <Modal
        visible={isDetailOpen}
        transparent
        animationType="slide"
        onRequestClose={() => setIsDetailOpen(false)}
      >
        <View style={styles.modalBackdrop}>
          <View style={styles.modalCard}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Chi tiết điểm</Text>
              <Pressable onPress={() => setIsDetailOpen(false)} hitSlop={10}>
                <Text style={styles.modalClose}>Đóng</Text>
              </Pressable>
            </View>

            {isDetailLoading ? (
              <View style={styles.loadingWrap}>
                <ActivityIndicator size="small" color="#4f46e5" />
                <Text style={styles.loadingText}>Đang tải...</Text>
              </View>
            ) : detailPoi ? (
              <ScrollView contentContainerStyle={styles.detailBody}>
                {!!detailPoi.imageUrl && (
                  <Image source={{ uri: getFullImageUrl(detailPoi.imageUrl) ?? undefined }} style={styles.coverImage} />
                )}
                <Text style={styles.detailName}>{getFullImageUrl(detailPoi.imageUrl)}</Text>

                {isCurrentPoiPlaying && (
                  <View style={styles.audioStatusBar}>
                    <Text style={styles.audioStatusIcon}>
                      {status === 'loading' ? '⏳' : status === 'playing' ? '🔊' : '⏸'}
                    </Text>
                    <Text style={styles.audioStatusText}>
                      {status === 'loading'
                        ? 'Đang tải audio...'
                        : status === 'playing'
                          ? 'Đang phát thuyết minh'
                          : 'Tạm dừng'}
                    </Text>
                  </View>
                )}

                {!!detailPoi.description && (
                  <Text style={styles.detailDescription}>{detailPoi.description}</Text>
                )}

                <View style={styles.detailSection}>
                  <Text style={styles.detailSectionTitle}>📍 Tọa độ</Text>
                  <Text style={styles.detailMeta}>Lat {formatCoord(detailPoi.latitude)}</Text>
                  <Text style={styles.detailMeta}>Lng {formatCoord(detailPoi.longitude)}</Text>
                  <Text style={styles.detailMeta}>Bán kính {detailPoi.radiusMeters}m</Text>
                </View>

                {!!detailPoi.merchant && (
                  <View style={styles.detailSection}>
                    <Text style={styles.detailSectionTitle}>🏪 Gian hàng</Text>
                    <Text style={styles.detailMeta}>{detailPoi.merchant.shopName}</Text>
                    {!!detailPoi.merchant.address && (
                      <Text style={styles.detailMeta}>{detailPoi.merchant.address}</Text>
                    )}
                  </View>
                )}

                {!isCurrentPoiPlaying && (
                  <Pressable
                    style={styles.playAudioBtn}
                    onPress={() => {
                      if (detailPoi) playAudio(detailPoi, 'manual');
                    }}
                  >
                    <Text style={styles.playAudioBtnText}>▶ Nghe thuyết minh</Text>
                  </Pressable>
                )}
              </ScrollView>
            ) : (
              <Text style={styles.emptyDetail}>Không có dữ liệu.</Text>
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
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  title: { fontSize: 22, fontWeight: '700', color: '#111827' },
  subtitle: { fontSize: 13, color: '#6b7280', marginTop: 2 },
  qrButton: {
    backgroundColor: '#6366f1',
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 8,
    alignItems: 'center',
    gap: 2,
  },
  qrButtonIcon: { fontSize: 18 },
  qrButtonText: { color: '#fff', fontSize: 11, fontWeight: '700' },
  actionsRow: { flexDirection: 'row', gap: 10 },
  button: { flex: 1, borderRadius: 10, paddingVertical: 10, alignItems: 'center' },
  primary: { backgroundColor: '#4f46e5' },
  secondary: { backgroundColor: '#0ea5e9' },
  danger: { backgroundColor: '#ef4444' },
  disabled: { opacity: 0.45 },
  buttonText: { color: '#fff', fontWeight: '700' },
  queueWrapper: { marginTop: -2 },
  list: { marginTop: 2 },
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
  bottomSheetContainer: { position: 'absolute', bottom: 0, left: 0, right: 0 },
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(15,23,42,0.45)',
    justifyContent: 'flex-end',
  },
  modalCard: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 18,
    borderTopRightRadius: 18,
    maxHeight: '72%',
    paddingBottom: 20,
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
  coverImage: { width: '100%', height: 170, borderRadius: 12, backgroundColor: '#e5e7eb' },
  detailName: { fontSize: 18, fontWeight: '700', color: '#111827' },
  audioStatusBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#ede9fe',
    borderRadius: 10,
    padding: 10,
  },
  audioStatusIcon: { fontSize: 18 },
  audioStatusText: { fontSize: 13, color: '#4f46e5', fontWeight: '600', flex: 1 },
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
  playAudioBtn: {
    backgroundColor: '#4f46e5',
    borderRadius: 10,
    padding: 12,
    alignItems: 'center',
    marginTop: 4,
  },
  playAudioBtnText: { color: '#fff', fontWeight: '700', fontSize: 14 },
  emptyDetail: { padding: 14, color: '#6b7280' },
});
