import { Directory, File, Paths } from 'expo-file-system';
import type { CachedAudioEntry } from '../../types/audio.types';

const DEFAULT_TTL_MS = 60 * 60 * 1000; // 1 hour
let _audioCacheDir: Directory | null = null;

const getAudioCacheDir = (): Directory => {
  if (!_audioCacheDir) {
    _audioCacheDir = new Directory(Paths.cache, 'audio-cache');
  }
  return _audioCacheDir;
};

/**
 * In-memory + filesystem cache for audio files.
 * Cache First principle: always check before generating TTS.
 * Uses new expo-file-system File/Directory API.
 */
class AudioCache {
  private memCache = new Map<string, CachedAudioEntry>();

  // ─── Ensure cache dir exists ───────────────────────────────────────────────
  private ensureCacheDir(): void {
    const dir = getAudioCacheDir();
    if (!dir.exists) {
      dir.create({ intermediates: true, idempotent: true });
    }
  }

  // ─── Key / path helpers ────────────────────────────────────────────────────
  private getMemKey(poiId: string, language: string): string {
    return `poi_${poiId}_${language}`;
  }

  private getFileRef(poiId: string, language: string): File {
    return new File(getAudioCacheDir(), `poi_${poiId}_${language}.mp3`);
  }

  // ─── Get cached audio URI ──────────────────────────────────────────────────
  async get(poiId: string, language: string): Promise<string | null> {
    const key = this.getMemKey(poiId, language);

    // 1. In-memory hit → verify disk file still present
    const memEntry = this.memCache.get(key);
    if (memEntry && Date.now() < memEntry.createdAt + memEntry.ttl) {
      const f = new File(memEntry.fileUri);
      if (f.exists) return memEntry.fileUri;
      this.memCache.delete(key);
    } else if (memEntry) {
      this.memCache.delete(key);
    }

    // 2. Disk check
    const fileRef = this.getFileRef(poiId, language);
    if (!fileRef.exists) return null;

    // Re-hydrate mem cache
    const entry: CachedAudioEntry = {
      poiId,
      language,
      fileUri: fileRef.uri,
      createdAt: Date.now(),
      ttl: DEFAULT_TTL_MS,
    };
    this.memCache.set(key, entry);
    return fileRef.uri;
  }

  // ─── Save base64 audio to cache ────────────────────────────────────────────
  set(poiId: string, language: string, base64Data: string): string {
    this.ensureCacheDir();
    const fileRef = this.getFileRef(poiId, language);

    // write() with base64 encoding - synchronous in new File API
    fileRef.write(base64Data, { encoding: 'base64' });

    const entry: CachedAudioEntry = {
      poiId,
      language,
      fileUri: fileRef.uri,
      createdAt: Date.now(),
      ttl: DEFAULT_TTL_MS,
    };
    this.memCache.set(this.getMemKey(poiId, language), entry);
    return fileRef.uri;
  }

  // ─── Invalidate single entry ───────────────────────────────────────────────
  invalidate(poiId: string, language: string): void {
    this.memCache.delete(this.getMemKey(poiId, language));
    const fileRef = this.getFileRef(poiId, language);
    if (fileRef.exists) {
      fileRef.delete();
    }
  }

  // ─── Clear all cache ───────────────────────────────────────────────────────
  clearAll(): void {
    this.memCache.clear();
    const dir = getAudioCacheDir();
    if (dir.exists) {
      dir.delete();
    }
  }
}

// Singleton
export const audioCache = new AudioCache();
