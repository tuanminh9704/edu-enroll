import { useEffect, useState } from 'react';
import { Card, Table, Tag, Spin, Alert, Statistic, Row, Col } from 'antd';
import {
  UserOutlined, FileTextOutlined, CheckCircleOutlined,
  DollarOutlined, ClockCircleOutlined,
} from '@ant-design/icons';
import { adminService } from '../../services/admin.service';
import { STATUS_LABELS } from '../../constants';
import type { EnrollmentForm } from '../../types';
import type { AdminStats } from '../../services/admin.service';

const STATUS_COLORS: Record<string, string> = {
  pending: 'processing',
  in_progress: 'processing',
  waiting_docs: 'warning',
  completed: 'success',
  rejected: 'error',
};

export default function AdminDashboard() {
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [recent, setRecent] = useState<EnrollmentForm[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const [statsData, enrollmentsData] = await Promise.all([
          adminService.getStats(),
          adminService.getEnrollments({ page: 1, limit: 8 }),
        ]);
        setStats(statsData);
        setRecent(enrollmentsData.data);
      } catch {
        setError('Không thể tải dữ liệu dashboard');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  if (loading) {
    return <div className="flex justify-center py-16"><Spin size="large" /></div>;
  }

  const columns = [
    { title: 'Mã HS', dataIndex: 'document_number', key: 'document_number', render: (v: string) => <span className="font-mono text-xs">{v || '—'}</span> },
    { title: 'Họ tên', dataIndex: 'student_full_name', key: 'student_full_name', render: (v: string) => v || '—' },
    { title: 'Ngoại ngữ', dataIndex: 'language', key: 'language', render: (v: string) => v || '—' },
    { title: 'Trình độ', dataIndex: 'level', key: 'level', render: (v: string) => v || '—' },
    {
      title: 'Trạng thái',
      dataIndex: 'status',
      key: 'status',
      render: (v: string) => (
        <Tag color={STATUS_COLORS[v] || 'default'}>{STATUS_LABELS[v] || v}</Tag>
      ),
    },
    {
      title: 'Ngày tạo',
      dataIndex: 'created_at',
      key: 'created_at',
      render: (v: string) => v ? new Date(v).toLocaleDateString('vi-VN') : '—',
    },
  ];

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
        <p className="text-gray-500 mt-1">Tổng quan hệ thống tuyển sinh</p>
      </div>

      {error && <Alert message={error} type="error" showIcon className="mb-6" />}

      {stats && (
        <Row gutter={[16, 16]} className="mb-8">
          {[
            { title: 'Tổng học viên', value: stats.totalUsers, icon: <UserOutlined />, color: '#4f46e5', bg: '#eef2ff' },
            { title: 'Hồ sơ tuyển sinh', value: stats.totalEnrollments, icon: <FileTextOutlined />, color: '#0891b2', bg: '#ecfeff' },
            { title: 'Hoàn thành', value: stats.completedEnrollments, icon: <CheckCircleOutlined />, color: '#16a34a', bg: '#f0fdf4' },
            { title: 'Chờ xử lý', value: stats.pendingEnrollments, icon: <ClockCircleOutlined />, color: '#d97706', bg: '#fffbeb' },
            { title: 'Doanh thu (lệ phí)', value: stats.totalRevenue, icon: <DollarOutlined />, color: '#dc2626', bg: '#fef2f2', prefix: '' },
          ].map((item) => (
            <Col xs={24} sm={12} lg={8} xl={4} key={item.title}>
              <Card className="border-0 shadow-md rounded-2xl">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-xl flex items-center justify-center text-xl" style={{ color: item.color, backgroundColor: item.bg }}>
                    {item.icon}
                  </div>
                  <Statistic
                    title={<span className="text-xs text-gray-500">{item.title}</span>}
                    value={item.value}
                    valueStyle={{ fontSize: 20, fontWeight: 700, color: item.color }}
                    prefix={item.prefix !== undefined ? item.prefix : undefined}
                    suffix={item.title.includes('Doanh thu') ? ' ₫' : undefined}
                  />
                </div>
              </Card>
            </Col>
          ))}
        </Row>
      )}

      <Card className="border-0 shadow-md rounded-2xl">
        <h2 className="text-lg font-bold text-gray-900 mb-4">Hồ sơ gần đây</h2>
        <Table
          dataSource={recent}
          columns={columns}
          rowKey="id"
          pagination={false}
          size="small"
          scroll={{ x: 600 }}
        />
      </Card>
    </div>
  );
}
