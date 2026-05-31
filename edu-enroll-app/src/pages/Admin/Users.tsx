import { useEffect, useState } from 'react';
import { Card, Table, Tag, Button, Input, Select, message, Popconfirm, Tooltip, Upload } from 'antd';
import { SearchOutlined, UserOutlined, LockOutlined, UnlockOutlined, DownloadOutlined, UploadOutlined } from '@ant-design/icons';
import { adminService } from '../../services/admin.service';
import type { User } from '../../types';
import { downloadAdminCsv, formatImportResult, importAdminCsv } from '../../utils/adminCsv';

const ROLE_COLORS: Record<string, string> = {
  student: 'blue', staff: 'green', admin: 'orange', super_admin: 'red',
};
const ROLE_LABELS: Record<string, string> = {
  student: 'Học viên', staff: 'Nhân viên', admin: 'Quản trị', super_admin: 'Super Admin',
};

export default function AdminUsers() {
  const [data, setData] = useState<User[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState('');
  const [toggling, setToggling] = useState<string | null>(null);

  const load = async (p = page, s = search) => {
    setLoading(true);
    try {
      const res = await adminService.getUsers({ page: p, limit: 10, search: s });
      setData(res.data);
      setTotal(res.total);
    } catch {
      message.error('Không thể tải danh sách người dùng');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const handleSearch = () => { setPage(1); load(1, search); };

  const handleToggleActive = async (id: string) => {
    setToggling(id);
    try {
      await adminService.toggleUserActive(id);
      message.success('Đã cập nhật trạng thái tài khoản');
      load(page, search);
    } catch {
      message.error('Thao tác thất bại');
    } finally {
      setToggling(null);
    }
  };

  const handleRoleChange = async (id: string, role: string) => {
    try {
      await adminService.changeUserRole(id, role);
      message.success('Đã thay đổi vai trò');
      load(page, search);
    } catch {
      message.error('Thao tác thất bại');
    }
  };

  const handleExport = async () => {
    try {
      await downloadAdminCsv('users', 'users.csv');
    } catch {
      message.error('Xuất dữ liệu thất bại');
    }
  };

  const handleImport = async (file: File) => {
    try {
      const result = await importAdminCsv('users', file);
      message.success(formatImportResult(result));
      if (result.errors?.length) message.warning(result.errors.slice(0, 3).join('; '));
      load(page, search);
    } catch {
      message.error('Nhập dữ liệu thất bại');
    }
  };

  const columns = [
    {
      title: 'Người dùng',
      key: 'user',
      render: (_: unknown, record: User) => (
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 bg-indigo-100 rounded-xl flex items-center justify-center">
            <UserOutlined className="text-indigo-600" />
          </div>
          <div>
            <p className="font-medium text-gray-900">{record.full_name || '—'}</p>
            <p className="text-xs text-gray-500">{record.email}</p>
          </div>
        </div>
      ),
    },
    { title: 'Điện thoại', dataIndex: 'phone', key: 'phone', render: (v: string) => v || '—', width: 120 },
    {
      title: 'Vai trò',
      dataIndex: 'role',
      key: 'role',
      width: 140,
      render: (v: string, record: User) => (
        v === 'super_admin' ? (
          <Tag color={ROLE_COLORS.super_admin}>{ROLE_LABELS.super_admin}</Tag>
        ) : (
          <Select
            size="small"
            value={v}
            onChange={(newRole) => handleRoleChange(record.id, newRole)}
            options={[
              { value: 'student', label: ROLE_LABELS.student },
              { value: 'staff', label: ROLE_LABELS.staff },
              { value: 'admin', label: ROLE_LABELS.admin },
            ]}
            style={{ minWidth: 120 }}
          />
        )
      ),
    },
    {
      title: 'Trạng thái',
      dataIndex: 'is_active',
      key: 'is_active',
      width: 120,
      render: (v: boolean) => (
        <Tag color={v ? 'success' : 'default'}>{v ? 'Đã xác thực' : 'Chưa kích hoạt'}</Tag>
      ),
    },
    {
      title: 'Ngày tạo',
      dataIndex: 'created_at',
      key: 'created_at',
      width: 110,
      render: (v: string) => v ? new Date(v).toLocaleDateString('vi-VN') : '—',
    },
    {
      title: 'Thao tác',
      key: 'action',
      width: 90,
      render: (_: unknown, record: User) => record.role !== 'super_admin' ? (
        <Popconfirm
          title={record.is_active ? 'Khóa tài khoản này?' : 'Kích hoạt tài khoản này?'}
          onConfirm={() => handleToggleActive(record.id)}
          okText="Xác nhận"
          cancelText="Huỷ"
        >
          <Tooltip title={record.is_active ? 'Khóa tài khoản' : 'Kích hoạt'}>
            <Button
              size="small"
              danger={record.is_active}
              type={record.is_active ? 'default' : 'primary'}
              icon={record.is_active ? <LockOutlined /> : <UnlockOutlined />}
              loading={toggling === record.id}
              style={!record.is_active ? { backgroundColor: '#16a34a', borderColor: '#16a34a' } : undefined}
            />
          </Tooltip>
        </Popconfirm>
      ) : null,
    },
  ];

  return (
    <div className="p-6">
      <div className="mb-6 flex justify-between items-start">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Quản lý người dùng</h1>
          <p className="text-gray-500 mt-1">Danh sách tất cả tài khoản trong hệ thống</p>
        </div>
        <div className="flex gap-2">
          <Upload
            accept=".csv,text/csv"
            showUploadList={false}
            beforeUpload={(file) => {
              void handleImport(file as File);
              return false;
            }}
          >
            <Button icon={<UploadOutlined />}>Nhập CSV</Button>
          </Upload>
          <Button icon={<DownloadOutlined />} onClick={handleExport}>
            Xuất CSV
          </Button>
        </div>
      </div>

      <Card className="border-0 shadow-md rounded-2xl mb-4">
        <div className="flex gap-3">
          <Input
            prefix={<SearchOutlined />}
            placeholder="Tìm theo tên, email, số điện thoại..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            onPressEnter={handleSearch}
            className="max-w-sm"
          />
          <Button type="primary" onClick={handleSearch} style={{ backgroundColor: '#4f46e5' }}>
            Tìm kiếm
          </Button>
        </div>
      </Card>

      <Card className="border-0 shadow-md rounded-2xl">
        <Table
          dataSource={data}
          columns={columns}
          rowKey="id"
          loading={loading}
          scroll={{ x: 800 }}
          pagination={{
            current: page,
            total,
            pageSize: 10,
            onChange: (p) => { setPage(p); load(p); },
            showTotal: (t) => `${t} người dùng`,
          }}
        />
      </Card>
    </div>
  );
}
