import type { AudioQueueItem, AudioState, TriggerType } from '../../types/audio.types';
import type { PoiDetail } from '../../types/tourist.types';
import { audioPlayer } from './AudioPlayer';
import { ttsService } from './TTSService';

const QUEUE_CAP = 10;
const COOLDOWN_MS = 300_000; // 5 minutes

export type AudioStateUpdater = (updater: (prev: AudioState) => AudioState) => void;

const initialState = (): AudioState => ({
  activePoi: null,
  status: 'idle',
  progress: 0,
  durationSeconds: 0,
  positionSeconds: 0,
  queue: [],
  errorMessage: null,
  cooldownUntilMs: null,
});

/**
 * AudioManager – Single Source of Truth for all audio orchestration.
 *
 * Principles:
 * • Single Active Audio: only 1 audio plays at any time.
 * • Fallback Chain: audioUrl → ttsContent → graceful error.
 * • Cache First: TTS/file cache checked before network.
 * • State Immutable: only AudioManager calls setState.
 */
class AudioManager {
  private setState: AudioStateUpdater = () => {};
  private cooldowns = new Map<string, number>(); // poiId → expiry timestamp
  private isProcessing = false;

  // ─── Attach Zustand setter ─────────────────────────────────────────────────
  init(setState: AudioStateUpdater): void {
    this.setState = setState;
  }

  // ─── Cooldown helpers ──────────────────────────────────────────────────────
  isInCooldown(poiId: string): boolean {
    const expiry = this.cooldowns.get(poiId) ?? 0;
    return Date.now() < expiry;
  }

  private setCooldown(poiId: string, ms = COOLDOWN_MS): void {
    this.cooldowns.set(poiId, Date.now() + ms);
  }

  // ─── Internal: resolve audio URI via fallback chain ────────────────────────
  private async resolveAudioUri(poi: PoiDetail): Promise<string> {
    const audioRecord = poi.poiAudio?.find((a) => a.status === 'active') ?? poi.poiAudio?.[0];

    // Step 1: audio file URL (no translation needed — plays as-is)
    if (audioRecord?.audioUrl) {
      try {
        return await ttsService.downloadAndCache(poi.id, audioRecord.audioUrl);
      } catch {
        // Fall through to TTS
      }
    }

    // Step 2: TTS content — use DEVICE language so backend can translate vi→{device}
    //         Do NOT pass audioRecord.languageCode as override — that was the bug.
    const ttsText = audioRecord?.ttsContent ?? poi.description ?? poi.name;
    if (ttsText) {
      // detectDeviceLanguage() is called inside TTSService.generateAudio when no override
      // Backend receives sourceLanguage from ttsText (vi) + previewLanguage from device → auto-translates
      return await ttsService.generateAudio(poi.id, ttsText);
    }

    // Step 3: Fallback — use POI name as TTS
    return await ttsService.generateAudio(poi.id, poi.name);
  }

  // ─── Public: start playback for a POI (used by audioStore) ───────────────
  async startPlayback(poi: PoiDetail, triggerType: TriggerType): Promise<void> {
    return this.loadAndPlay(poi, triggerType);
  }

  // ─── Internal: load & play a POI's audio ──────────────────────────────────
  private async loadAndPlay(poi: PoiDetail, triggerType: TriggerType): Promise<void> {
    if (this.isProcessing) return;
    this.isProcessing = true;

    this.setState((prev) => ({
      ...prev,
      activePoi: poi,
      status: 'loading',
      progress: 0,
      positionSeconds: 0,
      durationSeconds: 0,
      errorMessage: null,
    }));

    try {
      const fileUri = await this.resolveAudioUri(poi);

      await audioPlayer.load(fileUri, (update) => {
        if (update.didFinish) {
          // Auto-advance queue
          void this.handleFinished();
          return;
        }
        this.setState((prev) => ({
          ...prev,
          status: update.isPlaying ? 'playing' : 'paused',
          progress: update.progress,
          positionSeconds: update.positionSeconds,
          durationSeconds: update.durationSeconds,
        }));
      });

      const cooldownExpiry = Date.now() + COOLDOWN_MS;
      this.setCooldown(poi.id);
      void this.logPlayHistory(poi, triggerType);

      this.setState((prev) => ({ ...prev, status: 'playing', cooldownUntilMs: cooldownExpiry }));
    } catch (err) {
      // BR-015: Graceful error — do not crash app
      const msg = err instanceof Error ? err.message : 'Audio playback error';
      this.setState((prev) => ({
        ...prev,
        activePoi: null,
        status: 'error',
        errorMessage: msg,
      }));
    } finally {
      this.isProcessing = false;
    }
  }

