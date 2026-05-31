import { Request, Response } from 'express';
import { authService } from './auth.service';
import { successResponse, errorResponse } from '../../utils/response';

export const register = async (req: Request, res: Response): Promise<void> => {
  try {
    const { email, password, phone, full_name, preferred_language } = req.body;
    await authService.register(email, password, phone, full_name, preferred_language);
    successResponse(res, null, 'Đăng ký thành công. Vui lòng xác thực OTP.', 201);
  } catch (err) { errorResponse(res, (err as Error).message); }
};

export const verifyOTP = async (req: Request, res: Response): Promise<void> => {
  try {
    await authService.verifyOTP(req.body.email, req.body.code || req.body.otp, req.body.type);
    successResponse(res, null, 'Xác thực OTP thành công');
  } catch (err) { errorResponse(res, (err as Error).message); }
};

export const resendOTP = async (req: Request, res: Response): Promise<void> => {
  try {
    await authService.resendOTP(req.body.email, req.body.type);
    successResponse(res, null, 'Đã gửi lại OTP');
  } catch (err) { errorResponse(res, (err as Error).message); }
};

export const login = async (req: Request, res: Response): Promise<void> => {
  try {
    const result = await authService.login(req.body.email, req.body.password);
    successResponse(res, result, 'Đăng nhập thành công');
  } catch (err) { errorResponse(res, (err as Error).message, 401); }
};

export const logout = async (req: Request, res: Response): Promise<void> => {
  try {
    if (req.body.refreshToken) await authService.logout(req.body.refreshToken);
    successResponse(res, null, 'Đăng xuất thành công');
  } catch (err) { errorResponse(res, (err as Error).message); }
};

export const refreshToken = async (req: Request, res: Response): Promise<void> => {
  try {
    const { refreshToken: token } = req.body;
    if (!token) { errorResponse(res, 'Refresh token là bắt buộc', 400); return; }
    const result = await authService.refreshAccessToken(token);
    successResponse(res, result);
  } catch (err) { errorResponse(res, (err as Error).message, 401); }
};

export const getMe = async (req: Request, res: Response): Promise<void> => {
  try {
    const user = await authService.getMe(req.user!.userId);
    successResponse(res, user);
  } catch (err) { errorResponse(res, (err as Error).message); }
};

export const forgotPassword = async (req: Request, res: Response): Promise<void> => {
  try {
    await authService.forgotPassword(req.body.email);
    successResponse(res, null, 'Đã gửi OTP đến email của bạn');
  } catch (err) { errorResponse(res, (err as Error).message); }
};

export const resetPassword = async (req: Request, res: Response): Promise<void> => {
  try {
    const { email, code, otp, new_password } = req.body;
    await authService.resetPassword(email, code || otp, new_password);
    successResponse(res, null, 'Đặt lại mật khẩu thành công');
  } catch (err) { errorResponse(res, (err as Error).message); }
};

export const updateProfile = async (req: Request, res: Response): Promise<void> => {
  try {
    const { full_name, phone } = req.body;
    const user = await authService.updateProfile(req.user!.userId, { full_name, phone });
    successResponse(res, user, 'Cập nhật hồ sơ thành công');
  } catch (err) { errorResponse(res, (err as Error).message); }
};

export const changePassword = async (req: Request, res: Response): Promise<void> => {
  try {
    const { current_password, new_password } = req.body;
    await authService.changePassword(req.user!.userId, current_password, new_password);
    successResponse(res, null, 'Đổi mật khẩu thành công');
  } catch (err) { errorResponse(res, (err as Error).message); }
};
