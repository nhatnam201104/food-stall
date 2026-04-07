import { NextFunction, Request, Response } from 'express';
import { AppError } from '../errors/app-error';
import { ttsService } from '../services/tts.service';

export const ttsController = {
  async preview(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const text = typeof req.body?.text === 'string' ? req.body.text : '';
      const previewLanguage = typeof req.body?.previewLanguage === 'string' ? req.body.previewLanguage : 'vi';
      const sourceLanguage = typeof req.body?.sourceLanguage === 'string' ? req.body.sourceLanguage : 'vi';

      if (!text.trim()) {
        throw AppError.badRequest('Text is required for TTS preview');
      }

      const audioBuffer = await ttsService.generatePreviewAudio(text, previewLanguage, sourceLanguage);
      res.setHeader('Content-Type', 'audio/mpeg');
      res.setHeader('Cache-Control', 'no-store');
      res.send(audioBuffer);
    } catch (err) {
      next(err);
    }
  },
};
