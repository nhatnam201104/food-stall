import { body } from 'express-validator';
import { isNormalizedVietnamPhone, normalizeVietnamPhone } from '../../utils/phone.util';

export const registerValidation = [
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

  body('confirmPassword')
    .notEmpty().withMessage('Confirm password is required')
    .custom((value, { req }) => {
      if (value !== req.body.password) {
        throw new Error('Passwords do not match');
      }
      return true;
    }),

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

  body('shopName')
    .trim()
    .notEmpty().withMessage('Shop name is required')
    .isLength({ max: 200 }).withMessage('Shop name must not exceed 200 characters'),

  body('address')
    .optional({ nullable: true, checkFalsy: true })
    .trim(),

  body('avatarUrl')
    .optional({ nullable: true, checkFalsy: true })
    .custom((val) => {
      if (!val) return true;
      const isFullUrl = /^https?:\/\/.+/.test(val);
      const isRelativePath = val.startsWith('/');
      if (!isFullUrl && !isRelativePath) throw new Error('Avatar URL must be a valid URL or path');
      return true;
    }),
];

export const loginValidation = [
  body('email')
    .trim()
    .notEmpty().withMessage('Email is required')
    .isEmail().withMessage('Invalid email format')
    .normalizeEmail(),

  body('password')
    .notEmpty().withMessage('Password is required'),
];

export const updateProfileValidation = [
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
    .isEmail().withMessage('Contact email must be valid')
    .normalizeEmail(),

  body('avatarUrl')
    .optional({ nullable: true, checkFalsy: true })
    .custom((val) => {
      if (!val) return true;
      const isFullUrl = /^https?:\/\/.+/.test(val);
      const isRelativePath = val.startsWith('/');
      if (!isFullUrl && !isRelativePath) throw new Error('Avatar URL must be a valid URL or path');
      return true;
    }),
];

export const changePasswordValidation = [
  body('currentPassword')
    .notEmpty().withMessage('Current password is required'),

  body('newPassword')
    .notEmpty().withMessage('New password is required')
    .isLength({ min: 8 }).withMessage('New password must be at least 8 characters')
    .custom((value, { req }) => {
      if (value === req.body.currentPassword) {
        throw new Error('New password must be different from current password');
      }
      return true;
    }),

  body('confirmNewPassword')
    .notEmpty().withMessage('Confirm new password is required')
    .custom((value, { req }) => {
      if (value !== req.body.newPassword) {
        throw new Error('Passwords do not match');
      }
      return true;
    }),
];

export const forgotPasswordValidation = [
  body('email')
    .trim()
    .notEmpty().withMessage('Email is required')
    .isEmail().withMessage('Invalid email format')
    .normalizeEmail(),
];

export const resetPasswordValidation = [
  body('token')
    .trim()
    .notEmpty().withMessage('Reset token is required'),

  body('newPassword')
    .notEmpty().withMessage('New password is required')
    .isLength({ min: 8 }).withMessage('Password must be at least 8 characters'),

  body('confirmNewPassword')
    .notEmpty().withMessage('Confirm password is required')
    .custom((value, { req }) => {
      if (value !== req.body.newPassword) {
        throw new Error('Passwords do not match');
      }
      return true;
    }),
];