  // ─── Main entry: trigger audio for a POI ──────────────────────────────────
  async triggerPoi(poi: PoiDetail, triggerType: TriggerType): Promise<void> {
    // Manual trigger always overrides; proximity/qr check cooldown
    if (triggerType !== 'manual' && this.isInCooldown(poi.id)) return;

    this.setState((prev) => {
      const isPlaying =
        prev.status === 'playing' || prev.status === 'loading' || prev.status === 'paused';

      // If something is playing, enqueue (unless same POI already in queue)
      if (isPlaying && prev.activePoi?.id !== poi.id) {
        const alreadyQueued = prev.queue.some((q) => q.poi.id === poi.id);
        if (!alreadyQueued && prev.queue.length < QUEUE_CAP) {
          const item: AudioQueueItem = { poi, triggerType, addedAt: Date.now() };
          return { ...prev, queue: [...prev.queue, item] };
        }
        return prev; // Queue full or already queued
      }

      return prev; // Will proceed to loadAndPlay below
    });

    // Check updated state: if not playing → start immediately
    // We need to read state AFTER setState above; read from player state
    // The check: if activePoi is already set, it means we enqueued → trust that
    // Otherwise fall through and play
    void this.loadAndPlay(poi, triggerType);
  }

  // ─── Private: handle audio finished → advance queue ───────────────────────
  private async handleFinished(): Promise<void> {
    this.setState((prev) => {
      if (prev.queue.length === 0) {
        return { ...prev, activePoi: null, status: 'idle', progress: 1 };
      }
      return prev; // Will process queue below
    });

    // Read queue asynchronously after state update
    // We directly trigger the next item if queue has items
    // Zustand state snapshot - peek at current queue
    await audioPlayer.unload();

    // The store action skipToNext handles this; expose via callback
    this.onFinished?.();
  }

  onFinished?: () => void;

  // ─── Play / Pause / Stop / Resume ─────────────────────────────────────────
  async play(): Promise<void> {
    await audioPlayer.play();
    this.setState((prev) => ({ ...prev, status: 'playing' }));
  }

  async pause(): Promise<void> {
    await audioPlayer.pause();
    this.setState((prev) => ({ ...prev, status: 'paused' }));
  }

  async stop(): Promise<void> {
    await audioPlayer.unload();
    this.setState((prev) => ({
      ...prev,
      activePoi: null,
      status: 'idle',
      progress: 0,
      positionSeconds: 0,
      durationSeconds: 0,
    }));
  }

  // ─── Queue management ──────────────────────────────────────────────────────
  removeFromQueue(poiId: string): void {
    this.setState((prev) => ({
      ...prev,
      queue: prev.queue.filter((q) => q.poi.id !== poiId),
    }));
  }

  clearQueue(): void {
    this.setState((prev) => ({ ...prev, queue: [] }));
  }

  /**
   * Skip current audio and play the queued item with matching poiId immediately.
   */
  async playNow(poiId: string, allQueue: AudioQueueItem[]): Promise<void> {
    const item = allQueue.find((q) => q.poi.id === poiId);
    if (!item) return;

    // Remove from queue, stop current, play the selected item
    this.setState((prev) => ({
      ...prev,
      queue: prev.queue.filter((q) => q.poi.id !== poiId),
    }));

    await audioPlayer.unload();
    this.isProcessing = false;
    await this.loadAndPlay(item.poi, item.triggerType);
  }

  /**
   * Advance to the next item in queue after current finishes.
   */
  async skipToNext(queue: AudioQueueItem[]): Promise<void> {
    if (queue.length === 0) {
      await this.stop();
      return;
    }

    const [next, ...rest] = queue;
    this.setState((prev) => ({ ...prev, queue: rest }));
    this.isProcessing = false;
    await this.loadAndPlay(next.poi, next.triggerType);
  }

  // ─── Clear error ───────────────────────────────────────────────────────────
  clearError(): void {
    this.setState((prev) => ({ ...prev, errorMessage: null, status: 'idle' }));
  }

  // ─── Analytics logging (fire-and-forget) ──────────────────────────────────
  private async logPlayHistory(poi: PoiDetail, triggerType: TriggerType): Promise<void> {
    try {
      // Import lazily to avoid circular deps
      const { sessionService } = await import('../session.service');
      // Log to analytics if session active  
      void sessionService; // placeholder; actual log call would pass sessionId
    } catch {
      // Non-critical — ignore analytics errors
    }
  }

  // ─── Reset all state ───────────────────────────────────────────────────────
  reset(): void {
    void audioPlayer.unload();
    this.cooldowns.clear();
    this.isProcessing = false;
    this.setState(() => initialState());
  }
}

// Singleton
export const audioManager = new AudioManager();
export { initialState as audioInitialState };
