import { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { Input, Button, Card, Alert, message } from 'antd';
import { MailOutlined, LockOutlined, CheckCircleOutlined } from '@ant-design/icons';
import { authService } from '../../services/auth.service';

type Step = 'email' | 'reset' | 'success';

export default function ForgotPassword() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [step, setStep] = useState<Step>((searchParams.get('step') as Step) || 'email');
  const [email, setEmail] = useState(searchParams.get('email') || '');
  const [otp, setOtp] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSendOTP = async () => {
    if (!email) { setError('Vui lòng nhập email'); return; }
    setLoading(true);
    setError('');
    try {
      await authService.forgotPassword(email);
      message.success('Đã gửi OTP đến email của bạn');
      navigate(`/xac-thuc-otp?email=${encodeURIComponent(email)}&type=forgot_password`);
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } }).response?.data?.message || 'Không tìm thấy email';
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async () => {
    if (newPassword !== confirmPassword) { setError('Mật khẩu xác nhận không khớp'); return; }
    if (newPassword.length < 6) { setError('Mật khẩu tối thiểu 6 ký tự'); return; }
    setLoading(true);
    setError('');
    try {
      await authService.resetPassword(email, otp, newPassword);
      setStep('success');
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } }).response?.data?.message || 'Đặt lại mật khẩu thất bại';
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  if (step === 'success') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-indigo-50 to-blue-50 flex items-center justify-center px-4">
        <Card className="w-full max-w-md shadow-lg border-0 rounded-2xl text-center p-8">
          <CheckCircleOutlined className="text-6xl text-green-500 mb-4" />
          <h2 className="text-xl font-bold text-gray-900 mb-2">Đặt lại mật khẩu thành công!</h2>
          <p className="text-gray-500 mb-6">Mật khẩu của bạn đã được cập nhật. Hãy đăng nhập với mật khẩu mới.</p>
          <Button type="primary" size="large" block style={{ backgroundColor: '#4f46e5' }} onClick={() => navigate('/dang-nhap')}>
            Đăng nhập ngay
          </Button>
        </Card>
      </div>
    );
  }

  if (step === 'reset') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-indigo-50 to-blue-50 flex items-center justify-center px-4">
        <div className="w-full max-w-md">
          <h1 className="text-2xl font-bold text-gray-900 text-center mb-2">Đặt lại mật khẩu</h1>
          <p className="text-gray-500 text-center text-sm mb-8">Nhập OTP và mật khẩu mới</p>
          <Card className="shadow-lg border-0 rounded-2xl">
            {error && <Alert message={error} type="error" showIcon className="mb-4" />}
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Mã OTP</label>
                <Input value={otp} onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))} size="large" placeholder="000000" maxLength={6} />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Mật khẩu mới</label>
                <Input.Password value={newPassword} onChange={(e) => setNewPassword(e.target.value)} size="large" prefix={<LockOutlined className="text-gray-400" />} placeholder="Tối thiểu 6 ký tự" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Xác nhận mật khẩu</label>
                <Input.Password value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} size="large" prefix={<LockOutlined className="text-gray-400" />} placeholder="Nhập lại mật khẩu mới" />
              </div>
              <Button type="primary" size="large" block loading={loading} onClick={handleResetPassword} style={{ backgroundColor: '#4f46e5', height: 48 }}>
                Đặt lại mật khẩu
              </Button>
            </div>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 to-blue-50 flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold text-gray-900">Quên mật khẩu?</h1>
          <p className="text-gray-500 mt-2 text-sm">Nhập email của bạn để nhận mã OTP đặt lại mật khẩu</p>
        </div>
        <Card className="shadow-lg border-0 rounded-2xl">
          {error && <Alert message={error} type="error" showIcon className="mb-4" />}
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
              <Input
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                prefix={<MailOutlined className="text-gray-400" />}
                placeholder="email@example.com"
                size="large"
                onPressEnter={handleSendOTP}
              />
            </div>
            <Button type="primary" size="large" block loading={loading} onClick={handleSendOTP} style={{ backgroundColor: '#4f46e5', height: 48, fontWeight: 600 }}>
              Gửi mã OTP
            </Button>
          </div>
          <div className="text-center mt-4">
            <Link to="/dang-nhap" className="text-gray-400 text-sm hover:text-indigo-600">← Quay lại đăng nhập</Link>
          </div>
        </Card>
      </div>
    </div>
  );
}
