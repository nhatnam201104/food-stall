import { body, query } from 'express-validator';
import { POI_APPROVAL_STATUS, POI_AUDIO_MODE } from '../../../constants/poi.constants';

export const merchantPoiListValidation = [
  query('search').optional().trim().isLength({ max: 100 }).withMessage('Search term is too long'),
  query('approvalStatus').optional().isIn(Object.values(POI_APPROVAL_STATUS)).withMessage('Invalid approvalStatus'),
  query('isActive').optional().isIn(['true', 'false']).withMessage('isActive must be "true" or "false"'),
  query('sortBy').optional().isIn(['createdAt', 'name']).withMessage('sortBy must be one of: createdAt, name'),
  query('sortOrder').optional().isIn(['asc', 'desc']).withMessage('sortOrder must be asc or desc'),
];

export const createMerchantPoiValidation = [
  body('name').trim().notEmpty().withMessage('POI name is required').isLength({ max: 200 }).withMessage('POI name must not exceed 200 characters'),
  body('description').optional({ nullable: true, checkFalsy: true }).trim(),
  body('address').trim().notEmpty().withMessage('Address is required').isLength({ max: 500 }).withMessage('Address must not exceed 500 characters'),
  body('imageUrl').optional({ nullable: true, checkFalsy: true }).custom((val) => {
    if (!val) return true;
    const isFullUrl = /^https?:\/\/.+/.test(val);
    const isRelativePath = val.startsWith('/');
    if (!isFullUrl && !isRelativePath) throw new Error('Image URL must be a valid URL or path');
    return true;
  }),
  body('latitude').notEmpty().withMessage('Latitude is required').isFloat({ min: -90, max: 90 }).withMessage('Latitude must be between -90 and 90').toFloat(),
  body('longitude').notEmpty().withMessage('Longitude is required').isFloat({ min: -180, max: 180 }).withMessage('Longitude must be between -180 and 180').toFloat(),
  body('audioMode').optional().equals(POI_AUDIO_MODE.tts).withMessage('audioMode must be tts'),
  body('ttsContent').trim().notEmpty().withMessage('ttsContent is required'),
  body('isActive').optional().isBoolean().withMessage('isActive must be a boolean').toBoolean(),
];

export const updateMerchantPoiValidation = [
  body('name').optional().trim().notEmpty().withMessage('POI name cannot be empty').isLength({ max: 200 }).withMessage('POI name must not exceed 200 characters'),
  body('description').optional({ nullable: true, checkFalsy: true }).trim(),
  body('address').trim().notEmpty().withMessage('Address is required').isLength({ max: 500 }).withMessage('Address must not exceed 500 characters'),
  body('imageUrl').optional({ nullable: true, checkFalsy: true }).custom((val) => {
    if (!val) return true;
    const isFullUrl = /^https?:\/\/.+/.test(val);
    const isRelativePath = val.startsWith('/');
    if (!isFullUrl && !isRelativePath) throw new Error('Image URL must be a valid URL or path');
    return true;
  }),
  body('latitude').optional().isFloat({ min: -90, max: 90 }).withMessage('Latitude must be between -90 and 90').toFloat(),
  body('longitude').optional().isFloat({ min: -180, max: 180 }).withMessage('Longitude must be between -180 and 180').toFloat(),
  body('audioMode').optional().equals(POI_AUDIO_MODE.tts).withMessage('audioMode must be tts'),
  body('ttsContent').trim().notEmpty().withMessage('ttsContent is required'),
  body('isActive').optional().isBoolean().withMessage('isActive must be a boolean').toBoolean(),
];