import { z } from 'zod';

export const registerSchema = z.object({
  full_name: z.string().min(2, 'Họ tên tối thiểu 2 ký tự'),
  email: z.string().email('Email không hợp lệ'),
  phone: z.string().regex(/^(0[3|5|7|8|9])+([0-9]{8})$/, 'Số điện thoại không hợp lệ (VD: 0901234567)'),
  preferred_language: z.enum(['english', 'japanese', 'korean', 'chinese', 'french'], { required_error: 'Vui lòng chọn ngôn ngữ đăng ký' }),
  password: z.string().min(6, 'Mật khẩu tối thiểu 6 ký tự'),
  confirm_password: z.string(),
}).refine((data) => data.password === data.confirm_password, {
  message: 'Mật khẩu xác nhận không khớp',
  path: ['confirm_password'],
});

export const loginSchema = z.object({
  email: z.string().email('Email không hợp lệ'),
  password: z.string().min(1, 'Vui lòng nhập mật khẩu'),
});

export const forgotPasswordSchema = z.object({
  email: z.string().email('Email không hợp lệ'),
});

export const resetPasswordSchema = z.object({
  email: z.string().email(),
  code: z.string().length(6, 'OTP gồm 6 chữ số'),
  new_password: z.string().min(6, 'Mật khẩu tối thiểu 6 ký tự'),
  confirm_password: z.string(),
}).refine((data) => data.new_password === data.confirm_password, {
  message: 'Mật khẩu xác nhận không khớp',
  path: ['confirm_password'],
});

export type RegisterInput = z.infer<typeof registerSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
