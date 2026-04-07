import { Audio, type AVPlaybackStatus } from "expo-av";
import { InteractionManager } from "react-native";

export type PlaybackCallback = (params: {
  isPlaying: boolean;
  positionSeconds: number;
  durationSeconds: number;
  progress: number;
  didFinish: boolean;
}) => void;

/**
 * Run a function on the main UI thread.
 *
 * On Android, expo-av's Audio.Sound methods MUST be called from the main
 * thread.  On Android 15 this is enforced more strictly and throws
 * "Player is accessed on the wrong thread" if violated.
 *
 * Strategy:
 *  - Use InteractionManager.runAfterInteractions to schedule work after
 *    the current React batch (guaranteed main thread).
 *  - Wrap in a Promise so callers can await the result.
 */
function runOnMainThread<T>(fn: () => Promise<T>): Promise<T> {
  return new Promise<T>((resolve, reject) => {
    InteractionManager.runAfterInteractions(async () => {
      try {
        const result = await fn();
        resolve(result);
      } catch (err) {
        reject(err);
      }
    });
  });
}

/**
 * AudioPlayer – thin wrapper around expo-av Audio.Sound.
 *
 * Thread Safety:
 *   All Audio.Sound operations are dispatched to the main UI thread via
 *   InteractionManager to prevent "Player is accessed on the wrong thread"
 *   crashes on Android 15+.
 *
 * Single Active Audio:
 *   Only one Sound instance exists at any time. Loading a new sound
 *   automatically unloads the previous one.
 */
class AudioPlayer {
  private sound: Audio.Sound | null = null;
  private onUpdate: PlaybackCallback | null = null;
  private isUnloading = false;
  private isDestroyed = false;

  // ─── Internal update handler ───────────────────────────────────────────────
  private handleStatusUpdate = (status: AVPlaybackStatus) => {
    if (!status.isLoaded) return;

    const positionSeconds = (status.positionMillis ?? 0) / 1000;
    const durationMs = status.durationMillis ?? 0;
    const durationSeconds = durationMs / 1000;
    const progress = durationMs > 0 ? positionSeconds / durationSeconds : 0;
    const didFinish = Boolean(status.didJustFinish);

    this.onUpdate?.({
      isPlaying: status.isPlaying,
      positionSeconds,
      durationSeconds,
      progress: Math.min(1, Math.max(0, progress)),
      didFinish,
    });
  };

  // ─── Load & play a file URI ────────────────────────────────────────────────
  async load(fileUri: string, updateCallback: PlaybackCallback): Promise<void> {
    if (this.isDestroyed) return;

    // Always unload previous sound first (Single Active Audio rule)
    await this.unload();

    this.onUpdate = updateCallback;
    this.isUnloading = false;

    await runOnMainThread(async () => {
      // Request audio mode with proper Android focus handling
      await Audio.setAudioModeAsync({
        allowsRecordingIOS: false,
        playsInSilentModeIOS: true,
        staysActiveInBackground: true,
        shouldDuckAndroid: true,
        playThroughEarpieceAndroid: false,
      });

      // Create sound — don't auto-play yet (avoid AudioFocusNotAcquiredException)
      const { sound } = await Audio.Sound.createAsync(
        { uri: fileUri },
        { shouldPlay: false, progressUpdateIntervalMillis: 500 },
        this.handleStatusUpdate,
      );

      this.sound = sound;

      // Try to play with retry for audio focus acquisition
      await this.playWithRetry(sound);
    });
  }

  // ─── Play with audio focus retry ───────────────────────────────────────────
  /**
   * Retry playAsync up to 3 times with 300ms delay between attempts.
   * Handles AudioFocusNotAcquiredException on Android where the OS
   * temporarily denies audio focus (e.g., during phone calls, transitions).
   */
  private async playWithRetry(
    sound: Audio.Sound,
    maxRetries = 3,
    delayMs = 300,
  ): Promise<void> {
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        await sound.playAsync();
        return; // Success
      } catch (err) {
        const isFocusError =
          err instanceof Error &&
          (err.message.includes("AudioFocus") ||
            err.message.includes("audio focus"));

        if (isFocusError && attempt < maxRetries) {
          // Wait and retry
          await new Promise((resolve) => setTimeout(resolve, delayMs));
          continue;
        }

        // Non-retryable error or max retries reached
        throw err;
      }
    }
  }

  // ─── Play / Resume ─────────────────────────────────────────────────────────
  async play(): Promise<void> {
    if (!this.sound || this.isDestroyed) return;
    const s = this.sound;
    await runOnMainThread(() => s.playAsync());
  }

  // ─── Pause ────────────────────────────────────────────────────────────────
  async pause(): Promise<void> {
    if (!this.sound || this.isDestroyed) return;
    const s = this.sound;
    await runOnMainThread(() => s.pauseAsync());
  }

  // ─── Stop & unload (free resources) ───────────────────────────────────────
  async unload(): Promise<void> {
    if (!this.sound || this.isUnloading || this.isDestroyed) return;
    this.isUnloading = true;
    this.onUpdate = null;
    const s = this.sound;
    this.sound = null;

    try {
      await runOnMainThread(async () => {
        try {
          await s.stopAsync();
        } catch {
          // Ignore stop errors (sound may already be stopped)
        }
        try {
          await s.unloadAsync();
        } catch {
          // Ignore unload errors (sound may already be unloaded)
        }
      });
    } catch {
      // Ignore all cleanup errors — this is best-effort resource release
    } finally {
      this.isUnloading = false;
    }
  }

  // ─── Seek to position ─────────────────────────────────────────────────────
  async seekTo(positionSeconds: number): Promise<void> {
    if (!this.sound || this.isDestroyed) return;
    const s = this.sound;
    await runOnMainThread(() => s.setPositionAsync(positionSeconds * 1000));
  }

  // ─── Safe destroy — call during app shutdown / component unmount ───────────
  /**
   * Permanently destroy the player. All subsequent calls become no-ops.
   * Use this in useEffect cleanup or app shutdown to prevent
   * "wrong thread" crashes during React unmount.
   */
  async destroy(): Promise<void> {
    if (this.isDestroyed) return;
    this.isDestroyed = true;
    this.onUpdate = null;

    if (this.sound) {
      const s = this.sound;
      this.sound = null;

      try {
        await runOnMainThread(async () => {
          try {
            await s.stopAsync();
          } catch {
            // Ignore
          }
          try {
            await s.unloadAsync();
          } catch {
            // Ignore
          }
        });
      } catch {
        // Ignore all errors during destroy
      }
    }
  }

  // ─── Query state ──────────────────────────────────────────────────────────
  get isLoaded(): boolean {
    return this.sound !== null;
  }
}

// Singleton — only one AudioPlayer in the entire app
export const audioPlayer = new AudioPlayer();
