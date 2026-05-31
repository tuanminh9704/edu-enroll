import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { vi, describe, it, expect, beforeEach } from 'vitest';
import EnrollmentPage from '../pages/Enrollment';
import Step1Policy from '../pages/Enrollment/steps/Step1Policy';
import Step2Payment from '../pages/Enrollment/steps/Step2Payment';

vi.mock('../services/enrollment.service', () => ({
  enrollmentService: {
    getEnrollment: vi.fn().mockResolvedValue({
      id: 'test-id',
      user_id: 'user-1',
      current_step: 1,
      status: 'step_1',
      payment_status: 'pending',
      created_at: new Date().toISOString(),
    }),
    signPolicy: vi.fn(),
    getPaymentUrl: vi.fn(),
    submitForm: vi.fn(),
    getExamSchedules: vi.fn().mockResolvedValue([]),
    registerExam: vi.fn(),
    skipExam: vi.fn(),
    getExamResult: vi.fn().mockResolvedValue(null),
    advanceToStep5: vi.fn(),
    getPrograms: vi.fn().mockResolvedValue([]),
    selectProgram: vi.fn(),
    submitOriginalDocs: vi.fn(),
  },
}));

vi.mock('../store/enrollment.store', () => ({
  useEnrollmentStore: () => ({
    enrollment: {
      id: 'test-id',
      user_id: 'user-1',
      current_step: 1,
      status: 'step_1',
      payment_status: 'pending',
      exam_required: 0,
      created_at: new Date().toISOString(),
    },
    loading: false,
    error: '',
    setEnrollment: vi.fn(),
    setLoading: vi.fn(),
    setError: vi.fn(),
  }),
}));

const renderWithRouter = (component: React.ReactElement) =>
  render(<MemoryRouter>{component}</MemoryRouter>);

describe('Enrollment Page', () => {
  it('renders enrollment steps header', async () => {
    renderWithRouter(<EnrollmentPage />);
    await screen.findByText('Hồ sơ tuyển sinh');
    expect(screen.getByText('Hoàn thành 6 bước để hoàn tất đăng ký')).toBeInTheDocument();
  });
});

describe('Step1Policy', () => {
  it('renders policy text and signature area', () => {
    renderWithRouter(<Step1Policy />);
    expect(screen.getByText('Ký cam kết chính sách')).toBeInTheDocument();
    expect(screen.getAllByText(/CHÍNH SÁCH HỌC VIÊN/i).length).toBeGreaterThan(0);
    expect(screen.getByText('Xác nhận & Tiếp theo')).toBeInTheDocument();
  });

  it('has clear signature button', () => {
    renderWithRouter(<Step1Policy />);
    expect(screen.getByText('Xóa')).toBeInTheDocument();
  });
});

describe('Step2Payment', () => {
  it('shows payment amount when not yet paid', () => {
    renderWithRouter(<Step2Payment />);
    expect(screen.getByText('50.000 ₫')).toBeInTheDocument();
    expect(screen.getByText('Thanh toán qua VNPay')).toBeInTheDocument();
  });
});
