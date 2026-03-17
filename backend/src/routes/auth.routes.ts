import { Router } from 'express';
import { authController } from '../controllers/auth.controller';
import { authenticate } from '../middleware/auth.middleware';
import { handleValidationErrors } from '../middleware/validate.middleware';
import { authLimiter } from '../middleware/rate-limit.middleware';
import {
  registerValidation,
  loginValidation,
  updateProfileValidation,
  changePasswordValidation,
  forgotPasswordValidation,
  resetPasswordValidation,
} from '../libs/validation/auth.validation';

const router = Router();

// Public routes
router.post('/register', authLimiter, registerValidation, handleValidationErrors, authController.register);
router.post('/login', authLimiter, loginValidation, handleValidationErrors, authController.login);
router.post('/forgot-password', authLimiter, forgotPasswordValidation, handleValidationErrors, authController.forgotPassword);
router.post('/reset-password', resetPasswordValidation, handleValidationErrors, authController.resetPassword);

// Protected routes (require JWT)
router.post('/logout', authenticate, authController.logout);
router.get('/me', authenticate, authController.me);
router.put('/profile', authenticate, updateProfileValidation, handleValidationErrors, authController.updateProfile);
router.put('/change-password', authenticate, changePasswordValidation, handleValidationErrors, authController.changePassword);

export default router;
