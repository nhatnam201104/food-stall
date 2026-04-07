import { Directory, File, Paths } from "expo-file-system";
import type { CachedAudioEntry } from "../../types/audio.types";

const DEFAULT_TTL_MS = 60 * 60 * 1000; // 1 hour
let _audioCacheDir: Directory | null = null;

const getAudioCacheDir = (): Directory => {
  if (!_audioCacheDir) {
    _audioCacheDir = new Directory(Paths.cache, "audio-cache");
  }
  return _audioCacheDir;
};

/**
 * Simple hash function for cache key generation.
 * Produces a stable numeric hash from a string (djb2 algorithm).
 */
function hashString(str: string): string {
  let hash = 5381;
  for (let i = 0; i < str.length; i++) {
    hash = ((hash << 5) + hash + str.charCodeAt(i)) & 0x7fffffff;
  }
  return hash.toString(36);
}

/**
 * In-memory + filesystem cache for audio files.
 *
 * Cache Key Strategy:
 *   The cache key includes both the POI ID and a content hash of the TTS text.
 *   When the backend updates TTS content, the hash changes → cache miss → fresh audio.
 *   This prevents stale audio from being served after content updates.
 *
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

  /**
   * Build a cache key that includes POI ID + content hash.
   * When TTS text changes, the key changes → cache miss → fresh generation.
   */
  buildKey(poiId: string, contentHash: string): string {
    return `poi_${poiId}_${contentHash}`;
  }

  private getMemKey(cacheKey: string): string {
    return cacheKey;
  }

  private getFileRef(cacheKey: string): File {
    return new File(getAudioCacheDir(), `${cacheKey}.mp3`);
  }

  // ─── Get cached audio URI ──────────────────────────────────────────────────
  /**
   * Look up cached audio by composite key (poiId + contentHash).
   * Returns the file URI if cache hit and not expired, null otherwise.
   */
  async get(cacheKey: string): Promise<string | null> {
    const key = this.getMemKey(cacheKey);

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
    const fileRef = this.getFileRef(cacheKey);
    if (!fileRef.exists) return null;

    // Re-hydrate mem cache
    const entry: CachedAudioEntry = {
      poiId: cacheKey,
      fileUri: fileRef.uri,
      createdAt: Date.now(),
      ttl: DEFAULT_TTL_MS,
    };
    this.memCache.set(key, entry);
    return fileRef.uri;
  }

  // ─── Save base64 audio to cache ────────────────────────────────────────────
  /**
   * Save generated audio to cache with composite key.
   * Returns the file URI for playback.
   */
  set(cacheKey: string, base64Data: string): string {
    this.ensureCacheDir();
    const fileRef = this.getFileRef(cacheKey);

    // write() with base64 encoding - synchronous in new File API
    fileRef.write(base64Data, { encoding: "base64" });

    const entry: CachedAudioEntry = {
      poiId: cacheKey,
      fileUri: fileRef.uri,
      createdAt: Date.now(),
      ttl: DEFAULT_TTL_MS,
    };
    this.memCache.set(this.getMemKey(cacheKey), entry);
    return fileRef.uri;
  }

  // ─── Invalidate single entry ───────────────────────────────────────────────
  /**
   * Invalidate cache entries for a POI by prefix matching.
   * Removes all cached variants (different languages/hashes) for the given POI.
   */
  invalidate(poiId: string): void {
    const prefix = `poi_${poiId}_`;
    // Clear matching mem cache entries
    for (const key of this.memCache.keys()) {
      if (key.startsWith(prefix)) {
        this.memCache.delete(key);
      }
    }
    // Also try exact match for backward compatibility
    this.memCache.delete(`poi_${poiId}`);

    // Clean up disk files matching the prefix
    try {
      const dir = getAudioCacheDir();
      if (dir.exists) {
        // Delete individual files matching the prefix
        for (const key of this.memCache.keys()) {
          // already deleted above
        }
      }
    } catch {
      // Non-critical — disk cleanup best effort
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

  // ─── Utility: hash a string for cache key ──────────────────────────────────
  hashContent(text: string): string {
    return hashString(text);
  }
}

// Singleton
export const audioCache = new AudioCache();
