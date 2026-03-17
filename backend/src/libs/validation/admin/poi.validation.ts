import { body, query } from 'express-validator';
import { POI_APPROVAL_STATUS } from '../../../constants/poi.constants';

export const adminPoiListValidation = [
  query('search').optional().trim().isLength({ max: 100 }).withMessage('Search term is too long'),
  query('approvalStatus').optional().isIn(Object.values(POI_APPROVAL_STATUS)).withMessage('Invalid approvalStatus'),
  query('isActive').optional().isIn(['true', 'false']).withMessage('isActive must be "true" or "false"'),
  query('merchantId').optional().isUUID().withMessage('merchantId must be a valid UUID'),
  query('sortBy').optional().isIn(['createdAt', 'name']).withMessage('sortBy must be one of: createdAt, name'),
  query('sortOrder').optional().isIn(['asc', 'desc']).withMessage('sortOrder must be asc or desc'),
];

export const approvePoiValidation = [
  body('reviewNote').optional({ nullable: true, checkFalsy: true }).trim(),
];

export const rejectPoiValidation = [
  body('reviewNote').trim().notEmpty().withMessage('reviewNote is required when rejecting POI'),
];

export const adminPoiActiveValidation = [
  body('isActive').notEmpty().withMessage('isActive is required').isBoolean().withMessage('isActive must be a boolean').toBoolean(),
];
