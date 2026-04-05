import { Request, Response, NextFunction } from 'express';
import { StatusCodes } from 'http-status-codes';
import { sendSuccess } from '../utils/response.util';

export const uploadController = {
  uploadImage(req: Request, res: Response, next: NextFunction): void {
    try {
      if (!req.file) {
        res.status(StatusCodes.BAD_REQUEST).json({ success: false, message: 'No image file provided' });
        return;
      }
      // Build absolute URL so it passes URL validation on client and subsequent requests
      const baseUrl = `${req.protocol}://${req.get('host')}`;
      const url = `${baseUrl}/uploads/${req.file.filename}`;
      sendSuccess(res, { url, filename: req.file.filename, size: req.file.size }, 'Image uploaded successfully');
    } catch (err) { next(err); }
  },

};
