import React from "react";
import {
  ActivityIndicator,
  Image,
  Modal,
  Pressable,
  ScrollView,
  Text,
  View,
} from 'react-native';
import { useAudioStore } from '../../stores/audioStore';
import { useLanguageStore } from '../../stores/languageStore';
import { LANGUAGE_LABELS } from '../../utils/language.util';
import type { PoiDetail } from '../../types/tourist.types';
import { getFullImageUrl } from '../../utils/image-url.util';
import { styles } from './poi-result-modal.styles';

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
  const appLanguage = useLanguageStore((s) => s.appLanguage);
  const isCurrentPlaying =
    activePoi?.id === poi?.id && (status === "playing" || status === "loading");

  const isInCooldown = cooldownMsRemaining !== null && cooldownMsRemaining > 0;

  const formatCoord = (value: unknown) => {
    if (typeof value === "number" && Number.isFinite(value))
      return value.toFixed(6);
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed.toFixed(6) : "N/A";
  };

  const fmtCooldown = (ms: number): string => {
    const secs = Math.ceil(ms / 1000);
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    if (m > 0) return `${m}m ${s}s`;
    return `${s}s`;
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <View style={styles.backdrop}>
        <View style={styles.card}>
          {/* ── Header ──────────────────────────────────────────────────── */}
          <View style={styles.header}>
            <Text style={styles.headerTitle}>
              {loading
                ? "Đang tải..."
                : poi
                  ? "Chi tiết điểm"
                  : "Không tìm thấy"}
            </Text>
            <Pressable onPress={onClose} hitSlop={10}>
              <Text style={styles.closeBtn}>✕</Text>
            </Pressable>
          </View>

          {/* ── Content ───────────────────────────────────────────────── */}
          {loading ? (
            <View style={styles.loadingWrap}>
              <ActivityIndicator size="large" color="#6366f1" />
              <Text style={styles.loadingText}>
                Đang tải thông tin điểm thuyết minh...
              </Text>
            </View>
          ) : poi ? (
            <ScrollView
              contentContainerStyle={styles.body}
              showsVerticalScrollIndicator={false}
            >
              {/* Cover image */}
              {poi.imageUrl && (
                <Image
                  source={{ uri: getFullImageUrl(poi.imageUrl) ?? undefined }}
                  style={styles.coverImage}
                />
              )}

              {/* POI name */}
              <Text style={styles.poiName}>{poi.name}</Text>

              {/* Category & Priority badges */}
              <View style={styles.badgeRow}>
                {!!poi.category && (
                  <View style={styles.badge}>
                    <Text style={styles.badgeText}>{poi.category}</Text>
                  </View>
                )}
                <View style={[styles.badge, styles.badgePriority]}>
                  <Text style={styles.badgeText}>Priority: {poi.priority}</Text>
                </View>
              </View>

              {/* Cooldown notice */}
              {isInCooldown && (
                <View style={styles.cooldownNotice}>
                  <Text style={styles.cooldownIcon}>⏳</Text>
                  <View style={styles.cooldownTextWrap}>
                    <Text style={styles.cooldownTitle}>
                      Đang trong thời gian chờ
                    </Text>
                    <Text style={styles.cooldownDesc}>
                      Audio sẽ tự động bật sau{" "}
                      {fmtCooldown(cooldownMsRemaining!)}
                    </Text>
                  </View>
                </View>
              )}

              {/* Currently playing indicator */}
              {isCurrentPlaying && (
                <View style={styles.playingNotice}>
                  <Text style={styles.playingIcon}>
                    {status === "loading" ? "⏳" : "🔊"}
                  </Text>
                  <Text style={styles.playingText}>
                    {status === "loading"
                      ? "Đang tải audio..."
                      : "Đang phát thuyết minh"}
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
                <Text style={styles.meta}>
                  Vĩ độ: {formatCoord(poi.latitude)}
                </Text>
                <Text style={styles.meta}>
                  Kinh độ: {formatCoord(poi.longitude)}
                </Text>
                <Text style={styles.meta}>Bán kính: {poi.radiusMeters}m</Text>
                <Text style={styles.meta}>
                  Cooldown: {poi.cooldownSeconds}s
                </Text>
              </View>

              {/* Merchant */}
              {poi.merchant && (
                <View style={styles.section}>
                  <Text style={styles.sectionTitle}>🏪 Gian hàng</Text>
                  <Text style={styles.meta}>{poi.merchant.shopName}</Text>
                  {poi.merchant.address && (
                    <Text style={styles.meta}>📎 {poi.merchant.address}</Text>
                  )}
                </View>
              )}

              {/* Audio list */}
              {!!poi.poiAudio && poi.poiAudio.length > 0 && (
                <View style={styles.section}>
                  <Text style={styles.sectionTitle}>
                    🔊 Audio ({poi.poiAudio.length})
                  </Text>
                  {poi.poiAudio.map((audio) => (
                    <Text key={audio.id} style={styles.meta}>
                      {LANGUAGE_LABELS[appLanguage]} — {audio.status}
                    </Text>
                  ))}
                </View>
              )}

              {/* Play button */}
              <Pressable
                style={[styles.playBtn, isInCooldown && styles.playBtnDisabled]}
                onPress={() => onPlayAudio(poi)}
                disabled={isInCooldown}
              >
                <Text style={styles.playBtnText}>
                  ▶{" "}
                  {isInCooldown
                    ? "Đang chờ cooldown..."
                    : isCurrentPlaying
                      ? status === "loading"
                        ? "Đang tải audio..."
                        : "Đang phát thuyết minh..."
                      : "Nghe thuyết minh"}
                </Text>
              </Pressable>
            </ScrollView>
          ) : (
            <View style={styles.emptyWrap}>
              <Text style={styles.emptyIcon}>🔍</Text>
              <Text style={styles.emptyText}>
                Không tìm thấy thông tin điểm thuyết minh.
              </Text>
            </View>
          )}
        </View>
      </View>
    </Modal>
  );
}

