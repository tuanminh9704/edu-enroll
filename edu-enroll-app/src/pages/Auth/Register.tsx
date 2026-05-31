import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Input, Button, Card, Alert, Checkbox, Select } from 'antd';
import { UserOutlined, MailOutlined, PhoneOutlined, LockOutlined, GlobalOutlined } from '@ant-design/icons';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { authService } from '../../services/auth.service';
import { registerSchema, type RegisterInput } from '../../validations/auth.schema';
import { LANGUAGES } from '../../constants';

export default function Register() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [agreed, setAgreed] = useState(false);

  const { control, handleSubmit, formState: { errors } } = useForm<RegisterInput>({
    resolver: zodResolver(registerSchema),
  });

  const onSubmit = async (data: RegisterInput) => {
    if (!agreed) { setError('Vui lòng đồng ý với điều khoản sử dụng'); return; }
    setLoading(true);
    setError('');
    try {
      await authService.register({
        email: data.email,
        password: data.password,
        phone: data.phone,
        full_name: data.full_name,
        preferred_language: data.preferred_language,
      });
      navigate(`/xac-thuc-otp?email=${encodeURIComponent(data.email)}&type=register`);
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } }).response?.data?.message || 'Đăng ký thất bại';
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 to-blue-50 flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-lg">
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-indigo-600 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg">
            <GlobalOutlined className="text-white text-3xl" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900">Đăng ký tuyển sinh</h1>
          <p className="text-gray-500 mt-1">Tạo tài khoản để bắt đầu hành trình ngôn ngữ</p>
        </div>

        <Card className="shadow-lg border-0 rounded-2xl">
          {error && <Alert message={error} type="error" showIcon className="mb-4" />}

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Họ và tên *</label>
              <Controller
                name="full_name"
                control={control}
                render={({ field }) => (
                  <Input {...field} prefix={<UserOutlined className="text-gray-400" />} placeholder="Nguyễn Văn A" size="large" status={errors.full_name ? 'error' : ''} />
                )}
              />
              {errors.full_name && <p className="text-red-500 text-xs mt-1">{errors.full_name.message}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Email *</label>
              <Controller
                name="email"
                control={control}
                render={({ field }) => (
                  <Input {...field} prefix={<MailOutlined className="text-gray-400" />} placeholder="email@example.com" size="large" status={errors.email ? 'error' : ''} />
                )}
              />
              {errors.email && <p className="text-red-500 text-xs mt-1">{errors.email.message}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Số điện thoại *</label>
              <Controller
                name="phone"
                control={control}
                render={({ field }) => (
                  <Input {...field} prefix={<PhoneOutlined className="text-gray-400" />} placeholder="0901234567" size="large" status={errors.phone ? 'error' : ''} />
                )}
              />
              {errors.phone && <p className="text-red-500 text-xs mt-1">{errors.phone.message}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Ngôn ngữ đăng ký *</label>
              <Controller
                name="preferred_language"
                control={control}
                render={({ field }) => (
                  <Select
                    {...field}
                    className="w-full"
                    size="large"
                    placeholder="Chọn ngôn ngữ muốn học"
                    status={errors.preferred_language ? 'error' : ''}
                    options={LANGUAGES.map((item) => ({ value: item.value, label: item.label }))}
                  />
                )}
              />
              {errors.preferred_language && <p className="text-red-500 text-xs mt-1">{errors.preferred_language.message}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Mật khẩu *</label>
              <Controller
                name="password"
                control={control}
                render={({ field }) => (
                  <Input.Password {...field} prefix={<LockOutlined className="text-gray-400" />} placeholder="Tối thiểu 6 ký tự" size="large" status={errors.password ? 'error' : ''} />
                )}
              />
              {errors.password && <p className="text-red-500 text-xs mt-1">{errors.password.message}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Xác nhận mật khẩu *</label>
              <Controller
                name="confirm_password"
                control={control}
                render={({ field }) => (
                  <Input.Password {...field} prefix={<LockOutlined className="text-gray-400" />} placeholder="Nhập lại mật khẩu" size="large" status={errors.confirm_password ? 'error' : ''} />
                )}
              />
              {errors.confirm_password && <p className="text-red-500 text-xs mt-1">{errors.confirm_password.message}</p>}
            </div>

            <Checkbox checked={agreed} onChange={(e) => setAgreed(e.target.checked)}>
              Tôi đồng ý với{' '}
              <Link to="/" className="text-indigo-600">điều khoản sử dụng</Link>{' '}
              và{' '}
              <Link to="/" className="text-indigo-600">chính sách bảo mật</Link>
            </Checkbox>

            <Button
              htmlType="submit"
              type="primary"
              size="large"
              block
              loading={loading}
              style={{ backgroundColor: '#4f46e5', height: 48, fontSize: 15, fontWeight: 600 }}
            >
              Đăng ký tài khoản
            </Button>
          </form>

          <div className="text-center mt-6 text-sm text-gray-500">
            Đã có tài khoản?{' '}
            <Link to="/dang-nhap" className="text-indigo-600 font-medium hover:underline">Đăng nhập</Link>
          </div>
        </Card>
      </div>
    </div>
  );
}
