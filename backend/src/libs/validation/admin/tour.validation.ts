import { body, query } from 'express-validator';
import { TOUR_STATUS } from '../../../constants/tour.constants';

const poiSelectionRules = [
  body('pois').isArray({ min: 2 }).withMessage('Tour must include at least 2 POIs'),
  body('pois.*.poiId').isUUID().withMessage('Each poiId must be a valid UUID'),
  body('pois.*.isMandatory').optional().isBoolean().withMessage('isMandatory must be a boolean').toBoolean(),
];

export const adminTourListValidation = [
  query('search').optional().trim().isLength({ max: 100 }).withMessage('Search term is too long'),
  query('status').optional().isIn(Object.values(TOUR_STATUS)).withMessage('Invalid status'),
  query('sortBy').optional().isIn(['createdAt', 'name']).withMessage('sortBy must be one of: createdAt, name'),
  query('sortOrder').optional().isIn(['asc', 'desc']).withMessage('sortOrder must be asc or desc'),
];

export const createTourValidation = [
  body('name').trim().notEmpty().withMessage('Tour name is required').isLength({ max: 200 }).withMessage('Tour name must not exceed 200 characters'),
  body('description').optional({ nullable: true, checkFalsy: true }).trim(),
  body('coverImageUrl').optional({ nullable: true, checkFalsy: true }).custom((val) => {
    if (!val) return true;
    const isFullUrl = /^https?:\/\/.+/.test(val);
    const isRelativePath = val.startsWith('/');
    if (!isFullUrl && !isRelativePath) throw new Error('Cover image URL must be a valid URL or path');
    return true;
  }),
  body('status').optional().isIn(Object.values(TOUR_STATUS)).withMessage('Invalid tour status'),
  body('estimatedDurationMinutes').optional().isInt({ min: 5, max: 720 }).withMessage('Estimated duration must be between 5 and 720 minutes').toInt(),
  ...poiSelectionRules,
];

export const updateTourValidation = [
  body('name').optional().trim().notEmpty().withMessage('Tour name cannot be empty').isLength({ max: 200 }).withMessage('Tour name must not exceed 200 characters'),
  body('description').optional({ nullable: true, checkFalsy: true }).trim(),
  body('coverImageUrl').optional({ nullable: true, checkFalsy: true }).custom((val) => {
    if (!val) return true;
    const isFullUrl = /^https?:\/\/.+/.test(val);
    const isRelativePath = val.startsWith('/');
    if (!isFullUrl && !isRelativePath) throw new Error('Cover image URL must be a valid URL or path');
    return true;
  }),
  body('status').optional().isIn(Object.values(TOUR_STATUS)).withMessage('Invalid tour status'),
  body('estimatedDurationMinutes').optional().isInt({ min: 5, max: 720 }).withMessage('Estimated duration must be between 5 and 720 minutes').toInt(),
  body('pois').optional().isArray({ min: 2 }).withMessage('Tour must include at least 2 POIs'),
  body('pois.*.poiId').optional().isUUID().withMessage('Each poiId must be a valid UUID'),
  body('pois.*.isMandatory').optional().isBoolean().withMessage('isMandatory must be a boolean').toBoolean(),
];

export const replaceTourPoisValidation = [...poiSelectionRules];

export const routePreviewValidation = [
  body('mode')
    .isIn(['walking', 'driving'])
    .withMessage('mode must be walking or driving'),
  body('waypoints')
    .isArray({ min: 2, max: 25 })
    .withMessage('waypoints must include between 2 and 25 points'),
  body('waypoints.*.latitude')
    .isFloat({ min: -90, max: 90 })
    .withMessage('Each waypoint latitude must be between -90 and 90')
    .toFloat(),
  body('waypoints.*.longitude')
    .isFloat({ min: -180, max: 180 })
    .withMessage('Each waypoint longitude must be between -180 and 180')
    .toFloat(),
];
