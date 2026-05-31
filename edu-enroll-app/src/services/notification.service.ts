import api from './api';
import type { ApiResponse, Notification } from '../types';

interface NotificationList {
  data: Notification[];
  total: number;
  unread: number;
  page: number;
  limit: number;
}

export const notificationService = {
  getAll: async (page = 1, limit = 20): Promise<NotificationList> => {
    const res = await api.get<ApiResponse<NotificationList>>(`/notifications?page=${page}&limit=${limit}`);
    return res.data.data;
  },

  getUnreadCount: async (): Promise<number> => {
    const res = await api.get<ApiResponse<{ count: number }>>('/notifications/unread-count');
    return res.data.data.count;
  },

  markRead: async (id: string): Promise<void> => {
    await api.patch(`/notifications/${id}/read`);
  },

  markAllRead: async (): Promise<void> => {
    await api.patch('/notifications/read-all');
  },
};
