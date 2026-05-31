import crypto from 'crypto';
import { Request, Response } from 'express';
import { EnrollmentForm } from '../../models/EnrollmentForm';
import { enrollmentService } from '../enrollments/enrollment.service';
import { config } from '../../configs';

const PAYMENT_AMOUNT = 50000;

const pad = (value: number) => String(value).padStart(2, '0');

const formatVnpDate = (date: Date) => {
  return [
    date.getFullYear(),
    pad(date.getMonth() + 1),
    pad(date.getDate()),
    pad(date.getHours()),
    pad(date.getMinutes()),
    pad(date.getSeconds()),
  ].join('');
};

const sortParams = (params: Record<string, string | number | undefined>) => {
  return Object.keys(params)
    .filter((key) => params[key] !== undefined && params[key] !== '')
    .sort()
    .reduce<Record<string, string>>((acc, key) => {
      acc[key] = String(params[key]);
      return acc;
    }, {});
};

const stringifyParams = (params: Record<string, string>) => {
  return Object.entries(params)
    .map(([key, value]) => `${encodeURIComponent(key)}=${encodeURIComponent(value).replace(/%20/g, '+')}`)
    .join('&');
};

const signParams = (params: Record<string, string>) => {
  return crypto.createHmac('sha512', config.vnpay.hashSecret).update(stringifyParams(params), 'utf-8').digest('hex');
};

const getClientIp = (req: Request) => {
  const forwarded = req.headers['x-forwarded-for'];
  if (typeof forwarded === 'string') return forwarded.split(',')[0].trim();
  return req.socket.remoteAddress?.replace('::ffff:', '') || '127.0.0.1';
};

export const createVnpayPayment = async (req: Request, res: Response): Promise<void> => {
  try {
    const { enrollmentId } = req.query as { enrollmentId?: string };
    if (!enrollmentId) {
      res.status(400).json({ success: false, message: 'Missing enrollmentId' });
      return;
    }

    const enrollment = await EnrollmentForm.findById(enrollmentId);
    if (!enrollment) {
      res.status(404).json({ success: false, message: 'Hồ sơ không tồn tại' });
      return;
    }
    if (enrollment.payment_status === 'success') {
      res.redirect(`${config.frontendUrl}/tuyen-sinh?payment=success&enrollmentId=${enrollmentId}`);
      return;
    }

    const now = new Date();
    const expire = new Date(now.getTime() + 15 * 60 * 1000);
    const txnRef = `${enrollmentId}-${Date.now()}`;
    const params = sortParams({
      vnp_Version: '2.1.0',
      vnp_Command: 'pay',
      vnp_TmnCode: config.vnpay.tmnCode,
      vnp_Amount: PAYMENT_AMOUNT * 100,
      vnp_CurrCode: 'VND',
      vnp_TxnRef: txnRef,
      vnp_OrderInfo: `Thanh toan le phi ho so ${enrollmentId}`,
      vnp_OrderType: 'other',
      vnp_Locale: 'vn',
      vnp_ReturnUrl: config.vnpay.returnUrl,
      vnp_IpAddr: getClientIp(req),
      vnp_CreateDate: formatVnpDate(now),
      vnp_ExpireDate: formatVnpDate(expire),
    });

    const secureHash = signParams(params);
    res.redirect(`${config.vnpay.url}?${stringifyParams({ ...params, vnp_SecureHash: secureHash })}`);
  } catch (err) {
    res.status(500).json({ success: false, message: (err as Error).message });
  }
};

export const mockVnpay = async (req: Request, res: Response): Promise<void> => {
  const { enrollmentId } = req.query as { enrollmentId: string };
  if (!enrollmentId) { res.status(400).json({ error: 'Missing enrollmentId' }); return; }
  try {
    await enrollmentService.handlePaymentCallback(enrollmentId, true);
    res.redirect(`${config.frontendUrl}/tuyen-sinh?payment=success&enrollmentId=${enrollmentId}`);
  } catch {
    res.redirect(`${config.frontendUrl}/tuyen-sinh?payment=failed`);
  }
};

export const paymentCallback = async (req: Request, res: Response): Promise<void> => {
  const query = { ...req.query } as Record<string, string>;
  const secureHash = query.vnp_SecureHash;
  delete query.vnp_SecureHash;
  delete query.vnp_SecureHashType;

  const signed = signParams(sortParams(query));
  const validSignature = Boolean(secureHash && signed.toLowerCase() === secureHash.toLowerCase());
  const success = validSignature && query.vnp_ResponseCode === '00' && query.vnp_TransactionStatus === '00';
  const enrollmentId = String(query.vnp_TxnRef || '').split('-')[0];

  try {
    await enrollmentService.handlePaymentCallback(enrollmentId, success, query.vnp_TransactionNo || query.vnp_BankTranNo);
    res.redirect(`${config.frontendUrl}/tuyen-sinh?payment=success&enrollmentId=${enrollmentId}`);
  } catch {
    res.redirect(`${config.frontendUrl}/tuyen-sinh?payment=failed`);
  }
};
