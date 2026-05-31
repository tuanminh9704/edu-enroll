import api from './api';
import type { ApiResponse, EnrollmentForm, ExamSchedule, ExamResult, TrainingProgram, Interview, Invoice } from '../types';

const refetch = async (): Promise<EnrollmentForm> => {
  const res = await api.get<ApiResponse<EnrollmentForm>>('/enrollments');
  return res.data.data;
};

export const enrollmentService = {
  getEnrollment: refetch,

  signPolicy: async (signature_data: string): Promise<EnrollmentForm> => {
    await api.post('/enrollments/sign-policy', { signature_data });
    return refetch();
  },

  getPaymentUrl: async (): Promise<{ url: string }> => {
    const res = await api.get<ApiResponse<{ url: string }>>('/enrollments/payment-url');
    return res.data.data;
  },

  submitForm: async (data: Record<string, unknown>): Promise<EnrollmentForm> => {
    await api.post('/enrollments/form', data);
    return refetch();
  },

  getExamSchedules: async (language: string): Promise<ExamSchedule[]> => {
    const res = await api.get<ApiResponse<ExamSchedule[]>>(`/enrollments/exam-schedules?language=${encodeURIComponent(language)}`);
    return res.data.data;
  },

  registerExam: async (schedule_id: string): Promise<EnrollmentForm> => {
    await api.post('/enrollments/exam/register', { schedule_id });
    return refetch();
  },

  skipExam: async (): Promise<EnrollmentForm> => {
    await api.post('/enrollments/exam/skip');
    return refetch();
  },

  getExamResult: async (): Promise<ExamResult | null> => {
    const res = await api.get<ApiResponse<ExamResult | null>>('/enrollments/exam/result');
    return res.data.data;
  },

  advanceToStep5: async (): Promise<EnrollmentForm> => {
    await api.post('/enrollments/exam/advance');
    return refetch();
  },

  getPrograms: async (): Promise<TrainingProgram[]> => {
    const res = await api.get<ApiResponse<TrainingProgram[]>>('/enrollments/programs');
    return res.data.data;
  },

  selectProgram: async (program_id: string): Promise<EnrollmentForm> => {
    await api.post('/enrollments/program/select', { program_id });
    return refetch();
  },

  submitOriginalDocs: async (data: Record<string, unknown>): Promise<{ documentNumber: string }> => {
    const res = await api.post<ApiResponse<{ documentNumber: string }>>('/enrollments/original-docs', data);
    return res.data.data;
  },

  getInterviews: async (): Promise<Interview[]> => {
    const res = await api.get<ApiResponse<Interview[]>>('/enrollments/interviews');
    return res.data.data;
  },

  respondInterview: async (id: string, status: 'confirmed' | 'declined'): Promise<Interview> => {
    const res = await api.post<ApiResponse<Interview>>(`/enrollments/interviews/${id}/respond`, { status });
    return res.data.data;
  },

  getInvoices: async (): Promise<Invoice[]> => {
    const res = await api.get<ApiResponse<Invoice[]>>('/enrollments/invoices');
    return res.data.data;
  },
};
