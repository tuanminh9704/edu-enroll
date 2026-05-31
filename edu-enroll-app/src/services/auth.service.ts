import api from './api';
import type { ApiResponse, User } from '../types';

export const authService = {
  register: async (data: { email: string; password: string; phone: string; full_name: string; preferred_language?: string }) => {
    const res = await api.post<ApiResponse>('/auth/register', data);
    return res.data;
  },

  verifyOTP: async (email: string, code: string, type: string) => {
    const res = await api.post<ApiResponse>('/auth/verify-otp', { email, code, type });
    return res.data;
  },

  resendOTP: async (email: string, type: string) => {
    const res = await api.post<ApiResponse>('/auth/resend-otp', { email, type });
    return res.data;
  },

  login: async (email: string, password: string): Promise<{ user: User; accessToken: string; refreshToken: string }> => {
    const res = await api.post<ApiResponse<{ user: User; accessToken: string; refreshToken: string }>>('/auth/login', { email, password });
    const { user, accessToken, refreshToken } = res.data.data;
    localStorage.setItem('accessToken', accessToken);
    localStorage.setItem('refreshToken', refreshToken);
    return { user, accessToken, refreshToken };
  },

  logout: async () => {
    const refreshToken = localStorage.getItem('refreshToken');
    try {
      await api.post('/auth/logout', { refreshToken });
    } finally {
      localStorage.removeItem('accessToken');
      localStorage.removeItem('refreshToken');
    }
  },

  forgotPassword: async (email: string) => {
    const res = await api.post<ApiResponse>('/auth/forgot-password', { email });
    return res.data;
  },

  resetPassword: async (email: string, code: string, new_password: string) => {
    const res = await api.post<ApiResponse>('/auth/reset-password', { email, code, new_password });
    return res.data;
  },

  getMe: async (): Promise<User> => {
    const res = await api.get<ApiResponse<User>>('/auth/me');
    return res.data.data;
  },
};
