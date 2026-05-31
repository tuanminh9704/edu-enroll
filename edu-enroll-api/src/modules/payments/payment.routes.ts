import { Router } from 'express';
import { createVnpayPayment, mockVnpay, paymentCallback } from './payment.controller';

const router = Router();

router.get('/mock-vnpay', mockVnpay);
router.get('/vnpay', createVnpayPayment);
router.get('/callback', paymentCallback);

export default router;
