import React from 'react';
import { FlatList, Image, Pressable, Text, View } from 'react-native';
import { useAudioStore } from '../../stores/audioStore';
import type { AudioQueueItem } from '../../types/audio.types';
import { getFullImageUrl } from '../../utils/image-url.util';
import { styles } from './audio-queue.styles';

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


