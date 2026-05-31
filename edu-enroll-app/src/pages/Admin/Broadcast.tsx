import { useState } from 'react';
import { Card, Form, Input, Select, Button, Alert, Divider, message, Table, Tag } from 'antd';
import { SendOutlined, BellOutlined } from '@ant-design/icons';
import api from '../../services/api';
import type { ApiResponse } from '../../types';

const TYPE_OPTIONS = [
  { value: 'info', label: 'Thông tin' },
  { value: 'success', label: 'Thành công' },
  { value: 'warning', label: 'Cảnh báo' },
  { value: 'error', label: 'Lỗi' },
];

const ROLE_OPTIONS = [
  { value: '', label: 'Tất cả người dùng' },
  { value: 'student', label: 'Học viên' },
  { value: 'staff', label: 'Nhân viên' },
  { value: 'admin', label: 'Quản trị' },
];

const TYPE_COLORS: Record<string, string> = { info: 'blue', success: 'green', warning: 'orange', error: 'red' };

interface SentRecord {
  key: string;
  title: string;
  type: string;
  role: string;
  sent: number;
  time: string;
}

export default function AdminBroadcast() {
  const [form] = Form.useForm();
  const [sending, setSending] = useState(false);
  const [history, setHistory] = useState<SentRecord[]>([]);

  const handleSend = async () => {
    const values = await form.validateFields();
    setSending(true);
    try {
      const res = await api.post<ApiResponse<{ sent: number }>>('/admin/notifications/broadcast', {
        title: values.title,
        message: values.message,
        type: values.type || 'info',
        link: values.link || undefined,
        role: values.role || undefined,
      });
      const sent = res.data.data?.sent ?? 0;
      message.success(`Đã gửi thông báo đến ${sent} người dùng`);
      setHistory((prev) => [{
        key: Date.now().toString(),
        title: values.title,
        type: values.type || 'info',
        role: ROLE_OPTIONS.find((r) => r.value === (values.role || ''))?.label ?? 'Tất cả',
        sent,
        time: new Date().toLocaleString('vi-VN'),
      }, ...prev.slice(0, 19)]);
      form.resetFields(['title', 'message', 'link']);
    } catch {
      message.error('Gửi thông báo thất bại');
    } finally {
      setSending(false);
    }
  };

  const columns = [
    { title: 'Tiêu đề', dataIndex: 'title', key: 'title', ellipsis: true },
    { title: 'Loại', dataIndex: 'type', key: 'type', width: 100, render: (v: string) => <Tag color={TYPE_COLORS[v]}>{TYPE_OPTIONS.find((t) => t.value === v)?.label}</Tag> },
    { title: 'Đối tượng', dataIndex: 'role', key: 'role', width: 130 },
    { title: 'Đã gửi', dataIndex: 'sent', key: 'sent', width: 80, render: (v: number) => <span className="font-bold text-indigo-600">{v}</span> },
    { title: 'Thời gian', dataIndex: 'time', key: 'time', width: 150 },
  ];

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Gửi thông báo</h1>
        <p className="text-gray-500 mt-1">Gửi thông báo hệ thống đến người dùng</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="border-0 shadow-md rounded-2xl">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 bg-indigo-100 rounded-xl flex items-center justify-center">
              <BellOutlined className="text-indigo-600 text-lg" />
            </div>
            <div>
              <h3 className="font-bold text-gray-900">Soạn thông báo</h3>
              <p className="text-gray-400 text-sm">Điền thông tin và gửi ngay</p>
            </div>
          </div>

          <Alert
            type="warning"
            showIcon
            message="Thông báo sẽ được gửi ngay lập tức đến tất cả người dùng đã chọn."
            className="mb-4"
          />

          <Form form={form} layout="vertical">
            <Form.Item name="role" label="Đối tượng nhận" initialValue="">
              <Select options={ROLE_OPTIONS} size="large" />
            </Form.Item>
            <Form.Item name="type" label="Loại thông báo" initialValue="info">
              <Select options={TYPE_OPTIONS} size="large" />
            </Form.Item>
            <Form.Item name="title" label="Tiêu đề" rules={[{ required: true, message: 'Nhập tiêu đề' }]}>
              <Input size="large" placeholder="VD: Thông báo nghỉ lễ" maxLength={100} showCount />
            </Form.Item>
            <Form.Item name="message" label="Nội dung" rules={[{ required: true, message: 'Nhập nội dung' }]}>
              <Input.TextArea rows={4} placeholder="Nội dung thông báo..." maxLength={500} showCount />
            </Form.Item>
            <Form.Item name="link" label="Đường dẫn (tùy chọn)">
              <Input size="large" placeholder="/ho-so hoặc để trống" />
            </Form.Item>
            <Button
              type="primary"
              size="large"
              icon={<SendOutlined />}
              onClick={handleSend}
              loading={sending}
              block
              style={{ backgroundColor: '#4f46e5', fontWeight: 600 }}
            >
              Gửi thông báo
            </Button>
          </Form>
        </Card>

        <Card className="border-0 shadow-md rounded-2xl">
          <h3 className="font-bold text-gray-900 mb-4">Lịch sử gửi trong phiên</h3>
          <Divider className="mt-0" />
          {history.length === 0 ? (
            <div className="text-center text-gray-400 py-12">Chưa có thông báo nào được gửi</div>
          ) : (
            <Table
              dataSource={history}
              columns={columns}
              rowKey="key"
              size="small"
              pagination={false}
            />
          )}
        </Card>
      </div>
    </div>
  );
}
