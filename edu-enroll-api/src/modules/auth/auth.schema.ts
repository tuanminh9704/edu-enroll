import { z } from 'zod';

const otpCodeSchema = z.string().regex(/^\d{6}$/, 'OTP gom 6 chu so');

export const registerSchema = z.object({
  email: z.string().email('Email khong hop le'),
  password: z.string().min(6, 'Mat khau toi thieu 6 ky tu'),
  phone: z.string().regex(/^(0[3|5|7|8|9])+([0-9]{8})$/, 'So dien thoai khong hop le (VD: 0901234567)'),
  full_name: z.string().min(2, 'Ho ten toi thieu 2 ky tu'),
  preferred_language: z.enum(['english', 'japanese', 'korean', 'chinese', 'french']).optional(),
});

export const verifyOTPSchema = z.object({
  email: z.string().email('Email khong hop le'),
  code: otpCodeSchema.optional(),
  otp: otpCodeSchema.optional(),
  type: z.enum(['register', 'forgot_password']),
}).refine((data) => data.code || data.otp, {
  message: 'Vui long nhap OTP',
  path: ['code'],
});

export const resendOTPSchema = z.object({
  email: z.string().email('Email khong hop le'),
  type: z.enum(['register', 'forgot_password']),
});

export const loginSchema = z.object({
  email: z.string().email('Email khong hop le'),
  password: z.string().min(1, 'Vui long nhap mat khau'),
});

export const forgotPasswordSchema = z.object({
  email: z.string().email('Email khong hop le'),
});

export const resetPasswordSchema = z.object({
  email: z.string().email('Email khong hop le'),
  code: otpCodeSchema.optional(),
  otp: otpCodeSchema.optional(),
  new_password: z.string().min(6, 'Mat khau toi thieu 6 ky tu'),
}).refine((data) => data.code || data.otp, {
  message: 'Vui long nhap OTP',
  path: ['code'],
});

export type RegisterInput = z.infer<typeof registerSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
