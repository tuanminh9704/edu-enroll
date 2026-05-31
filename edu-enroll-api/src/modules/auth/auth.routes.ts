import { Router } from 'express';
import { authenticate } from '../../middlewares/auth.middleware';
import { validate } from '../../middlewares/validate.middleware';
import * as schemas from './auth.schema';
import * as controller from './auth.controller';

const router = Router();

router.post('/register', validate(schemas.registerSchema), controller.register);
router.post('/verify-otp', validate(schemas.verifyOTPSchema), controller.verifyOTP);
router.post('/resend-otp', validate(schemas.resendOTPSchema), controller.resendOTP);
router.post('/login', validate(schemas.loginSchema), controller.login);
router.post('/logout', authenticate, controller.logout);
router.post('/refresh-token', controller.refreshToken);
router.post('/forgot-password', validate(schemas.forgotPasswordSchema), controller.forgotPassword);
router.post('/reset-password', validate(schemas.resetPasswordSchema), controller.resetPassword);
router.get('/me', authenticate, controller.getMe);
router.put('/profile', authenticate, controller.updateProfile);
router.put('/change-password', authenticate, controller.changePassword);

export default router;
