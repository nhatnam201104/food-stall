import { body, query } from 'express-validator';
import { isNormalizedVietnamPhone, normalizeVietnamPhone } from '../../../utils/phone.util';

export const merchantListValidation = [
  query('search')
    .optional()
    .trim()
    .isLength({ max: 100 }).withMessage('Search term is too long'),

  // Filter by user account status: 'true' | 'false'
  query('isActive')
    .optional()
    .isIn(['true', 'false']).withMessage('isActive must be "true" or "false"'),

  query('sortBy')
    .optional()
    .isIn(['createdAt', 'shopName']).withMessage('sortBy must be one of: createdAt, shopName'),

  query('sortOrder')
    .optional()
    .isIn(['asc', 'desc']).withMessage('sortOrder must be asc or desc'),
];

export const createMerchantValidation = [
  body('fullName')
    .trim()
    .notEmpty().withMessage('Full name is required')
    .isLength({ max: 150 }).withMessage('Full name must not exceed 150 characters'),

  body('email')
    .trim()
    .notEmpty().withMessage('Email is required')
    .isEmail().withMessage('Invalid email format')
    .normalizeEmail(),

  body('password')
    .notEmpty().withMessage('Password is required')
    .isLength({ min: 8 }).withMessage('Password must be at least 8 characters'),

  body('phone')
    .optional({ nullable: true, checkFalsy: true })
    .customSanitizer((value) => normalizeVietnamPhone(value) ?? value)
    .custom((value) => {
      if (value === undefined || value === null || value === '') return true;
      if (!isNormalizedVietnamPhone(value)) {
        throw new Error('Phone number must be a valid Vietnam number (auto format +84)');
      }
      return true;
    }),

  // Accept both full URLs (http://...) and relative paths (/uploads/...)
  body('avatarUrl')
    .optional({ nullable: true, checkFalsy: true })
    .custom((val) => {
      if (!val) return true;
      // Accept full URLs or relative paths starting with /
      const isFullUrl = /^https?:\/\/.+/.test(val);
      const isRelativePath = val.startsWith('/');
      if (!isFullUrl && !isRelativePath) throw new Error('Avatar URL must be a valid URL or path');
      return true;
    }),

  body('shopName')
    .trim()
    .notEmpty().withMessage('Shop name is required')
    .isLength({ max: 200 }).withMessage('Shop name must not exceed 200 characters'),

  body('address')
    .optional({ nullable: true, checkFalsy: true })
    .trim(),

  body('contactEmail')
    .optional({ nullable: true, checkFalsy: true })
    .isEmail().withMessage('Contact email must be a valid email')
    .normalizeEmail(),
];

export const updateMerchantValidation = [
  body('shopName')
    .optional()
    .trim()
    .notEmpty().withMessage('Shop name cannot be empty')
    .isLength({ max: 200 }).withMessage('Shop name must not exceed 200 characters'),

  body('address')
    .optional({ nullable: true, checkFalsy: true })
    .trim(),

  body('contactEmail')
    .optional({ nullable: true, checkFalsy: true })
    .isEmail().withMessage('Contact email must be a valid email')
    .normalizeEmail(),

  body('logoUrl')
    .optional({ nullable: true, checkFalsy: true })
    .isURL().withMessage('Logo URL must be a valid URL'),

  body('coverImageUrl')
    .optional({ nullable: true, checkFalsy: true })
    .isURL().withMessage('Cover image URL must be a valid URL'),

  // User fields
  body('fullName')
    .optional()
    .trim()
    .notEmpty().withMessage('Full name cannot be empty')
    .isLength({ max: 150 }).withMessage('Full name must not exceed 150 characters'),

  body('phone')
    .optional({ nullable: true, checkFalsy: true })
    .customSanitizer((value) => normalizeVietnamPhone(value) ?? value)
    .custom((value) => {
      if (value === undefined || value === null || value === '') return true;
      if (!isNormalizedVietnamPhone(value)) {
        throw new Error('Phone number must be a valid Vietnam number (auto format +84)');
      }
      return true;
    }),

  body('avatarUrl')
    .optional({ nullable: true, checkFalsy: true })
    .custom((val) => {
      if (!val) return true;
      const isFullUrl = /^https?:\/\/.+/.test(val);
      const isRelativePath = val.startsWith('/');
      if (!isFullUrl && !isRelativePath) throw new Error('Avatar URL must be a valid URL or path');
      return true;
    }),

  body('isActive')
    .optional()
    .isBoolean().withMessage('isActive must be a boolean'),
];

/** Used by PATCH /:id/status — only sets isActive (activate / suspend user) */
export const merchantStatusValidation = [
  body('isActive')
    .notEmpty().withMessage('isActive is required')
    .isBoolean().withMessage('isActive must be a boolean (true = active, false = suspended)'),
];
