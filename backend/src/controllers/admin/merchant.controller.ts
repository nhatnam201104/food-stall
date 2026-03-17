import { Request, Response, NextFunction } from 'express';
import { StatusCodes } from 'http-status-codes';
import { merchantService } from '../../services/admin/merchant.service';
import { sendSuccess, sendCreated } from '../../utils/response.util';

// Helper to safely extract string ID from Express params
const getId = (req: Request): string => String(req.params['id'] ?? '');

export const merchantController = {
  async list(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { merchants, pagination } = await merchantService.list(req);
      sendSuccess(res, merchants, 'Merchants retrieved successfully', StatusCodes.OK, pagination);
    } catch (err) { next(err); }
  },

  async getById(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const merchant = await merchantService.getById(getId(req));
      sendSuccess(res, merchant);
    } catch (err) { next(err); }
  },

  async create(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const merchant = await merchantService.create(req.body);
      sendCreated(res, merchant, 'Merchant created successfully');
    } catch (err) { next(err); }
  },

  async update(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const merchant = await merchantService.update(getId(req), req.body);
      sendSuccess(res, merchant, 'Merchant updated successfully');
    } catch (err) { next(err); }
  },

  async remove(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      await merchantService.remove(getId(req));
      sendSuccess(res, null, 'Merchant deleted successfully');
    } catch (err) { next(err); }
  },

  async updateStatus(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const isActive = Boolean(req.body.isActive);
      await merchantService.updateStatus(getId(req), isActive);
      sendSuccess(res, null, `Merchant ${isActive ? 'activated' : 'suspended'} successfully`);
    } catch (err) { next(err); }
  },

  async uploadLogo(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.file) {
        res.status(StatusCodes.BAD_REQUEST).json({ success: false, message: 'No file uploaded' });
        return;
      }
      const baseUrl = `${req.protocol}://${req.get('host')}`;
      const logoUrl = `${baseUrl}/uploads/${req.file.filename}`;
      const merchant = await merchantService.updateLogo(getId(req), logoUrl);
      sendSuccess(res, { logoUrl, merchant }, 'Logo uploaded successfully');
    } catch (err) { next(err); }
  },
};
