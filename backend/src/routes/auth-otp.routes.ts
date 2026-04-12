import { Router } from 'express';
import { authOtpController } from '../controllers/auth-otp.controller';
import { authLimiter } from '../middleware/rate-limit.middleware';
import { handleValidationErrors } from '../middleware/validate.middleware';
import { body } from 'express-validator';

const router = Router();

// Validation for send-otp
const sendOtpValidation = [
  body('email')
    .trim()
    .notEmpty().withMessage('Email is required')
    .isEmail().withMessage('Invalid email format')
    .normalizeEmail(),
];

// Validation for verify-otp
const verifyOtpValidation = [
  body('email')
    .trim()
    .notEmpty().withMessage('Email is required')
    .isEmail().withMessage('Invalid email format')
    .normalizeEmail(),
  body('otp')
    .trim()
    .notEmpty().withMessage('OTP is required')
    .isLength({ min: 6, max: 6 }).withMessage('OTP must be 6 digits'),
];

// Validation for reset-password
const resetPasswordValidation = [
  body('email')
    .trim()
    .notEmpty().withMessage('Email is required')
    .isEmail().withMessage('Invalid email format')
    .normalizeEmail(),
  body('otp')
    .trim()
    .notEmpty().withMessage('OTP is required')
    .isLength({ min: 6, max: 6 }).withMessage('OTP must be 6 digits'),
  body('newPassword')
    .notEmpty().withMessage('New password is required')
    .isLength({ min: 8 }).withMessage('Password must be at least 8 characters'),
];

// Public routes for OTP-based password reset
router.post('/send-otp', authLimiter, sendOtpValidation, handleValidationErrors, authOtpController.sendOtp);
router.post('/verify-otp', authLimiter, verifyOtpValidation, handleValidationErrors, authOtpController.verifyOtp);
router.post('/reset-password', authLimiter, resetPasswordValidation, handleValidationErrors, authOtpController.resetPassword);

export default router;
