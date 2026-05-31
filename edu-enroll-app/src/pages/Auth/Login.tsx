import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Input, Button, Checkbox, Card, message, Alert } from 'antd';
import { UserOutlined, LockOutlined, GlobalOutlined } from '@ant-design/icons';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { authService } from '../../services/auth.service';
import { useAuthStore } from '../../store/auth.store';
import { loginSchema, type LoginInput } from '../../validations/auth.schema';

export default function Login() {
  const navigate = useNavigate();
  const { login } = useAuthStore();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const { control, handleSubmit, formState: { errors } } = useForm<LoginInput>({
    resolver: zodResolver(loginSchema),
  });

  const onSubmit = async (data: LoginInput) => {
    setLoading(true);
    setError('');
    try {
      const result = await authService.login(data.email, data.password);
      login(result.user, result.accessToken, result.refreshToken);
      message.success('Đăng nhập thành công!');
      if (result.user.role === 'admin' || result.user.role === 'super_admin') {
        navigate('/quan-tri');
      } else {
        navigate('/tai-khoan');
      }
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } }).response?.data?.message || 'Đăng nhập thất bại';
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 to-blue-50 flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-indigo-600 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg">
            <GlobalOutlined className="text-white text-3xl" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900">Trung tâm ngôn ngữ Apex</h1>
          <p className="text-gray-500 mt-1">Đăng nhập vào tài khoản của bạn</p>
        </div>

        <Card className="shadow-lg border-0 rounded-2xl">
          {error && <Alert message={error} type="error" showIcon className="mb-4" />}

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
              <Controller
                name="email"
                control={control}
                render={({ field }) => (
                  <Input
                    {...field}
                    prefix={<UserOutlined className="text-gray-400" />}
                    placeholder="email@example.com"
                    size="large"
                    status={errors.email ? 'error' : ''}
                  />
                )}
              />
              {errors.email && <p className="text-red-500 text-xs mt-1">{errors.email.message}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Mật khẩu</label>
              <Controller
                name="password"
                control={control}
                render={({ field }) => (
                  <Input.Password
                    {...field}
                    prefix={<LockOutlined className="text-gray-400" />}
                    placeholder="Nhập mật khẩu"
                    size="large"
                    status={errors.password ? 'error' : ''}
                  />
                )}
              />
              {errors.password && <p className="text-red-500 text-xs mt-1">{errors.password.message}</p>}
            </div>

            <div className="flex justify-between items-center">
              <Checkbox>Ghi nhớ đăng nhập</Checkbox>
              <Link to="/quen-mat-khau" className="text-indigo-600 text-sm hover:underline">
                Quên mật khẩu?
              </Link>
            </div>

            <Button
              htmlType="submit"
              type="primary"
              size="large"
              block
              loading={loading}
              style={{ backgroundColor: '#4f46e5', height: 48, fontSize: 15, fontWeight: 600 }}
            >
              Đăng nhập
            </Button>
          </form>

          <div className="text-center mt-6 text-sm text-gray-500">
            Chưa có tài khoản?{' '}
            <Link to="/dang-ky" className="text-indigo-600 font-medium hover:underline">
              Đăng ký tuyển sinh
            </Link>
          </div>
        </Card>

        <div className="text-center mt-6">
          <Link to="/" className="text-gray-500 text-sm hover:text-indigo-600">
            ← Quay lại trang chủ
          </Link>
        </div>
      </div>
    </div>
  );
}
