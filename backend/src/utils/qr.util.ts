import fs from 'fs';
import path from 'path';
import { randomUUID } from 'crypto';
import QRCode from 'qrcode';
import { config } from '../config';

const ensureUploadDir = async (): Promise<string> => {
  const uploadDir = path.resolve(process.cwd(), config.upload.dir);
  await fs.promises.mkdir(uploadDir, { recursive: true });
  return uploadDir;
};

export const generatePoiQrCode = async (poiId: string): Promise<string> => {
  const fileName = `qr-${randomUUID()}.png`;
  const uploadDir = await ensureUploadDir();
  const filePath = path.join(uploadDir, fileName);

  const qrPayload = JSON.stringify({ poiId });
  await QRCode.toFile(filePath, qrPayload, {
    type: 'png',
    errorCorrectionLevel: 'M',
    margin: 1,
    width: 512,
  });

  return `${config.publicApiBaseUrl}/uploads/${fileName}`;
};
