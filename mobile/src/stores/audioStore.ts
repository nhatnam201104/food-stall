import { create } from "zustand";
import {
  audioManager,
  audioInitialState,
} from "../services/audio/AudioManager";
import type { AudioFinishedPayload } from "../services/audio/AudioManager";
import { poiService } from "../services/poi.service";
import { sessionService } from "../services/session.service";
import type {
  AudioActions,
  AudioQueueItem,
  AudioState,
  TriggerType,
} from "../types/audio.types";
import type { PoiDetail } from "../types/tourist.types";
import { useLocationStore } from "./locationStore";

const QUEUE_CAP = 10;

export type TriggerResult =
  | { played: true }
  | { played: false; reason: "cooldown" | "queued" | "already_active" };

export type AudioStore = AudioState &
  AudioActions & {
    /** Check if a POI is currently in cooldown */
    isPoiInCooldown: (poiId: string) => boolean;
    /** Get cooldown remaining ms for any POI (not just active) */
    getPoiCooldownRemaining: (poiId: string) => number | null;
    /** Clear all cooldowns (e.g. when starting a tour) */
    clearAllCooldowns: () => void;
  };

export const useAudioStore = create<AudioStore>((set, get) => {
  // ─── Wire AudioManager to Zustand ──────────────────────────────────────────
  audioManager.init((updater) =>
    set((prev) => updater(prev as AudioState) as AudioStore),
  );

  // ─── Auto-advance queue when audio finishes ────────────────────────────────
  audioManager.onFinished = (payload: AudioFinishedPayload) => {
    const { queue } = get();
    const {
      finishedPoiId,
      triggerType,
      playDurationSeconds,
      totalDurationSeconds,
      completed,
    } = payload;

    // Increment POI priority when user listens to full TTS
    if (finishedPoiId) {
      void poiService.incrementPriority(finishedPoiId).catch(() => {});
    }

    // ── Push audio play history to session (with accurate duration data) ──
    if (finishedPoiId && triggerType) {
      try {
        const sessionId = sessionService.getActiveSessionId();
        if (sessionId) {
          const triggerMap: Record<
            TriggerType,
            "gps_proximity" | "qr_scan" | "manual"
          > = {
            proximity: "gps_proximity",
            qr: "qr_scan",
            manual: "manual",
          };
          void sessionService.pushAudioPlay(sessionId, {
            poiId: finishedPoiId,
            triggerType: triggerMap[triggerType],
            playDurationSeconds,
            totalDurationSeconds,
            completed,
          });
        }
      } catch {
        // Audio history push failed silently
      }
    }

    if (queue.length > 0) {
      const [next, ...rest] = queue;
      set({ queue: rest });
      void audioManager.startPlayback(next.poi, next.triggerType);
    } else {
      set({ activePoi: null, status: "idle", progress: 0, positionSeconds: 0 });
    }
  };

  return {
    // ─── Initial state ──────────────────────────────────────────────────────
    ...audioInitialState(),
    playedPoiIds: [] as string[],

    // ─── triggerPoi: main entry point ──────────────────────────────────────
    triggerPoi: async (
      poi: PoiDetail,
      triggerType: TriggerType,
    ): Promise<void> => {
      const state = get();
      const { status, activePoi, queue, playedPoiIds } = state;

      // Proximity: play only once per session (never replay via nearby)
      if (triggerType === "proximity" && playedPoiIds.includes(poi.id)) {
        return;
      }

      // QR scan: respect cooldown timer
      if (triggerType === "qr" && audioManager.isInCooldown(poi.id)) {
        return;
      }

      const isActive =
        status === "playing" || status === "loading" || status === "paused";

      // Something is already playing → enqueue
      if (isActive && activePoi?.id !== poi.id) {
        const alreadyQueued = queue.some(
          (q: AudioQueueItem) => q.poi.id === poi.id,
        );
        if (!alreadyQueued && queue.length < QUEUE_CAP) {
          const item: AudioQueueItem = {
            poi,
            triggerType,
            addedAt: Date.now(),
          };
          set({ queue: [...queue, item] });
        }
        return;
      }

      // Nothing playing or same POI → play immediately
      await audioManager.startPlayback(poi, triggerType);
      get().addPlayedPoiId(poi.id);
    },

    addPlayedPoiId: (id: string) => {
      set((state) => ({ playedPoiIds: [...state.playedPoiIds, id] }));
      useLocationStore.getState().incrementTotalPoisHeard();
    },

    clearPlayedPois: () => {
      set({ playedPoiIds: [] });
    },

    // ─── Play / Pause / Stop ────────────────────────────────────────────────
    play: async (): Promise<void> => {
      await audioManager.play();
    },

    pause: (): void => {
      void audioManager.pause();
    },

    stop: (): void => {
      void audioManager.stop();
      set({
        activePoi: null,
        status: "idle",
        progress: 0,
        positionSeconds: 0,
        durationSeconds: 0,
      });
    },

    // ─── Skip to next in queue ──────────────────────────────────────────────
    skipToNext: async (): Promise<void> => {
      const { queue } = get();
      await audioManager.stop();

      if (queue.length === 0) {
        set({ activePoi: null, status: "idle", progress: 0 });
        return;
      }

      const [next, ...rest] = queue;
      set({ queue: rest });
      await audioManager.startPlayback(next.poi, next.triggerType);
    },

    // ─── Queue management ───────────────────────────────────────────────────
    removeFromQueue: (poiId: string): void => {
      set((prev) => ({
        queue: (prev as AudioStore).queue.filter(
          (q: AudioQueueItem) => q.poi.id !== poiId,
        ),
      }));
    },

    clearQueue: (): void => {
      set({ queue: [] });
    },

    // ─── Play a queue item immediately ──────────────────────────────────────
    playNow: async (poiId: string): Promise<void> => {
      const { queue } = get();
      const item = queue.find((q: AudioQueueItem) => q.poi.id === poiId);
      if (!item) return;

      // Remove from queue
      set({ queue: queue.filter((q: AudioQueueItem) => q.poi.id !== poiId) });

      // Stop current and play selected
      await audioManager.stop();
      await audioManager.startPlayback(item.poi, item.triggerType);
    },

    // ─── Clear error ────────────────────────────────────────────────────────
    clearError: (): void => {
      set({ errorMessage: null, status: "idle" });
    },

    // ─── Check if a POI is in cooldown ──────────────────────────────────────
    isPoiInCooldown: (poiId: string): boolean => {
      return audioManager.isInCooldown(poiId);
    },

    // ─── Get cooldown remaining ms for any POI ──────────────────────────────
    getPoiCooldownRemaining: (poiId: string): number | null => {
      const expiry = audioManager.getCooldownExpiry(poiId);
      if (!expiry) return null;
      const remaining = expiry - Date.now();
      return remaining > 0 ? remaining : null;
    },

    // ─── Clear all cooldowns (e.g. when starting a tour) ────────────────────
    clearAllCooldowns: (): void => {
      audioManager.clearCooldowns();
      set({ cooldownUntilMs: null });
    },
  };
});

/**
 * Hook to check if a POI is in cooldown.
 */
export function useIsInCooldown(poiId: string): boolean {
  const activePoi = useAudioStore((s) => s.activePoi);
  const cooldownUntilMs = useAudioStore((s) => s.cooldownUntilMs);

  // Only show cooldown UI for the active POI
  if (activePoi?.id !== poiId) return false;
  if (!cooldownUntilMs) return false;

  return Date.now() < cooldownUntilMs;
}
