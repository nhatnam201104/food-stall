import { create } from 'zustand';
import { audioManager, audioInitialState } from '../services/audio/AudioManager';
import type { AudioActions, AudioQueueItem, AudioState, TriggerType } from '../types/audio.types';
import type { PoiDetail } from '../types/tourist.types';

const QUEUE_CAP = 10;

export type AudioStore = AudioState & AudioActions;

export const useAudioStore = create<AudioStore>((set, get) => {
  // ─── Wire AudioManager to Zustand ──────────────────────────────────────────
  audioManager.init((updater) => set((prev) => updater(prev as AudioState) as AudioStore));

  // ─── Auto-advance queue when audio finishes ────────────────────────────────
  audioManager.onFinished = () => {
    const { queue } = get();
    if (queue.length > 0) {
      const [next, ...rest] = queue;
      set({ queue: rest });
      void audioManager.startPlayback(next.poi, next.triggerType);
    } else {
      set({ activePoi: null, status: 'idle', progress: 0, positionSeconds: 0 });
    }
  };

  return {
    // ─── Initial state ──────────────────────────────────────────────────────
    ...audioInitialState(),

    // ─── triggerPoi: main entry point ──────────────────────────────────────
    triggerPoi: async (poi: PoiDetail, triggerType: TriggerType): Promise<void> => {
      const { status, activePoi, queue } = get();

      // Cooldown check (skip for manual trigger)
      if (triggerType !== 'manual' && audioManager.isInCooldown(poi.id)) return;

      const isActive = status === 'playing' || status === 'loading' || status === 'paused';

      // Something is already playing → enqueue
      if (isActive && activePoi?.id !== poi.id) {
        const alreadyQueued = queue.some((q: AudioQueueItem) => q.poi.id === poi.id);
        if (!alreadyQueued && queue.length < QUEUE_CAP) {
          const item: AudioQueueItem = { poi, triggerType, addedAt: Date.now() };
          set({ queue: [...queue, item] });
        }
        return;
      }

      // Nothing playing or same POI → play immediately
      await audioManager.startPlayback(poi, triggerType);
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
        status: 'idle',
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
        set({ activePoi: null, status: 'idle', progress: 0 });
        return;
      }

      const [next, ...rest] = queue;
      set({ queue: rest });
      await audioManager.startPlayback(next.poi, next.triggerType);
    },

    // ─── Queue management ───────────────────────────────────────────────────
    removeFromQueue: (poiId: string): void => {
      set((prev) => ({
        queue: (prev as AudioStore).queue.filter((q: AudioQueueItem) => q.poi.id !== poiId),
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
      set({ errorMessage: null, status: 'idle' });
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
