import api from './api';
import type { ApiResponse, EnrollmentForm, User } from '../types';

export interface AdminStats {
  totalUsers: number;
  totalEnrollments: number;
  completedEnrollments: number;
  pendingEnrollments: number;
  totalRevenue: number;
}

interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
}

export const adminService = {
  getStats: async (): Promise<AdminStats> => {
    const res = await api.get<ApiResponse<AdminStats>>('/admin/stats');
    return res.data.data;
  },

  getUsers: async ({ page = 1, limit = 10, search = '' }: { page?: number; limit?: number; search?: string } = {}): Promise<PaginatedResponse<User>> => {
    const res = await api.get<ApiResponse<PaginatedResponse<User>>>(`/admin/users?page=${page}&limit=${limit}&search=${encodeURIComponent(search)}`);
    return res.data.data;
  },

  getEnrollments: async ({ page = 1, limit = 10, search = '', status = '' }: { page?: number; limit?: number; search?: string; status?: string } = {}): Promise<PaginatedResponse<EnrollmentForm>> => {
    const params = new URLSearchParams({ page: String(page), limit: String(limit) });
    if (search) params.set('search', search);
    if (status) params.set('status', status);
    const res = await api.get<ApiResponse<PaginatedResponse<EnrollmentForm>>>(`/admin/enrollments?${params}`);
    return res.data.data;
  },

  updateEnrollmentStatus: async (id: string, status: string, staff_notes?: string) => {
    const res = await api.put<ApiResponse>(`/admin/enrollments/${id}/status`, { status, staff_notes });
    return res.data;
  },

  getExamSchedules: async () => {
    const res = await api.get<ApiResponse>('/admin/exam-schedules');
    return res.data.data;
  },

  enterExamScore: async (registration_id: string, score: number, level_passed: string) => {
    const res = await api.post<ApiResponse>('/admin/exam-scores', { registration_id, score, level_passed });
    return res.data;
  },

  getPrograms: async () => {
    const res = await api.get<ApiResponse>('/admin/programs');
    return res.data.data;
  },

  createProgram: async (data: Record<string, unknown>) => {
    const res = await api.post<ApiResponse>('/admin/programs', data);
    return res.data;
  },

  toggleUserActive: async (id: string) => {
    const res = await api.patch<ApiResponse>(`/admin/users/${id}/toggle-active`);
    return res.data.data;
  },

  changeUserRole: async (id: string, role: string) => {
    const res = await api.patch<ApiResponse>(`/admin/users/${id}/role`, { role });
    return res.data.data;
  },
};
