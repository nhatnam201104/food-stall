import fs from 'fs';
import path from 'path';
import { randomUUID } from 'crypto';
import { config } from '../config';

const ensureUploadDir = (): string => {
  const uploadDir = path.resolve(process.cwd(), config.upload.dir);
  if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
  }
  return uploadDir;
};

const normalizeFileNamePart = (value: string): string => value.toLowerCase().replace(/[^a-z0-9_-]/g, '-');

const buildAudioFileName = (poiId: string, languageCode: string): string => {
  const ts = Date.now();
  const poiPart = normalizeFileNamePart(poiId);
  const langPart = normalizeFileNamePart(languageCode);
  return `poi-${poiPart}-${langPart}-${ts}-${randomUUID()}.mp3`;
};

export const savePoiAudioBuffer = (
  audioBuffer: Buffer,
  poiId: string,
  languageCode: string,
): { audioUrl: string; fileSizeBytes: bigint; filePath: string } => {
  const uploadDir = ensureUploadDir();
  const fileName = buildAudioFileName(poiId, languageCode);
  const filePath = path.join(uploadDir, fileName);

  fs.writeFileSync(filePath, audioBuffer);

  return {
    audioUrl: `/uploads/${fileName}`,
    fileSizeBytes: BigInt(audioBuffer.byteLength),
    filePath,
  };
};

const resolveFilePathFromAudioUrl = (audioUrl: string): string | null => {
  const normalized = audioUrl.trim();
  if (!normalized) return null;

  try {
    if (/^https?:\/\//i.test(normalized)) {
      const parsed = new URL(normalized);
      const pathname = parsed.pathname || '';
      const prefix = `/${config.upload.dir}/`;
      if (!pathname.startsWith(prefix)) return null;
      const fileName = pathname.slice(prefix.length);
      if (!fileName) return null;
      return path.resolve(process.cwd(), config.upload.dir, fileName);
    }
  } catch {
    return null;
  }

  const clean = normalized.replace(/\\/g, '/');
  const relativePrefix = `/${config.upload.dir}/`;
  if (clean.startsWith(relativePrefix)) {
    const fileName = clean.slice(relativePrefix.length);
    if (!fileName) return null;
    return path.resolve(process.cwd(), config.upload.dir, fileName);
  }

  const shortPrefix = '/uploads/';
  if (clean.startsWith(shortPrefix)) {
    const fileName = clean.slice(shortPrefix.length);
    if (!fileName) return null;
    return path.resolve(process.cwd(), config.upload.dir, fileName);
  }

  return null;
};

export const deletePoiAudioFileByUrl = (audioUrl?: string | null): void => {
  if (!audioUrl) return;
  const filePath = resolveFilePathFromAudioUrl(audioUrl);
  if (!filePath) return;

  try {
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }
  } catch {
    // no-op cleanup best effort
  }
};

export const readPoiAudioBufferByUrl = (audioUrl?: string | null): Buffer | null => {
  if (!audioUrl) return null;
  const filePath = resolveFilePathFromAudioUrl(audioUrl);
  if (!filePath) return null;

  try {
    if (!fs.existsSync(filePath)) return null;
    return fs.readFileSync(filePath);
  } catch {
    return null;
  }
};
