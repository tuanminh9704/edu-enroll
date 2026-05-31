import { useState } from 'react';
import { Card, Input, Button, Alert, Divider, message, Tag } from 'antd';
import { UserOutlined, PhoneOutlined, MailOutlined, LockOutlined, SafetyCertificateOutlined } from '@ant-design/icons';
import { useAuthStore } from '../../store/auth.store';
import api from '../../services/api';
import type { ApiResponse, User } from '../../types';

const ROLE_LABELS: Record<string, string> = {
  student: 'Học viên', staff: 'Nhân viên', admin: 'Quản trị', super_admin: 'Super Admin',
};
const ROLE_COLORS: Record<string, string> = {
  student: 'blue', staff: 'green', admin: 'orange', super_admin: 'red',
};

export default function ProfilePage() {
  const { user, updateUser } = useAuthStore();
  const [fullName, setFullName] = useState(user?.full_name || '');
  const [phone, setPhone] = useState(user?.phone || '');
  const [saving, setSaving] = useState(false);
  const [profileError, setProfileError] = useState('');

  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [changingPwd, setChangingPwd] = useState(false);
  const [pwdError, setPwdError] = useState('');

  const handleSaveProfile = async () => {
    if (!fullName.trim()) { setProfileError('Họ tên không được để trống'); return; }
    setSaving(true);
    setProfileError('');
    try {
      const res = await api.put<ApiResponse<User>>('/auth/profile', { full_name: fullName, phone });
      updateUser({ full_name: res.data.data.full_name, phone: res.data.data.phone });
      message.success('Cập nhật hồ sơ thành công');
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } }).response?.data?.message || 'Cập nhật thất bại';
      setProfileError(msg);
    } finally {
      setSaving(false);
    }
  };

  const handleChangePassword = async () => {
    if (!currentPassword || !newPassword || !confirmPassword) { setPwdError('Vui lòng điền đầy đủ thông tin'); return; }
    if (newPassword !== confirmPassword) { setPwdError('Mật khẩu xác nhận không khớp'); return; }
    if (newPassword.length < 6) { setPwdError('Mật khẩu mới tối thiểu 6 ký tự'); return; }
    setChangingPwd(true);
    setPwdError('');
    try {
      await api.put('/auth/change-password', { current_password: currentPassword, new_password: newPassword });
      message.success('Đổi mật khẩu thành công');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } }).response?.data?.message || 'Đổi mật khẩu thất bại';
      setPwdError(msg);
    } finally {
      setChangingPwd(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto py-8 px-4">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Hồ sơ cá nhân</h1>
        <p className="text-gray-500 mt-1">Quản lý thông tin tài khoản của bạn</p>
      </div>

      {/* Profile Info */}
      <Card className="border-0 shadow-md rounded-2xl mb-6">
        <div className="flex items-center gap-4 mb-6">
          <div className="w-16 h-16 bg-indigo-600 rounded-2xl flex items-center justify-center shadow-md">
            <UserOutlined className="text-white text-2xl" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-gray-900">{user?.full_name || '—'}</h2>
            <div className="flex items-center gap-2 mt-1">
              <MailOutlined className="text-gray-400 text-sm" />
              <span className="text-gray-500 text-sm">{user?.email}</span>
              <Tag color={ROLE_COLORS[user?.role || 'student']} className="ml-1">{ROLE_LABELS[user?.role || 'student']}</Tag>
            </div>
          </div>
        </div>

        <Divider />

        {profileError && <Alert message={profileError} type="error" showIcon className="mb-4" />}

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Họ và tên</label>
            <Input
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              prefix={<UserOutlined className="text-gray-400" />}
              size="large"
              placeholder="Nguyễn Văn A"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
            <Input
              value={user?.email}
              prefix={<MailOutlined className="text-gray-400" />}
              size="large"
              disabled
              className="bg-gray-50"
            />
            <p className="text-xs text-gray-400 mt-1">Email không thể thay đổi</p>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Số điện thoại</label>
            <Input
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              prefix={<PhoneOutlined className="text-gray-400" />}
              size="large"
              placeholder="0901234567"
            />
          </div>

          <Button
            type="primary"
            size="large"
            onClick={handleSaveProfile}
            loading={saving}
            style={{ backgroundColor: '#4f46e5', fontWeight: 600 }}
          >
            Lưu thay đổi
          </Button>
        </div>
      </Card>

      {/* Change Password */}
      <Card className="border-0 shadow-md rounded-2xl">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 bg-orange-100 rounded-xl flex items-center justify-center">
            <SafetyCertificateOutlined className="text-orange-600 text-lg" />
          </div>
          <div>
            <h3 className="font-bold text-gray-900">Đổi mật khẩu</h3>
            <p className="text-gray-400 text-sm">Bảo mật tài khoản với mật khẩu mạnh</p>
          </div>
        </div>

        {pwdError && <Alert message={pwdError} type="error" showIcon className="mb-4" />}

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Mật khẩu hiện tại</label>
            <Input.Password
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              prefix={<LockOutlined className="text-gray-400" />}
              size="large"
              placeholder="Nhập mật khẩu hiện tại"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Mật khẩu mới</label>
            <Input.Password
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              prefix={<LockOutlined className="text-gray-400" />}
              size="large"
              placeholder="Tối thiểu 6 ký tự"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Xác nhận mật khẩu mới</label>
            <Input.Password
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              prefix={<LockOutlined className="text-gray-400" />}
              size="large"
              placeholder="Nhập lại mật khẩu mới"
            />
          </div>

          <Button
            type="default"
            size="large"
            onClick={handleChangePassword}
            loading={changingPwd}
            danger
            style={{ fontWeight: 600 }}
          >
            Đổi mật khẩu
          </Button>
        </div>
      </Card>
    </div>
  );
}
