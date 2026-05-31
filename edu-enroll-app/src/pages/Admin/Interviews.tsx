import { useEffect, useState } from 'react';
import { Button, Card, DatePicker, Form, Input, Modal, Select, Table, Tag, message } from 'antd';
import { PlusOutlined } from '@ant-design/icons';
import api from '../../services/api';
import type { ApiResponse, EnrollmentForm } from '../../types';

interface Interview {
  _id: string;
  title: string;
  scheduled_at: string;
  location: string;
  format: 'online' | 'offline';
  status: string;
  notes?: string;
  user_id?: { email: string; full_name?: string; phone?: string };
  enrollment_id?: { student_full_name?: string; document_number?: string; language?: string; level?: string };
}

const STATUS_OPTIONS = [
  { value: 'pending', label: 'Chờ xác nhận' },
  { value: 'confirmed', label: 'Đã xác nhận' },
  { value: 'declined', label: 'Từ chối' },
  { value: 'completed', label: 'Hoàn tất' },
  { value: 'cancelled', label: 'Đã hủy' },
];

const STATUS_COLORS: Record<string, string> = {
  pending: 'processing',
  confirmed: 'success',
  declined: 'warning',
  completed: 'blue',
  cancelled: 'error',
};

export default function AdminInterviews() {
  const [data, setData] = useState<Interview[]>([]);
  const [enrollments, setEnrollments] = useState<EnrollmentForm[]>([]);
  const [loading, setLoading] = useState(false);
  const [modal, setModal] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form] = Form.useForm();

  const load = async () => {
    setLoading(true);
    try {
      const [interviewRes, enrollmentRes] = await Promise.all([
        api.get<ApiResponse<{ data: Interview[] }>>('/admin/interviews'),
        api.get<ApiResponse<{ data: EnrollmentForm[] }>>('/admin/enrollments?limit=100'),
      ]);
      setData(interviewRes.data.data.data || []);
      setEnrollments(enrollmentRes.data.data.data || []);
    } catch {
      message.error('Không thể tải lịch phỏng vấn');
    } finally {
      setLoading(false);
    }
  };

  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => { load(); }, []);

  const handleCreate = async () => {
    const values = await form.validateFields();
    setSaving(true);
    try {
      await api.post('/admin/interviews', {
        ...values,
        scheduled_at: values.scheduled_at.toISOString(),
      });
      message.success('Tạo lịch phỏng vấn thành công');
      setModal(false);
      form.resetFields();
      load();
    } catch {
      message.error('Tạo lịch phỏng vấn thất bại');
    } finally {
      setSaving(false);
    }
  };

  const updateStatus = async (id: string, status: string) => {
    try {
      await api.patch(`/admin/interviews/${id}/status`, { status });
      message.success('Đã cập nhật trạng thái');
      load();
    } catch {
      message.error('Cập nhật thất bại');
    }
  };

  const columns = [
    { title: 'Tiêu đề', dataIndex: 'title', key: 'title', width: 220 },
    {
      title: 'Học viên',
      key: 'student',
      render: (_: unknown, r: Interview) => (
        <div>
          <p className="font-medium">{r.enrollment_id?.student_full_name || r.user_id?.full_name || '—'}</p>
          <p className="text-xs text-gray-400">{r.user_id?.email || r.enrollment_id?.document_number}</p>
        </div>
      ),
    },
    { title: 'Thời gian', dataIndex: 'scheduled_at', key: 'scheduled_at', width: 160, render: (v: string) => new Date(v).toLocaleString('vi-VN') },
    { title: 'Địa điểm', dataIndex: 'location', key: 'location' },
    { title: 'Hình thức', dataIndex: 'format', key: 'format', width: 100, render: (v: string) => <Tag color={v === 'online' ? 'blue' : 'green'}>{v}</Tag> },
    {
      title: 'Trạng thái',
      dataIndex: 'status',
      key: 'status',
      width: 150,
      render: (v: string, r: Interview) => (
        <Select
          size="small"
          value={v}
          options={STATUS_OPTIONS}
          onChange={(status) => updateStatus(r._id, status)}
          style={{ minWidth: 130 }}
        />
      ),
    },
  ];

  return (
    <div className="p-6">
      <div className="mb-6 flex justify-between items-start">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Quản lý phỏng vấn</h1>
          <p className="text-gray-500 mt-1">Tạo lịch phỏng vấn và theo dõi xác nhận tham gia</p>
        </div>
        <Button type="primary" icon={<PlusOutlined />} onClick={() => setModal(true)} style={{ backgroundColor: '#4f46e5' }}>
          Tạo lịch
        </Button>
      </div>

      <Card className="border-0 shadow-md rounded-2xl">
        <Table dataSource={data} columns={columns} rowKey="_id" loading={loading} scroll={{ x: 900 }}
          pagination={{ pageSize: 15, showTotal: (t) => `${t} lịch phỏng vấn` }}
          rowClassName={(r) => STATUS_COLORS[r.status] ? '' : ''} />
      </Card>

      <Modal
        title="Tạo lịch phỏng vấn"
        open={modal}
        onOk={handleCreate}
        onCancel={() => { setModal(false); form.resetFields(); }}
        okText="Tạo"
        cancelText="Hủy"
        okButtonProps={{ loading: saving, style: { backgroundColor: '#4f46e5' } }}
        width={560}
      >
        <Form form={form} layout="vertical" className="mt-4">
          <Form.Item name="enrollment_id" label="Hồ sơ" rules={[{ required: true }]}>
            <Select
              showSearch
              optionFilterProp="label"
              options={enrollments.map((e) => ({
                value: e.id || (e as unknown as { _id: string })._id,
                label: `${e.student_full_name || 'Chưa điền tên'} - ${e.language || '—'} ${e.level || ''}`,
              }))}
            />
          </Form.Item>
          <Form.Item name="title" label="Tiêu đề" rules={[{ required: true }]}>
            <Input placeholder="VD: Phỏng vấn đầu vào tiếng Anh" />
          </Form.Item>
          <Form.Item name="scheduled_at" label="Thời gian" rules={[{ required: true }]}>
            <DatePicker showTime className="w-full" format="DD/MM/YYYY HH:mm" />
          </Form.Item>
          <div className="grid grid-cols-2 gap-4">
            <Form.Item name="format" label="Hình thức" initialValue="offline" rules={[{ required: true }]}>
              <Select options={[{ value: 'offline', label: 'Trực tiếp' }, { value: 'online', label: 'Online' }]} />
            </Form.Item>
            <Form.Item name="location" label="Địa điểm / Link" rules={[{ required: true }]}>
              <Input placeholder="Phòng 201 hoặc Zoom link" />
            </Form.Item>
          </div>
          <Form.Item name="notes" label="Ghi chú">
            <Input.TextArea rows={3} />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}
