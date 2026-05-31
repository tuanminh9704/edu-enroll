import mongoose from 'mongoose';
import { User } from '../../models/User';
import { OtpCode } from '../../models/OtpCode';
import { RefreshToken } from '../../models/RefreshToken';
import { hashPassword, comparePassword } from '../../utils/hash';
import { generateOTP, getOTPExpiry, isOTPExpired } from '../../utils/otp';
import { generateAccessToken, generateRefreshToken, verifyRefreshToken } from '../../utils/jwt';
import { emailService } from '../notifications/email.service';

const findActiveOtpRecord = async (email: string, otp: string, type: 'register' | 'forgot_password') => {
  return OtpCode.collection.findOne({
    email: email.toLowerCase(),
    type,
    is_used: false,
    $or: [{ otp }, { code: otp }],
  });
};

const sendOtpInBackground = (email: string, otp: string, type: 'register' | 'forgot_password') => {
  void emailService.sendOtp(email, otp, type).catch((err) => {
    console.error(`[OTP][EMAIL_BACKGROUND_FAILED] ${email}:`, (err as Error).message);
  });
};

export class AuthService {
  async register(email: string, password: string, phone: string, fullName: string, preferredLanguage?: string) {
    const normalizedEmail = email.toLowerCase();
    const existing = await User.findOne({ email: normalizedEmail });
    if (existing?.is_active) throw new Error('Email đã được đăng ký');

    const password_hash = await hashPassword(password);
    const user = existing || await User.create({
      email: normalizedEmail,
      password_hash,
      phone,
      full_name: fullName,
      preferred_language: preferredLanguage,
    });

    if (existing) {
      existing.password_hash = password_hash;
      existing.phone = phone;
      existing.full_name = fullName;
      existing.preferred_language = preferredLanguage;
      await existing.save();
    }

    const otp = generateOTP();
    await OtpCode.updateMany({ email: normalizedEmail, type: 'register', is_used: false }, { is_used: true });
    await OtpCode.create({ email: normalizedEmail, otp, type: 'register', expires_at: getOTPExpiry() });
    sendOtpInBackground(normalizedEmail, otp, 'register');
    return user;
  }

  async verifyOTP(email: string, otp: string, type: 'register' | 'forgot_password') {
    const normalizedOtp = String(otp || '').trim();
    if (!/^\d{6}$/.test(normalizedOtp)) throw new Error('OTP không hợp lệ');

    const record = await findActiveOtpRecord(email, normalizedOtp, type);
    if (!record) throw new Error('OTP không hợp lệ');
    if (isOTPExpired(record.expires_at)) throw new Error('OTP đã hết hạn');

    await OtpCode.updateOne({ _id: record._id }, { is_used: true });
    if (type === 'register') {
      await User.updateOne({ email: email.toLowerCase() }, { is_active: true });
    }
  }

  async resendOTP(email: string, type: 'register' | 'forgot_password') {
    const normalizedEmail = email.toLowerCase();
    const recent = await OtpCode.findOne({ email: normalizedEmail, type, is_used: false })
      .sort({ created_at: -1 });
    if (recent) {
      const diff = Date.now() - new Date(recent.created_at).getTime();
      if (diff < 30_000) throw new Error(`Vui lòng chờ ${Math.ceil((30_000 - diff) / 1000)}s trước khi gửi lại`);
    }
    const otp = generateOTP();
    await OtpCode.create({ email: normalizedEmail, otp, type, expires_at: getOTPExpiry() });
    sendOtpInBackground(normalizedEmail, otp, type);
  }

  async login(email: string, password: string) {
    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user) throw new Error('Email hoặc mật khẩu không đúng');
    if (!user.is_active) throw new Error('Tài khoản chưa được xác thực OTP');

    const valid = await comparePassword(password, user.password_hash);
    if (!valid) throw new Error('Email hoặc mật khẩu không đúng');

    const userId = (user._id as mongoose.Types.ObjectId).toString();
    const accessToken = generateAccessToken(userId, user.role);
    const refreshToken = generateRefreshToken(userId, user.role);

    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
    await RefreshToken.create({ user_id: user._id, token: refreshToken, expires_at: expiresAt });

    return {
      user: { id: userId, email: user.email, full_name: user.full_name, phone: user.phone, role: user.role, preferred_language: user.preferred_language },
      accessToken,
      refreshToken,
    };
  }

  async logout(refreshToken: string) {
    await RefreshToken.deleteOne({ token: refreshToken });
  }

  async refreshAccessToken(token: string) {
    const payload = verifyRefreshToken(token);
    const record = await RefreshToken.findOne({ token });
    if (!record) throw new Error('Refresh token không hợp lệ');

    const user = await User.findById(payload.userId);
    if (!user || !user.is_active) throw new Error('Tài khoản không hợp lệ');
    return { accessToken: generateAccessToken(payload.userId, user.role) };
  }

  async getMe(userId: string) {
    const user = await User.findById(userId).select('-password_hash');
    if (!user) throw new Error('Người dùng không tồn tại');
    return user;
  }

  async forgotPassword(email: string) {
    const normalizedEmail = email.toLowerCase();
    const user = await User.findOne({ email: normalizedEmail });
    if (!user) throw new Error('Email không tồn tại trong hệ thống');

    const recent = await OtpCode.findOne({ email: normalizedEmail, type: 'forgot_password', is_used: false })
      .sort({ created_at: -1 });
    if (recent) {
      const diff = Date.now() - new Date(recent.created_at).getTime();
      if (diff < 30_000) throw new Error(`Vui lòng chờ ${Math.ceil((30_000 - diff) / 1000)}s`);
    }

    const otp = generateOTP();
    await OtpCode.create({ email: normalizedEmail, otp, type: 'forgot_password', expires_at: getOTPExpiry() });
    sendOtpInBackground(normalizedEmail, otp, 'forgot_password');
  }

  async resetPassword(email: string, otp: string, newPassword: string) {
    const normalizedOtp = String(otp || '').trim();
    if (!/^\d{6}$/.test(normalizedOtp)) throw new Error('OTP không hợp lệ');

    const record = await findActiveOtpRecord(email, normalizedOtp, 'forgot_password');
    if (!record) throw new Error('OTP không hợp lệ');
    if (isOTPExpired(record.expires_at)) throw new Error('OTP đã hết hạn');

    const password_hash = await hashPassword(newPassword);
    const user = await User.findOneAndUpdate({ email: email.toLowerCase() }, { password_hash });
    await OtpCode.updateOne({ _id: record._id }, { is_used: true });
    if (user) await RefreshToken.deleteMany({ user_id: user._id });
  }

  async updateProfile(userId: string, data: { full_name?: string; phone?: string }) {
    const update: Record<string, string> = {};
    if (data.full_name?.trim()) update.full_name = data.full_name.trim();
    if (data.phone?.trim()) update.phone = data.phone.trim();
    const user = await User.findByIdAndUpdate(userId, update, { new: true }).select('-password_hash');
    if (!user) throw new Error('Người dùng không tồn tại');
    return user;
  }

  async changePassword(userId: string, currentPassword: string, newPassword: string) {
    const user = await User.findById(userId);
    if (!user) throw new Error('Người dùng không tồn tại');
    const valid = await comparePassword(currentPassword, user.password_hash);
    if (!valid) throw new Error('Mật khẩu hiện tại không đúng');
    if (newPassword.length < 6) throw new Error('Mật khẩu mới tối thiểu 6 ký tự');
    user.password_hash = await hashPassword(newPassword);
    await user.save();
    await RefreshToken.deleteMany({ user_id: user._id });
  }
}

export const authService = new AuthService();
