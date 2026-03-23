import { body } from 'express-validator';

export const touristSessionStartValidation = [
  body('tourId').optional({ nullable: true, checkFalsy: true }).isUUID().withMessage('tourId must be a valid UUID'),
  body('deviceInfo').optional({ nullable: true, checkFalsy: true }).trim().isLength({ max: 200 }).withMessage('deviceInfo must not exceed 200 characters'),
  body('offlineMode').optional().isBoolean().withMessage('offlineMode must be a boolean').toBoolean(),
  body('appVersion').optional({ nullable: true, checkFalsy: true }).trim().isLength({ max: 20 }).withMessage('appVersion must not exceed 20 characters'),
];

export const touristSessionGpsValidation = [
  body('latitude').notEmpty().withMessage('latitude is required').isFloat({ min: -90, max: 90 }).withMessage('latitude must be between -90 and 90').toFloat(),
  body('longitude').notEmpty().withMessage('longitude is required').isFloat({ min: -180, max: 180 }).withMessage('longitude must be between -180 and 180').toFloat(),
  body('accuracyMeters').optional().isFloat({ min: 0 }).withMessage('accuracyMeters must be >= 0').toFloat(),
  body('speedMps').optional().isFloat({ min: 0 }).withMessage('speedMps must be >= 0').toFloat(),
];

export const touristSessionAudioPlayValidation = [
  body('poiId').notEmpty().withMessage('poiId is required').isUUID().withMessage('poiId must be a valid UUID'),
  body('triggerType').notEmpty().withMessage('triggerType is required').isIn(['gps_enter', 'gps_proximity', 'qr_scan', 'manual']).withMessage('triggerType is invalid'),
  body('playDurationSeconds').optional().isInt({ min: 0 }).withMessage('playDurationSeconds must be >= 0').toInt(),
  body('totalDurationSeconds').optional().isInt({ min: 0 }).withMessage('totalDurationSeconds must be >= 0').toInt(),
  body('completed').optional().isBoolean().withMessage('completed must be a boolean').toBoolean(),
  body('stopReason').optional({ nullable: true, checkFalsy: true }).trim().isLength({ max: 30 }).withMessage('stopReason must not exceed 30 characters'),
];
