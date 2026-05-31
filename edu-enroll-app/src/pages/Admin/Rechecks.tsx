import { useEffect, useState } from 'react';
import { Card, Table, Tag, Button, Modal, Form, Input, Select, message } from 'antd';
import { CheckCircleOutlined, CloseCircleOutlined, EyeOutlined } from '@ant-design/icons';
import api from '../../services/api';
import type { ApiResponse } from '../../types';

interface RecheckItem {
  _id: string;
  user_id: { email: string; full_name: string } | string;
  reason: string;
  status: 'pending' | 'reviewing' | 'resolved' | 'rejected';
  admin_note?: string;
  created_at: string;
  resolved_at?: string;
}

const STATUS_COLORS: Record<string, string> = {
  pending: 'warning',
  reviewing: 'processing',
  resolved: 'success',
  rejected: 'error',
};
const STATUS_LABELS: Record<string, string> = {
  pending: 'Chờ xử lý',
  reviewing: 'Đang xem xét',
  resolved: 'Đã giải quyết',
  rejected: 'Từ chối',
};

export default function AdminRechecks() {
  const [data, setData] = useState<RecheckItem[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [statusFilter, setStatusFilter] = useState('');
  const [modal, setModal] = useState(false);
  const [active, setActive] = useState<RecheckItem | null>(null);
  const [form] = Form.useForm();
  const [saving, setSaving] = useState(false);

  const load = async (sf = statusFilter) => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page: '1', limit: '50' });
      if (sf) params.append('status', sf);
      const res = await api.get<ApiResponse<{ data: RecheckItem[]; total: number }>>(`/admin/rechecks?${params}`);
      setData(res.data.data?.data ?? []);
      setTotal(res.data.data?.total ?? 0);
    } catch {
      message.error('Không thể tải danh sách phúc khảo');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const openModal = (item: RecheckItem) => {
    setActive(item);
    form.setFieldsValue({ status: item.status, admin_note: item.admin_note || '' });
    setModal(true);
  };

  const handleSave = async () => {
    const values = await form.validateFields();
    if (!active) return;
    setSaving(true);
    try {
      await api.put(`/admin/rechecks/${active._id}`, values);
      message.success('Cập nhật phúc khảo thành công');
      setModal(false);
      load();
    } catch {
      message.error('Cập nhật thất bại');
    } finally {
      setSaving(false);
    }
  };

  const columns = [
    {
      title: 'Học viên',
      dataIndex: 'user_id',
      key: 'user',
      render: (v: RecheckItem['user_id']) => typeof v === 'object' ? (
        <div>
          <p className="font-medium">{v.full_name || '—'}</p>
          <p className="text-xs text-gray-400">{v.email}</p>
        </div>
      ) : <span className="font-mono text-xs">{String(v)}</span>,
    },
    {
      title: 'Lý do phúc khảo',
      dataIndex: 'reason',
      key: 'reason',
      ellipsis: true,
    },
    {
      title: 'Trạng thái',
      dataIndex: 'status',
      key: 'status',
      width: 130,
      render: (v: string) => <Tag color={STATUS_COLORS[v]}>{STATUS_LABELS[v]}</Tag>,
    },
    {
      title: 'Ghi chú admin',
      dataIndex: 'admin_note',
      key: 'admin_note',
      ellipsis: true,
      render: (v: string) => v || <span className="text-gray-300">—</span>,
    },
    {
      title: 'Ngày gửi',
      dataIndex: 'created_at',
      key: 'created_at',
      width: 110,
      render: (v: string) => new Date(v).toLocaleDateString('vi-VN'),
    },
    {
      title: 'Thao tác',
      key: 'action',
      width: 100,
      render: (_: unknown, r: RecheckItem) => (
        <div className="flex gap-2">
          <Button size="small" icon={<EyeOutlined />} onClick={() => openModal(r)} />
          {r.status === 'pending' && (
            <>
              <Button size="small" type="primary" icon={<CheckCircleOutlined />}
                onClick={async () => {
                  await api.put(`/admin/rechecks/${r._id}`, { status: 'reviewing', admin_note: '' });
                  message.success('Đã chuyển sang đang xem xét');
                  load();
                }}
                style={{ backgroundColor: '#4f46e5' }}
              />
              <Button size="small" danger icon={<CloseCircleOutlined />}
                onClick={async () => {
                  await api.put(`/admin/rechecks/${r._id}`, { status: 'rejected', admin_note: 'Không đủ điều kiện phúc khảo' });
                  message.success('Đã từ chối');
                  load();
                }}
              />
            </>
          )}
        </div>
      ),
    },
  ];

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Quản lý phúc khảo</h1>
        <p className="text-gray-500 mt-1">Xử lý yêu cầu phúc khảo điểm thi của học viên</p>
      </div>

      <Card className="border-0 shadow-md rounded-2xl mb-4">
        <div className="flex items-center gap-3">
          <Select
            placeholder="Lọc trạng thái"
            allowClear
            className="min-w-40"
            options={Object.entries(STATUS_LABELS).map(([k, v]) => ({ value: k, label: v }))}
            onChange={(v) => { setStatusFilter(v ?? ''); load(v ?? ''); }}
          />
          <span className="text-sm text-gray-400">{total} yêu cầu</span>
        </div>
      </Card>

      <Card className="border-0 shadow-md rounded-2xl">
        <Table
          dataSource={data}
          columns={columns}
          rowKey="_id"
          loading={loading}
          locale={{ emptyText: 'Không có yêu cầu phúc khảo nào' }}
          pagination={{ pageSize: 20, showTotal: (t) => `${t} yêu cầu` }}
        />
      </Card>

      <Modal
        title="Xử lý yêu cầu phúc khảo"
        open={modal}
        onOk={handleSave}
        onCancel={() => setModal(false)}
        okText="Lưu"
        cancelText="Huỷ"
        okButtonProps={{ loading: saving, style: { backgroundColor: '#4f46e5' } }}
      >
        {active && (
          <div className="mb-4 p-3 bg-gray-50 rounded-lg text-sm">
            <p><span className="text-gray-500">Học viên:</span> <strong>{typeof active.user_id === 'object' ? active.user_id.full_name : active.user_id}</strong></p>
            <p className="mt-1"><span className="text-gray-500">Lý do:</span> {active.reason}</p>
          </div>
        )}
        <Form form={form} layout="vertical" className="mt-2">
          <Form.Item name="status" label="Trạng thái" rules={[{ required: true }]}>
            <Select size="large" options={[
              { value: 'reviewing', label: 'Đang xem xét' },
              { value: 'resolved', label: 'Đã giải quyết' },
              { value: 'rejected', label: 'Từ chối' },
            ]} />
          </Form.Item>
          <Form.Item name="admin_note" label="Ghi chú xử lý">
            <Input.TextArea rows={3} placeholder="Nhập kết quả hoặc lý do từ chối..." />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}
