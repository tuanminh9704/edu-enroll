import { useEffect, useState } from 'react';
import { Button, Card, Select, Table, Tag, message } from 'antd';
import { DownloadOutlined } from '@ant-design/icons';
import api from '../../services/api';
import type { ApiResponse } from '../../types';

interface Invoice {
  _id: string;
  invoice_number: string;
  amount: number;
  status: string;
  issued_at: string;
  paid_at?: string;
  description?: string;
  user_id?: { email: string; full_name?: string };
  enrollment_id?: { student_full_name?: string; document_number?: string };
}

const STATUS_OPTIONS = [
  { value: 'draft', label: 'Nháp' },
  { value: 'issued', label: 'Đã xuất' },
  { value: 'paid', label: 'Đã thanh toán' },
  { value: 'cancelled', label: 'Đã hủy' },
];

const STATUS_COLORS: Record<string, string> = {
  draft: 'default',
  issued: 'processing',
  paid: 'success',
  cancelled: 'error',
};

const formatCurrency = (value: number) => `${value?.toLocaleString('vi-VN') || 0} ₫`;

export default function AdminInvoices() {
  const [data, setData] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(false);

  const load = async () => {
    setLoading(true);
    try {
      const res = await api.get<ApiResponse<{ data: Invoice[] }>>('/admin/invoices');
      setData(res.data.data.data || []);
    } catch {
      message.error('Không thể tải hóa đơn');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const updateStatus = async (id: string, status: string) => {
    try {
      await api.patch(`/admin/invoices/${id}/status`, { status });
      message.success('Đã cập nhật hóa đơn');
      load();
    } catch {
      message.error('Cập nhật hóa đơn thất bại');
    }
  };

  const exportCsv = () => {
    const rows = [
      ['invoice_number', 'student', 'email', 'amount', 'status', 'issued_at'],
      ...data.map((i) => [
        i.invoice_number,
        i.enrollment_id?.student_full_name || i.user_id?.full_name || '',
        i.user_id?.email || '',
        String(i.amount),
        i.status,
        i.issued_at,
      ]),
    ];
    const csv = rows.map((r) => r.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(',')).join('\n');
    const url = URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8' }));
    const a = document.createElement('a');
    a.href = url;
    a.download = 'invoices.csv';
    a.click();
    URL.revokeObjectURL(url);
  };

  const columns = [
    { title: 'Số hóa đơn', dataIndex: 'invoice_number', key: 'invoice_number', width: 150, render: (v: string) => <span className="font-mono text-xs">{v}</span> },
    {
      title: 'Học viên',
      key: 'student',
      render: (_: unknown, r: Invoice) => (
        <div>
          <p className="font-medium">{r.enrollment_id?.student_full_name || r.user_id?.full_name || '—'}</p>
          <p className="text-xs text-gray-400">{r.user_id?.email || r.enrollment_id?.document_number}</p>
        </div>
      ),
    },
    { title: 'Nội dung', dataIndex: 'description', key: 'description', render: (v: string) => v || '—' },
    { title: 'Số tiền', dataIndex: 'amount', key: 'amount', width: 130, render: formatCurrency },
    { title: 'Ngày xuất', dataIndex: 'issued_at', key: 'issued_at', width: 120, render: (v: string) => new Date(v).toLocaleDateString('vi-VN') },
    {
      title: 'Trạng thái',
      dataIndex: 'status',
      key: 'status',
      width: 160,
      render: (v: string, r: Invoice) => (
        <Select
          size="small"
          value={v}
          options={STATUS_OPTIONS}
          onChange={(status) => updateStatus(r._id, status)}
          style={{ minWidth: 140 }}
        />
      ),
    },
    { title: '', key: 'tag', width: 80, render: (_: unknown, r: Invoice) => <Tag color={STATUS_COLORS[r.status] || 'default'}>{r.status}</Tag> },
  ];

  return (
    <div className="p-6">
      <div className="mb-6 flex justify-between items-start">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Quản lý hóa đơn</h1>
          <p className="text-gray-500 mt-1">Theo dõi lịch sử thanh toán và xuất dữ liệu hóa đơn</p>
        </div>
        <Button icon={<DownloadOutlined />} onClick={exportCsv}>Xuất CSV</Button>
      </div>
      <Card className="border-0 shadow-md rounded-2xl">
        <Table dataSource={data} columns={columns} rowKey="_id" loading={loading} scroll={{ x: 900 }}
          pagination={{ pageSize: 15, showTotal: (t) => `${t} hóa đơn` }} />
      </Card>
    </div>
  );
}
