import React from 'react';
import {
  ActivityIndicator,
  Image,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useAudioStore } from '../../stores/audioStore';
import type { PoiDetail } from '../../types/tourist.types';
import { getFullImageUrl } from '../../utils/image-url.util';

interface Props {
  visible: boolean;
  poi: PoiDetail | null;
  loading: boolean;
  cooldownMsRemaining: number | null; // ms remaining in cooldown
  onClose: () => void;
  onPlayAudio: (poi: PoiDetail) => void;
}

export function PoiResultModal({
  visible,
  poi,
  loading,
  cooldownMsRemaining,
  onClose,
  onPlayAudio,
}: Props) {
  const { status, activePoi } = useAudioStore();
  const isCurrentPlaying =
    activePoi?.id === poi?.id && (status === 'playing' || status === 'loading');

  const isInCooldown = cooldownMsRemaining !== null && cooldownMsRemaining > 0;

  const formatCoord = (value: unknown) => {
    if (typeof value === 'number' && Number.isFinite(value)) return value.toFixed(6);
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed.toFixed(6) : 'N/A';
  };

  const fmtCooldown = (ms: number): string => {
    const secs = Math.ceil(ms / 1000);
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    if (m > 0) return `${m}m ${s}s`;
    return `${s}s`;
  };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={styles.backdrop}>
        <View style={styles.card}>
          {/* ── Header ──────────────────────────────────────────────────── */}
          <View style={styles.header}>
            <Text style={styles.headerTitle}>
              {loading ? 'Đang tải...' : poi ? 'Chi tiết điểm' : 'Không tìm thấy'}
            </Text>
            <Pressable onPress={onClose} hitSlop={10}>
              <Text style={styles.closeBtn}>✕</Text>
            </Pressable>
          </View>

          {/* ── Content ───────────────────────────────────────────────── */}
          {loading ? (
            <View style={styles.loadingWrap}>
              <ActivityIndicator size="large" color="#6366f1" />
              <Text style={styles.loadingText}>Đang tải thông tin điểm thuyết minh...</Text>
            </View>
          ) : poi ? (
            <ScrollView contentContainerStyle={styles.body} showsVerticalScrollIndicator={false}>
              {/* Cover image */}
              {poi.imageUrl && (
                <Image source={{ uri: getFullImageUrl(poi.imageUrl) ?? undefined }} style={styles.coverImage} />
              )}

              {/* POI name */}
              <Text style={styles.poiName}>{poi.name}</Text>

              {/* Cooldown notice */}
              {isInCooldown && (
                <View style={styles.cooldownNotice}>
                  <Text style={styles.cooldownIcon}>⏳</Text>
                  <View style={styles.cooldownTextWrap}>
                    <Text style={styles.cooldownTitle}>Đang trong thời gian chờ</Text>
                    <Text style={styles.cooldownDesc}>
                      Audio sẽ tự động bật sau {fmtCooldown(cooldownMsRemaining!)}
                    </Text>
                  </View>
                </View>
              )}

              {/* Currently playing indicator */}
              {isCurrentPlaying && (
                <View style={styles.playingNotice}>
                  <Text style={styles.playingIcon}>
                    {status === 'loading' ? '⏳' : '🔊'}
                  </Text>
                  <Text style={styles.playingText}>
                    {status === 'loading' ? 'Đang tải audio...' : 'Đang phát thuyết minh'}
                  </Text>
                </View>
              )}

              {/* Description */}
              {poi.description && (
                <Text style={styles.description}>{poi.description}</Text>
              )}

              {/* Coordinates */}
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>📍 Tọa độ</Text>
                <Text style={styles.meta}>Vĩ độ: {formatCoord(poi.latitude)}</Text>
                <Text style={styles.meta}>Kinh độ: {formatCoord(poi.longitude)}</Text>
                <Text style={styles.meta}>Bán kính: {poi.radiusMeters}m</Text>
              </View>

              {/* Merchant */}
              {poi.merchant && (
                <View style={styles.section}>
                  <Text style={styles.sectionTitle}>🏪 Gian hàng</Text>
                  <Text style={styles.meta}>{poi.merchant.shopName}</Text>
                  {poi.merchant.address && (
                    <Text style={styles.meta}>{poi.merchant.address}</Text>
                  )}
                </View>
              )}

              {/* Play button */}
              <Pressable
                style={[
                  styles.playBtn,
                  isInCooldown && styles.playBtnDisabled,
                ]}
                onPress={() => onPlayAudio(poi)}
                disabled={isInCooldown}
              >
                <Text style={styles.playBtnText}>
                  ▶ {isInCooldown ? 'Đang chờ cooldown...' : 'Nghe thuyết minh'}
                </Text>
              </Pressable>
            </ScrollView>
          ) : (
            <View style={styles.emptyWrap}>
              <Text style={styles.emptyIcon}>🔍</Text>
              <Text style={styles.emptyText}>Không tìm thấy thông tin điểm thuyết minh.</Text>
            </View>
          )}
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(15,23,42,0.5)',
    justifyContent: 'flex-end',
  },
  card: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '80%',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  headerTitle: { fontSize: 16, fontWeight: '700', color: '#111827' },
  closeBtn: { fontSize: 16, color: '#6b7280' },
  loadingWrap: { alignItems: 'center', gap: 12, paddingVertical: 40 },
  loadingText: { color: '#6b7280', fontSize: 14 },
  body: { padding: 16, gap: 12 },
  coverImage: {
    width: '100%',
    height: 180,
    borderRadius: 14,
    backgroundColor: '#f1f5f9',
  },
  poiName: { fontSize: 20, fontWeight: '700', color: '#111827' },
  cooldownNotice: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fef3c7',
    borderRadius: 12,
    padding: 12,
    gap: 10,
    borderWidth: 1,
    borderColor: '#f59e0b',
  },
  cooldownIcon: { fontSize: 22 },
  cooldownTextWrap: { flex: 1 },
  cooldownTitle: { fontSize: 13, fontWeight: '700', color: '#92400e' },
  cooldownDesc: { fontSize: 12, color: '#b45309', marginTop: 2 },
  playingNotice: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ede9fe',
    borderRadius: 10,
    padding: 10,
    gap: 8,
  },
  playingIcon: { fontSize: 18 },
  playingText: { fontSize: 13, color: '#4f46e5', fontWeight: '600', flex: 1 },
  description: { fontSize: 14, lineHeight: 22, color: '#374151' },
  section: {
    backgroundColor: '#f8fafc',
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    gap: 4,
  },
  sectionTitle: { fontSize: 13, fontWeight: '700', color: '#111827', marginBottom: 4 },
  meta: { fontSize: 13, color: '#4b5563' },
  playBtn: {
    backgroundColor: '#4f46e5',
    borderRadius: 12,
    padding: 14,
    alignItems: 'center',
    marginTop: 4,
  },
  playBtnDisabled: { backgroundColor: '#9ca3af' },
  playBtnText: { color: '#fff', fontWeight: '700', fontSize: 15 },
  emptyWrap: { alignItems: 'center', gap: 12, paddingVertical: 40 },
  emptyIcon: { fontSize: 40 },
  emptyText: { color: '#6b7280', fontSize: 14, textAlign: 'center' },
});
