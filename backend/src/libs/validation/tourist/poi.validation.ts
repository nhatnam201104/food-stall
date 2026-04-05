import { query } from 'express-validator';
import { POI_LANGUAGE_CODES } from '../../../constants/poi.constants';

export const touristPoiInViewValidation = [
  query('minLat').notEmpty().withMessage('minLat is required').isFloat({ min: -90, max: 90 }).withMessage('minLat must be between -90 and 90').toFloat(),
  query('maxLat').notEmpty().withMessage('maxLat is required').isFloat({ min: -90, max: 90 }).withMessage('maxLat must be between -90 and 90').toFloat(),
  query('minLng').notEmpty().withMessage('minLng is required').isFloat({ min: -180, max: 180 }).withMessage('minLng must be between -180 and 180').toFloat(),
  query('maxLng').notEmpty().withMessage('maxLng is required').isFloat({ min: -180, max: 180 }).withMessage('maxLng must be between -180 and 180').toFloat(),
];

export const touristPoiNearbyValidation = [
  query('lat').notEmpty().withMessage('lat is required').isFloat({ min: -90, max: 90 }).withMessage('lat must be between -90 and 90').toFloat(),
  query('lng').notEmpty().withMessage('lng is required').isFloat({ min: -180, max: 180 }).withMessage('lng must be between -180 and 180').toFloat(),
  query('radius').notEmpty().withMessage('radius is required').isFloat({ min: 10, max: 5000 }).withMessage('radius must be between 10 and 5000 meters').toFloat(),
];

export const touristPoiAudioValidation = [
  query('language')
    .optional()
    .isIn(Object.values(POI_LANGUAGE_CODES))
    .withMessage('language must be one of: vi, en, zh'),
];
