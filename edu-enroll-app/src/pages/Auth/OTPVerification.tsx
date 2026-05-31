import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import { Input, Button, Card, Alert, message } from 'antd';
import { SafetyCertificateOutlined, GlobalOutlined } from '@ant-design/icons';
import { authService } from '../../services/auth.service';

export default function OTPVerification() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const email = searchParams.get('email') || '';
  const type = (searchParams.get('type') || 'register') as 'register' | 'forgot_password';

  const [otp, setOtp] = useState('');
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);
  const [error, setError] = useState('');
  const [countdown, setCountdown] = useState(60);
  const [canResend, setCanResend] = useState(false);

  useEffect(() => {
    if (countdown > 0) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
      return () => clearTimeout(timer);
    } else {
      setCanResend(true);
    }
  }, [countdown]);

  const handleVerify = async () => {
    if (otp.length !== 6) { setError('Vui lòng nhập đủ 6 chữ số OTP'); return; }
    setLoading(true);
    setError('');
    try {
      await authService.verifyOTP(email, otp, type);
      message.success('Xác thực thành công!');
      if (type === 'register') {
        navigate('/dang-nhap');
      } else {
        navigate(`/quen-mat-khau?step=reset&email=${encodeURIComponent(email)}`);
      }
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } }).response?.data?.message || 'OTP không hợp lệ';
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    setResending(true);
    try {
      await authService.resendOTP(email, type);
      message.success('Đã gửi lại OTP');
      setCountdown(60);
      setCanResend(false);
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } }).response?.data?.message || 'Không thể gửi lại OTP';
      message.error(msg);
    } finally {
      setResending(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 to-blue-50 flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-indigo-600 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg">
            <SafetyCertificateOutlined className="text-white text-3xl" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900">Xác thực OTP</h1>
          <p className="text-gray-500 mt-2 text-sm">
            Mã OTP đã được gửi đến email<br />
            <strong className="text-indigo-600">{email}</strong>
          </p>
        </div>

        <Card className="shadow-lg border-0 rounded-2xl">
          {error && <Alert message={error} type="error" showIcon className="mb-4" />}

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Nhập mã OTP (6 chữ số)</label>
              <Input
                value={otp}
                onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                size="large"
                maxLength={6}
                placeholder="000000"
                className="text-center text-2xl tracking-widest font-mono"
                status={error ? 'error' : ''}
                onPressEnter={handleVerify}
              />
              <p className="text-gray-400 text-xs mt-2">
                OTP có hiệu lực trong 1 phút. Kiểm tra hộp thư spam nếu không thấy email.
              </p>
            </div>

            <Button
              type="primary"
              size="large"
              block
              loading={loading}
              onClick={handleVerify}
              style={{ backgroundColor: '#4f46e5', height: 48, fontSize: 15, fontWeight: 600 }}
            >
              Xác nhận OTP
            </Button>

            <div className="text-center">
              {canResend ? (
                <Button type="link" loading={resending} onClick={handleResend} className="text-indigo-600">
                  Gửi lại OTP
                </Button>
              ) : (
                <span className="text-gray-400 text-sm">
                  Gửi lại OTP sau <strong className="text-indigo-600">{countdown}s</strong>
                </span>
              )}
            </div>
          </div>

          <div className="text-center mt-4">
            <Link to="/dang-nhap" className="text-gray-400 text-sm hover:text-indigo-600">← Quay lại đăng nhập</Link>
          </div>
        </Card>

        <div className="text-center mt-6">
          <div className="flex items-center justify-center gap-2 text-gray-400 text-sm">
            <GlobalOutlined />
            <span>Trung tâm ngôn ngữ Apex</span>
          </div>
        </div>
      </div>
    </div>
  );
}
