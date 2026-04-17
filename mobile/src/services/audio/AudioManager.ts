import type {
  AudioQueueItem,
  AudioState,
  TriggerType,
} from "../../types/audio.types";
import type { PoiDetail } from "../../types/tourist.types";
import { audioPlayer } from "./AudioPlayer";
import { ttsService } from "./TTSService";
import { useLanguageStore } from "../../stores/languageStore";
import type { SupportedLanguage } from "../../utils/language.util";

const QUEUE_CAP = 10;

export type AudioStateUpdater = (
  updater: (prev: AudioState) => AudioState,
) => void;

/** Data passed when audio finishes playing */
export interface AudioFinishedPayload {
  finishedPoiId: string | null;
  triggerType: TriggerType | null;
  playDurationSeconds: number;
  totalDurationSeconds: number;
  completed: boolean;
}

const initialState = (): AudioState => ({
  activePoi: null,
  status: "idle",
  progress: 0,
  durationSeconds: 0,
  positionSeconds: 0,
  queue: [],
  errorMessage: null,
  cooldownUntilMs: null,
  playedPoiIds: [],
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
  private cooldowns = new Map<string, number>();
  private isProcessing = false;
  /** Track the trigger type of the currently playing audio */
  private activeTriggerType: TriggerType | null = null;

  init(setState: AudioStateUpdater): void {
    this.setState = setState;
  }

  isInCooldown(poiId: string): boolean {
    const expiry = this.cooldowns.get(poiId) ?? 0;
    return Date.now() < expiry;
  }

  getCooldownExpiry(poiId: string): number | null {
    const expiry = this.cooldowns.get(poiId);
    if (!expiry || Date.now() >= expiry) return null;
    return expiry;
  }

  clearCooldowns(): void {
    this.cooldowns.clear();
  }

  private setCooldown(poiId: string, ms: number): void {
    this.cooldowns.set(poiId, Date.now() + ms);
  }

  /**
   * Resolve audio URI via tiered fallback chain.
   *
   * Uses appLanguage from store (user's POI language setting) as TTS target.
   * Backend handles translation from source language to target language.
   *
   * - Tier 1: Pre-recorded audio file → play directly
   * - Tier 2: ttsContent → send to backend with appLanguage + sourceLanguage
   * - Tier 3: Fallback → original description, backend handles translation
   */
  private async resolveAudioUri(poi: PoiDetail): Promise<string> {
    const appLanguage = useLanguageStore.getState().appLanguage;
    const audioRecord = poi.poiAudio?.[0];

    // Source language of the original content (default: Vietnamese)
    const contentLanguage: SupportedLanguage =
      (audioRecord?.languageCode as SupportedLanguage | undefined) ?? "vi";

    // ─── Tier 1: Pre-recorded audio file ────────────────────────────────────
    if (audioRecord?.audioUrl) {
      try {
        return await ttsService.downloadAndCache(poi.id, audioRecord.audioUrl);
      } catch (error) {
        console.log("Failed to download pre-recorded audio, falling back to TTS");
        console.error(error);
      }
    }

    // ─── Tier 2: ttsContent → send to backend for translation + TTS ──────────
    if (audioRecord?.ttsContent) {
      return await ttsService.generateAudio(
        poi.id,
        audioRecord.ttsContent,
        appLanguage,
        contentLanguage,
      );
    }

    // ─── Tier 3: Fallback — original description ────────────────────────────
    const fallbackText = poi.description ?? poi.name;
    return await ttsService.generateAudio(poi.id, fallbackText, appLanguage, "vi");
  }

  async startPlayback(poi: PoiDetail, triggerType: TriggerType): Promise<void> {
    return this.loadAndPlay(poi, triggerType);
  }

  private async loadAndPlay(
    poi: PoiDetail,
    triggerType: TriggerType,
  ): Promise<void> {
    if (this.isProcessing) return;
    this.isProcessing = true;

    this.activeTriggerType = triggerType;
    this.setState((prev) => ({
      ...prev,
      activePoi: poi,
      status: "loading",
      progress: 0,
      positionSeconds: 0,
      durationSeconds: 0,
      errorMessage: null,
    }));
    try {
      const fileUri = await this.resolveAudioUri(poi);
     
      await audioPlayer.load(fileUri, (update) => {
        if (update.didFinish) {
          void this.handleFinished();
          return;
        }
        this.setState((prev) => ({
          ...prev,
          status: update.isPlaying ? "playing" : "paused",
          progress: update.progress,
          positionSeconds: update.positionSeconds,
          durationSeconds: update.durationSeconds,
        }));
      });

      // Only set cooldown for QR triggers (proximity plays once per session)
      if (triggerType === "qr") {
        const cooldownMs = poi.cooldownSeconds * 1000;
        const cooldownExpiry = Date.now() + cooldownMs;
        this.setCooldown(poi.id, cooldownMs);
        this.setState((prev) => ({
          ...prev,
          status: "playing",
          cooldownUntilMs: cooldownExpiry,
        }));
      } else {
        this.setState((prev) => ({
          ...prev,
          status: "playing",
          cooldownUntilMs: null,
        }));
      }

      void this.logPlayHistory(poi, triggerType);
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Audio playback error";
      console.log ("Audio playback error:", msg);
      this.setState((prev) => ({
        ...prev,
        activePoi: null,
        status: "error",
        errorMessage: msg,
      }));
    } finally {
      this.isProcessing = false;
    }
  }

  async triggerPoi(poi: PoiDetail, triggerType: TriggerType): Promise<void> {
    if (triggerType !== "manual" && this.isInCooldown(poi.id)) return;

    this.setState((prev) => {
      const isPlaying =
        prev.status === "playing" ||
        prev.status === "loading" ||
        prev.status === "paused";

      if (isPlaying && prev.activePoi?.id !== poi.id) {
        const alreadyQueued = prev.queue.some((q) => q.poi.id === poi.id);
        if (!alreadyQueued && prev.queue.length < QUEUE_CAP) {
          const item: AudioQueueItem = {
            poi,
            triggerType,
            addedAt: Date.now(),
          };
          return { ...prev, queue: [...prev.queue, item] };
        }
        return prev;
      }

      return prev;
    });

    void this.loadAndPlay(poi, triggerType);
  }

  private async handleFinished(): Promise<void> {
    // Capture duration data BEFORE clearing state
    let finishedPoiId: string | null = null;
    let positionSeconds = 0;
    let durationSeconds = 0;
    this.setState((prev) => {
      finishedPoiId = prev.activePoi?.id ?? null;
      positionSeconds = prev.positionSeconds;
      durationSeconds = prev.durationSeconds;
      if (prev.queue.length === 0) {
        return { ...prev, activePoi: null, status: "idle", progress: 1 };
      }
      return prev;
    });

    const payload: AudioFinishedPayload = {
      finishedPoiId,
      triggerType: this.activeTriggerType,
      playDurationSeconds: Math.round(positionSeconds),
      totalDurationSeconds: Math.round(durationSeconds),
      completed:
        durationSeconds > 0 && positionSeconds >= durationSeconds * 0.9,
    };
    this.activeTriggerType = null;

    await audioPlayer.unload();
    this.onFinished?.(payload);
  }

  onFinished?: (payload: AudioFinishedPayload) => void;

  async play(): Promise<void> {
    await audioPlayer.play();
    this.setState((prev) => ({ ...prev, status: "playing" }));
  }

  async pause(): Promise<void> {
    await audioPlayer.pause();
    this.setState((prev) => ({ ...prev, status: "paused" }));
  }

  async stop(): Promise<void> {
    await audioPlayer.unload();
    this.setState((prev) => ({
      ...prev,
      activePoi: null,
      status: "idle",
      progress: 0,
      positionSeconds: 0,
      durationSeconds: 0,
    }));
  }

  removeFromQueue(poiId: string): void {
    this.setState((prev) => ({
      ...prev,
      queue: prev.queue.filter((q) => q.poi.id !== poiId),
    }));
  }

  clearQueue(): void {
    this.setState((prev) => ({ ...prev, queue: [] }));
  }

  async playNow(poiId: string, allQueue: AudioQueueItem[]): Promise<void> {
    const item = allQueue.find((q) => q.poi.id === poiId);
    if (!item) return;

    this.setState((prev) => ({
      ...prev,
      queue: prev.queue.filter((q) => q.poi.id !== poiId),
    }));

    await audioPlayer.unload();
    this.isProcessing = false;
    await this.loadAndPlay(item.poi, item.triggerType);
  }

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

  clearError(): void {
    this.setState((prev) => ({ ...prev, errorMessage: null, status: "idle" }));
  }

  private async logPlayHistory(
    _poi: PoiDetail,
    _triggerType: TriggerType,
  ): Promise<void> {
    // Placeholder for analytics
  }

  reset(): void {
    void audioPlayer.unload();
    this.cooldowns.clear();
    this.isProcessing = false;
    this.setState(() => initialState());
  }

  async destroy(): Promise<void> {
    this.isProcessing = false;
    this.cooldowns.clear();
    this.onFinished = undefined;
    this.setState(() => initialState());
    await audioPlayer.destroy();
  }
}

export const audioManager = new AudioManager();
export { initialState as audioInitialState };
