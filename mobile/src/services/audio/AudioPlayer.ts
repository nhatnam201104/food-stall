import { Audio, type AVPlaybackStatus } from 'expo-av';

export type PlaybackCallback = (params: {
  isPlaying: boolean;
  positionSeconds: number;
  durationSeconds: number;
  progress: number;
  didFinish: boolean;
}) => void;

/**
 * AudioPlayer – thin wrapper around expo-av Audio.Sound.
 * Provides play / pause / stop / resume with a single active sound instance.
 * All state updates flow through the onPlaybackUpdate callback.
 */
class AudioPlayer {
  private sound: Audio.Sound | null = null;
  private onUpdate: PlaybackCallback | null = null;
  private isUnloading = false;

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
    // Always unload previous sound first (Single Active Audio rule)
    await this.unload();

    this.onUpdate = updateCallback;
    this.isUnloading = false;

    // Request audio mode (important for iOS)
    await Audio.setAudioModeAsync({
      allowsRecordingIOS: false,
      playsInSilentModeIOS: true,
      staysActiveInBackground: false,
      shouldDuckAndroid: true,
    });

    const { sound } = await Audio.Sound.createAsync(
      { uri: fileUri },
      { shouldPlay: true, progressUpdateIntervalMillis: 500 },
      this.handleStatusUpdate,
    );

    this.sound = sound;
  }

  // ─── Play / Resume ─────────────────────────────────────────────────────────
  async play(): Promise<void> {
    if (!this.sound) return;
    await this.sound.playAsync();
  }

  // ─── Pause ────────────────────────────────────────────────────────────────
  async pause(): Promise<void> {
    if (!this.sound) return;
    await this.sound.pauseAsync();
  }

  // ─── Stop & unload (free resources) ───────────────────────────────────────
  async unload(): Promise<void> {
    if (!this.sound || this.isUnloading) return;
    this.isUnloading = true;
    this.onUpdate = null;
    const s = this.sound;
    this.sound = null;
    try {
      await s.stopAsync();
      await s.unloadAsync();
    } catch {
      // Ignore cleanup errors
    }
    this.isUnloading = false;
  }

  // ─── Seek to position ─────────────────────────────────────────────────────
  async seekTo(positionSeconds: number): Promise<void> {
    if (!this.sound) return;
    await this.sound.setPositionAsync(positionSeconds * 1000);
  }

  // ─── Query state ──────────────────────────────────────────────────────────
  get isLoaded(): boolean {
    return this.sound !== null;
  }
}

// Singleton — only one AudioPlayer in the entire app
export const audioPlayer = new AudioPlayer();
