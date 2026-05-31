import api from '../services/api';

export interface ImportResult {
  created: number;
  updated: number;
  skipped: number;
  errors?: string[];
}

export const downloadAdminCsv = async (resource: string, filename: string) => {
  const res = await api.get(`/admin/export/${resource}`, { responseType: 'blob' });
  const url = URL.createObjectURL(res.data as Blob);
  const link = document.createElement('a');
  link.href = url;
  link.setAttribute('download', filename);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
};

export const importAdminCsv = async (resource: string, file: File, extraFields: Record<string, string> = {}): Promise<ImportResult> => {
  const formData = new FormData();
  formData.append('file', file);
  Object.entries(extraFields).forEach(([key, value]) => formData.append(key, value));
  const res = await api.post<{ data: ImportResult }>(`/admin/import/${resource}`, formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
  return res.data.data;
};

export const formatImportResult = (result: ImportResult) =>
  `Tạo ${result.created}, cập nhật ${result.updated}, bỏ qua ${result.skipped}`;
