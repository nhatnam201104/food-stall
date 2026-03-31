import React, { useEffect, useRef } from 'react';
import {
  ActivityIndicator,
  Animated,
  Image,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useAudioStore } from '../../stores/audioStore';
import { getFullImageUrl } from '../../utils/image-url.util';

export function AudioBottomSheet() {
  const { activePoi, status, progress, positionSeconds, durationSeconds, play, pause, stop } =
    useAudioStore();

  const slideAnim = useRef(new Animated.Value(200)).current;
  const visible = activePoi !== null && status !== 'idle' && status !== 'stopped';

  // ─── Slide up / down animation ─────────────────────────────────────────────
  useEffect(() => {
    Animated.spring(slideAnim, {
      toValue: visible ? 0 : 200,
      useNativeDriver: true,
      bounciness: 4,
    }).start();
  }, [visible, slideAnim]);

  if (!activePoi) return null;

  const isPlaying = status === 'playing';
  const isLoading = status === 'loading';

  // Format seconds → MM:SS
  const fmt = (s: number): string => {
    const m = Math.floor(s / 60);
    const sec = Math.floor(s % 60);
    return `${m}:${sec.toString().padStart(2, '0')}`;
  };

  return (
    <Animated.View style={[styles.container, { transform: [{ translateY: slideAnim }] }]}>
      {/* ── Header ─────────────────────────────────────────────────────────── */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          {activePoi.imageUrl ? (
            <Image source={{ uri: getFullImageUrl(activePoi.imageUrl) ?? undefined }} style={styles.thumbnail} />
          ) : (
            <View style={[styles.thumbnail, styles.thumbnailPlaceholder]}>
              <Text style={styles.thumbnailIcon}>🎵</Text>
            </View>
          )}
          <View style={styles.titleBlock}>
            <Text style={styles.poiName} numberOfLines={1}>
              {activePoi.name}
            </Text>
            <Text style={styles.statusLabel}>
              {isLoading
                ? 'Đang khởi tạo audio...'
                : isPlaying
                  ? '▶ Đang phát'
                  : status === 'paused'
                    ? '⏸ Tạm dừng'
                    : status === 'error'
                      ? '⚠ Lỗi phát audio'
                      : ''}
            </Text>
          </View>
        </View>

        {/* ── Close ──────────────────────────────────────────────────────────── */}
        <Pressable style={styles.closeBtn} onPress={stop} hitSlop={10}>
          <Text style={styles.closeBtnText}>✕</Text>
        </Pressable>
      </View>

      {/* ── Progress bar ───────────────────────────────────────────────────── */}
      <View style={styles.progressTrack}>
        <View style={[styles.progressFill, { flex: Math.max(progress, 0.001) }]} />
        <View style={{ flex: Math.max(1 - progress, 0.001) }} />
      </View>

      {/* ── Time labels ────────────────────────────────────────────────────── */}
      <View style={styles.timeRow}>
        <Text style={styles.timeLabel}>{fmt(positionSeconds)}</Text>
        <Text style={styles.timeLabel}>{durationSeconds > 0 ? fmt(durationSeconds) : '--:--'}</Text>
      </View>

      {/* ── Controls ───────────────────────────────────────────────────────── */}
      <View style={styles.controls}>
        {isLoading ? (
          <ActivityIndicator size="large" color="#6366f1" />
        ) : (
          <Pressable
            style={styles.playBtn}
            onPress={isPlaying ? pause : () => void play()}
            disabled={isLoading}
          >
            <Text style={styles.playBtnText}>{isPlaying ? '⏸' : '▶'}</Text>
          </Pressable>
        )}
      </View>

      {/* ── Merchant info ──────────────────────────────────────────────────── */}
      {activePoi.merchant && (
        <Text style={styles.merchantLabel} numberOfLines={1}>
          🏪 {activePoi.merchant.shopName}
        </Text>
      )}
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingHorizontal: 16,
    paddingTop: 14,
    paddingBottom: 20,
    borderTopWidth: 1,
    borderColor: '#e5e7eb',
    elevation: 12,
    shadowColor: '#000',
    shadowOpacity: 0.12,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: -4 },
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    gap: 10,
  },
  thumbnail: {
    width: 44,
    height: 44,
    borderRadius: 10,
    backgroundColor: '#e5e7eb',
  },
  thumbnailPlaceholder: {
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#ede9fe',
  },
  thumbnailIcon: { fontSize: 20 },
  titleBlock: { flex: 1 },
  poiName: { fontSize: 15, fontWeight: '700', color: '#111827' },
  statusLabel: { fontSize: 12, color: '#6366f1', marginTop: 2 },
  closeBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#f3f4f6',
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 8,
  },
  closeBtnText: { fontSize: 14, color: '#374151' },
  progressTrack: {
    height: 4,
    backgroundColor: '#e5e7eb',
    borderRadius: 2,
    overflow: 'hidden',
    flexDirection: 'row',
  },
  progressFill: {
    height: 4,
    backgroundColor: '#6366f1',
    borderRadius: 2,
  },
  timeRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 4,
    marginBottom: 10,
  },
  timeLabel: { fontSize: 11, color: '#9ca3af' },
  controls: {
    alignItems: 'center',
    marginBottom: 6,
  },
  playBtn: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#6366f1',
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 4,
  },
  playBtnText: { fontSize: 24, color: '#fff' },
  merchantLabel: {
    fontSize: 12,
    color: '#6b7280',
    textAlign: 'center',
    marginTop: 4,
  },
});
