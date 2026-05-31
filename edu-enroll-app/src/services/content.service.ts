import api from './api';
import type { ApiResponse, Banner, NewsItem } from '../types';

export const contentService = {
  getBanners: async (): Promise<Banner[]> => {
    const res = await api.get<ApiResponse<Banner[]>>('/content/banners');
    return res.data.data;
  },

  getNews: async (limit = 3): Promise<NewsItem[]> => {
    const res = await api.get<ApiResponse<NewsItem[]>>(`/content/news?limit=${limit}`);
    return res.data.data;
  },
};
