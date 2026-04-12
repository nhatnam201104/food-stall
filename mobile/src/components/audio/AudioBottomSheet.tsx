import React, { useEffect, useRef } from 'react';
import {
  ActivityIndicator,
  Animated,
  Image,
  Pressable,
  Text,
  View,
} from 'react-native';
import { getFullImageUrl } from '../../utils/image-url.util';
import { useAudioStore } from '../../stores/audioStore';
import { styles } from './audio-bottom-sheet.styles';

export function AudioBottomSheet() {
  const { activePoi, status, progress, positionSeconds, durationSeconds, play, pause, stop } =
    useAudioStore();

  const slideAnim = useRef(new Animated.Value(200)).current;
  const visible = activePoi !== null && status !== 'idle' && status !== 'stopped';

  useEffect(() => {
    Animated.spring(slideAnim, {
      toValue: visible ? 0 : 200,
      useNativeDriver: true,
      bounciness: 4,
    }).start();
  }, [visible, slideAnim]);

  const isPlaying = status === 'playing';
  const isLoading = status === 'loading';

  const fmt = (s: number): string => {
    const m = Math.floor(s / 60);
    const sec = Math.floor(s % 60);
    return `${m}:${sec.toString().padStart(2, '0')}`;
  };

  if (!activePoi) return null;

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


