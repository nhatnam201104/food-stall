import type { PoiDetail } from './tourist.types';

// ─── Trigger Type ────────────────────────────────────────────────────────────
export type TriggerType = 'proximity' | 'manual' | 'qr';

// ─── Audio Playback State ─────────────────────────────────────────────────────
export type AudioStatus = 'idle' | 'loading' | 'playing' | 'paused' | 'stopped' | 'error';

// ─── Queue Item ───────────────────────────────────────────────────────────────
export interface AudioQueueItem {
  poi: PoiDetail;
  triggerType: TriggerType;
  addedAt: number; // timestamp
}

// ─── Cached Audio Entry ───────────────────────────────────────────────────────
export interface CachedAudioEntry {
  poiId: string;
  fileUri: string;       // local file:// URI on device
  createdAt: number;     // timestamp
  ttl: number;           // time-to-live in ms (default 1 hour)
}

// ─── Audio State (Zustand) ────────────────────────────────────────────────────
export interface AudioState {
  /** Currently active POI being played / loading */
  activePoi: PoiDetail | null;
  /** Current playback status */
  status: AudioStatus;
  /** Progress 0‒1 */
  progress: number;
  /** Audio duration in seconds */
  durationSeconds: number;
  /** Elapsed playback time in seconds */
  positionSeconds: number;
  /** FIFO queue of upcoming POIs */
  queue: AudioQueueItem[];
  /** Error message for graceful display */
  errorMessage: string | null;
  /** Cooldown expiry timestamp (ms) for the active POI */
  cooldownUntilMs: number | null;
}

// ─── Audio Store Actions ──────────────────────────────────────────────────────
export interface AudioActions {
  /** Main entry: trigger audio for a POI. Respects cooldown, single-active, fallback chain */
  triggerPoi: (poi: PoiDetail, triggerType: TriggerType) => Promise<void>;
  /** Resume or start playback */
  play: () => Promise<void>;
  /** Pause current playback */
  pause: () => void;
  /** Stop completely, clear activePoi */
  stop: () => void;
  /** Skip current → play next in queue */
  skipToNext: () => Promise<void>;
  /** Remove item from queue by POI id */
  removeFromQueue: (poiId: string) => void;
  /** Clear entire queue */
  clearQueue: () => void;
  /** Directly play queued item immediately (skip current) */
  playNow: (poiId: string) => Promise<void>;
  /** Reset error state */
  clearError: () => void;
}
