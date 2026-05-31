import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { vi, describe, it, expect, beforeEach } from 'vitest';
import Login from '../pages/Auth/Login';
import Register from '../pages/Auth/Register';
import OTPVerification from '../pages/Auth/OTPVerification';

vi.mock('../services/auth.service', () => ({
  authService: {
    login: vi.fn(),
    register: vi.fn(),
    verifyOTP: vi.fn(),
    resendOTP: vi.fn(),
    forgotPassword: vi.fn(),
    resetPassword: vi.fn(),
  },
}));

vi.mock('../store/auth.store', () => ({
  useAuthStore: () => ({
    login: vi.fn(),
    user: null,
    isAuthenticated: false,
  }),
}));

const renderWithRouter = (component: React.ReactElement, initialEntries = ['/']) =>
  render(<MemoryRouter initialEntries={initialEntries}>{component}</MemoryRouter>);

describe('Login Page', () => {
  it('renders login form', () => {
    renderWithRouter(<Login />);
    expect(screen.getByText('Trung tâm ngôn ngữ Apex')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('email@example.com')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('Nhập mật khẩu')).toBeInTheDocument();
  });

  it('shows validation error for empty fields', async () => {
    renderWithRouter(<Login />);
    const submitBtn = screen.getByRole('button', { name: /đăng nhập/i });
    fireEvent.click(submitBtn);
    await waitFor(() => {
      expect(screen.queryByText(/email/i)).toBeDefined();
    });
  });

  it('has forgot password link', () => {
    renderWithRouter(<Login />);
    expect(screen.getByText('Quên mật khẩu?')).toBeInTheDocument();
  });

  it('has register link', () => {
    renderWithRouter(<Login />);
    expect(screen.getByText('Đăng ký tuyển sinh')).toBeInTheDocument();
  });
});

describe('Register Page', () => {
  it('renders registration form', () => {
    renderWithRouter(<Register />);
    expect(screen.getByText('Đăng ký tuyển sinh')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('Nguyễn Văn A')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('email@example.com')).toBeInTheDocument();
  });

  it('has terms checkbox', () => {
    renderWithRouter(<Register />);
    expect(screen.getByText(/điều khoản sử dụng/i)).toBeInTheDocument();
  });

  it('has login link', () => {
    renderWithRouter(<Register />);
    expect(screen.getByText('Đăng nhập')).toBeInTheDocument();
  });
});

describe('OTP Verification Page', () => {
  it('renders OTP input when email provided', () => {
    renderWithRouter(
      <OTPVerification />,
      ['/?email=test@example.com&type=register']
    );
    expect(screen.getByText('Xác thực OTP')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('000000')).toBeInTheDocument();
  });

  it('shows countdown timer', () => {
    renderWithRouter(
      <OTPVerification />,
      ['/?email=test@example.com&type=register']
    );
    expect(screen.getByText(/Gửi lại OTP sau/i)).toBeInTheDocument();
  });
});
