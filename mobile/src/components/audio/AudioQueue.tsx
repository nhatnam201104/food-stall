import React from 'react';
import { FlatList, Image, Pressable, StyleSheet, Text, View } from 'react-native';
import { useAudioStore } from '../../stores/audioStore';
import type { AudioQueueItem } from '../../types/audio.types';
import { getFullImageUrl } from '../../utils/image-url.util';

export function AudioQueue() {
  const { queue, removeFromQueue, playNow, skipToNext } = useAudioStore();

  if (queue.length === 0) {
    return (
      <View style={styles.emptyContainer}>
        <Text style={styles.emptyIcon}>🎵</Text>
        <Text style={styles.emptyText}>Hàng đợi trống</Text>
      </View>
    );
  }

  const renderItem = ({ item, index }: { item: AudioQueueItem; index: number }) => (
    <View style={styles.queueItem}>
      {/* ── Thumbnail ──────────────────────────────────────────────────────── */}
      {item.poi.imageUrl ? (
        <Image source={{ uri: getFullImageUrl(item.poi.imageUrl) ?? undefined }} style={styles.thumb} />
      ) : (
        <View style={[styles.thumb, styles.thumbPlaceholder]}>
          <Text style={{ fontSize: 16 }}>🎵</Text>
        </View>
      )}

      {/* ── Info ────────────────────────────────────────────────────────────── */}
      <View style={styles.info}>
        <Text style={styles.poiName} numberOfLines={1}>
          {item.poi.name}
        </Text>
        <Text style={styles.triggerLabel}>
          {item.triggerType === 'qr'
            ? '📷 QR scan'
            : item.triggerType === 'proximity'
              ? '📍 Tự động'
              : '👆 Thủ công'}{' '}
          • #{index + 1}
        </Text>
      </View>

      {/* ── Actions ──────────────────────────────────────────────────────────── */}
      <View style={styles.actions}>
        <Pressable
          style={styles.playNowBtn}
          onPress={() => void playNow(item.poi.id)}
          hitSlop={6}
        >
          <Text style={styles.playNowText}>▶ Phát</Text>
        </Pressable>
        <Pressable
          style={styles.removeBtn}
          onPress={() => removeFromQueue(item.poi.id)}
          hitSlop={6}
        >
          <Text style={styles.removeBtnText}>✕</Text>
        </Pressable>
      </View>
    </View>
  );

  return (
    <View style={styles.container}>
      <View style={styles.headerRow}>
        <Text style={styles.title}>Hàng đợi ({queue.length})</Text>
        <Pressable onPress={() => void skipToNext()} hitSlop={8}>
          <Text style={styles.skipBtn}>⏭ Bỏ qua</Text>
        </Pressable>
      </View>

      <FlatList
        data={queue}
        keyExtractor={(item) => item.poi.id}
        renderItem={renderItem}
        scrollEnabled={false}
        ItemSeparatorComponent={() => <View style={styles.separator} />}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#fff',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    overflow: 'hidden',
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
    backgroundColor: '#fafafa',
  },
  title: {
    fontSize: 13,
    fontWeight: '700',
    color: '#374151',
  },
  skipBtn: {
    fontSize: 12,
    color: '#6366f1',
    fontWeight: '600',
  },
  emptyContainer: {
    alignItems: 'center',
    paddingVertical: 16,
    gap: 4,
  },
  emptyIcon: { fontSize: 24 },
  emptyText: {
    fontSize: 13,
    color: '#9ca3af',
  },
  queueItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 10,
    gap: 10,
  },
  thumb: {
    width: 38,
    height: 38,
    borderRadius: 8,
    backgroundColor: '#e5e7eb',
  },
  thumbPlaceholder: {
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#ede9fe',
  },
  info: {
    flex: 1,
    gap: 2,
  },
  poiName: {
    fontSize: 13,
    fontWeight: '600',
    color: '#111827',
  },
  triggerLabel: {
    fontSize: 11,
    color: '#9ca3af',
  },
  actions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  playNowBtn: {
    backgroundColor: '#ede9fe',
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  playNowText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#6366f1',
  },
  removeBtn: {
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: '#fee2e2',
    alignItems: 'center',
    justifyContent: 'center',
  },
  removeBtnText: {
    fontSize: 12,
    color: '#ef4444',
  },
  separator: {
    height: 1,
    backgroundColor: '#f3f4f6',
    marginHorizontal: 12,
  },
});
