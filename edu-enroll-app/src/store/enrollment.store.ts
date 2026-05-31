import { create } from 'zustand';
import type { EnrollmentForm } from '../types';

interface EnrollmentState {
  enrollment: EnrollmentForm | null;
  loading: boolean;
  error: string;
  setEnrollment: (enrollment: EnrollmentForm | null) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string) => void;
  updateEnrollment: (data: Partial<EnrollmentForm>) => void;
}

export const useEnrollmentStore = create<EnrollmentState>((set) => ({
  enrollment: null,
  loading: false,
  error: '',
  setEnrollment: (enrollment) => set({ enrollment }),
  setLoading: (loading) => set({ loading }),
  setError: (error) => set({ error }),
  updateEnrollment: (data) =>
    set((state) => ({
      enrollment: state.enrollment ? { ...state.enrollment, ...data } : null,
    })),
}));
