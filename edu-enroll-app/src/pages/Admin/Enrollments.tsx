import { useEffect, useState } from 'react';
import { Collapse, Form, Modal, Select, Table, Tag, Timeline, message } from 'antd';
import { Download, Edit, Eye, History, Search } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { adminService } from '../../services/admin.service';
import api from '../../services/api';
import { STATUS_LABELS } from '../../constants';
import type { EnrollmentForm } from '../../types';

interface EnrollmentLog {
  _id: string;
  action: string;
  field_name?: string;
  old_value?: string;
  new_value?: string;
  changed_by: { email: string; full_name?: string } | string;
  created_at: string;
}

const STATUS_OPTIONS = Object.entries(STATUS_LABELS).map(([k, v]) => ({ value: k, label: v }));
const STATUS_COLORS: Record<string, string> = {
  step_1: 'processing',
  step_2: 'warning',
  step_3: 'processing',
  step_4: 'processing',
  step_5: 'processing',
  step_6: 'processing',
  completed: 'success',
  cancelled: 'error',
  rejected: 'error',
};

export default function AdminEnrollments() {
  const [data, setData] = useState<EnrollmentForm[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [detail, setDetail] = useState<EnrollmentForm | null>(null);
  const [editModal, setEditModal] = useState(false);
  const [logs, setLogs] = useState<EnrollmentLog[]>([]);
  const [logsLoading, setLogsLoading] = useState(false);
  const [form] = Form.useForm();
  const [updating, setUpdating] = useState(false);

  const load = async (p = page, s = search, sf = statusFilter) => {
    setLoading(true);
    try {
      const res = await adminService.getEnrollments({ page: p, limit: 10, search: s, status: sf });
      setData(res.data);
      setTotal(res.total);
    } catch {
      message.error('Không thể tải danh sách hồ sơ');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    load();
  }, []);

  const handleSearch = () => {
    setPage(1);
    load(1, search, statusFilter);
  };

  const handleStatusFilter = (value: string) => {
    setStatusFilter(value);
    setPage(1);
    load(1, search, value);
  };

  const loadLogs = async (record: EnrollmentForm) => {
    setDetail(record);
    setEditModal(false);
    setLogsLoading(true);
    try {
      const res = await api.get<{ data: { data: EnrollmentLog[] } }>(`/admin/enrollments/${record.id}/logs`);
      setLogs(res.data?.data?.data ?? (res.data?.data as unknown as EnrollmentLog[]) ?? []);
    } catch {
      setLogs([]);
    } finally {
      setLogsLoading(false);
    }
  };

  const openEdit = (record: EnrollmentForm) => {
    setDetail(record);
    form.setFieldsValue({ status: record.status, staff_notes: record.staff_notes || '' });
    setEditModal(true);
  };

  const handleUpdate = async () => {
    const values = form.getFieldsValue();
    if (!detail) return;

    setUpdating(true);
    try {
      await adminService.updateEnrollmentStatus(detail.id, values.status, values.staff_notes);
      message.success('Cập nhật thành công');
      setEditModal(false);
      load();
    } catch {
      message.error('Cập nhật thất bại');
    } finally {
      setUpdating(false);
    }
  };

  const handleExport = async () => {
    try {
      const res = await api.get('/admin/export/enrollments', { responseType: 'blob' });
      const url = URL.createObjectURL(res.data as Blob);
      const a = document.createElement('a');
      a.href = url;
      a.setAttribute('download', 'enrollments.csv');
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch {
      message.error('Xuất dữ liệu thất bại');
    }
  };

  const columns = [
    {
      title: 'Mã HS',
      dataIndex: 'document_number',
      key: 'document_number',
      width: 110,
      render: (value: string) => <span className="font-mono text-xs">{value || '—'}</span>,
    },
    {
      title: 'Họ tên',
      dataIndex: 'student_full_name',
      key: 'student_full_name',
      render: (value: string) => value || '—',
    },
    {
      title: 'Ngoại ngữ',
      dataIndex: 'language',
      key: 'language',
      width: 100,
      render: (value: string) => value || '—',
    },
    {
      title: 'Trình độ',
      dataIndex: 'level',
      key: 'level',
      width: 80,
      render: (value: string) => value || '—',
    },
    {
      title: 'Lệ phí',
      dataIndex: 'payment_status',
      key: 'payment_status',
      width: 100,
      render: (value: string) => (
        <Tag color={value === 'success' ? 'success' : 'default'}>{value === 'success' ? 'Đã TT' : 'Chưa TT'}</Tag>
      ),
    },
    {
      title: 'Trạng thái',
      dataIndex: 'status',
      key: 'status',
      render: (value: string) => <Tag color={STATUS_COLORS[value] || 'default'}>{STATUS_LABELS[value] || value}</Tag>,
    },
    {
      title: 'Ngày tạo',
      dataIndex: 'created_at',
      key: 'created_at',
      width: 110,
      render: (value: string) => value ? new Date(value).toLocaleDateString('vi-VN') : '—',
    },
    {
      title: 'Thao tác',
      key: 'action',
      width: 120,
      render: (_: unknown, record: EnrollmentForm) => (
        <div className="flex gap-2">
          <Button type="button" variant="outline" size="icon" aria-label="Xem chi tiết" onClick={() => loadLogs(record)}>
            <Eye className="size-4" />
          </Button>
          <Button type="button" size="icon" aria-label="Cập nhật trạng thái" onClick={() => openEdit(record)}>
            <Edit className="size-4" />
          </Button>
        </div>
      ),
    },
  ];

  return (
    <div className="material-page">
      <div className="material-page-header">
        <div>
          <h1 className="material-title">Quản lý hồ sơ</h1>
          <p className="material-subtitle">Danh sách tất cả hồ sơ tuyển sinh</p>
        </div>
        <Button type="button" variant="outline" onClick={handleExport}>
          <Download className="size-4" />
          Xuất CSV
        </Button>
      </div>

      <Card>
        <CardContent className="p-4">
          <div className="flex flex-wrap gap-3">
            <label className="relative w-full max-w-sm">
              <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
              <input
                className="h-10 w-full rounded-xl border border-input bg-background py-2 pl-9 pr-3 text-sm outline-none transition-colors focus:border-ring focus:ring-2 focus:ring-ring/20"
                placeholder="Tìm theo tên, email, mã hồ sơ..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleSearch();
                }}
              />
            </label>
            <Select
              placeholder="Lọc trạng thái"
              allowClear
              className="min-w-40"
              options={STATUS_OPTIONS}
              onChange={handleStatusFilter}
            />
            <Button type="button" onClick={handleSearch}>
              Tìm kiếm
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-0">
          <Table
            dataSource={data}
            columns={columns}
            rowKey="id"
            loading={loading}
            scroll={{ x: 900 }}
            pagination={{
              current: page,
              total,
              pageSize: 10,
              onChange: (p) => { setPage(p); load(p); },
              showTotal: (count) => `${count} hồ sơ`,
            }}
          />
        </CardContent>
      </Card>

      <Modal
        title="Chi tiết hồ sơ"
        open={!!detail && !editModal}
        onCancel={() => setDetail(null)}
        footer={[
          <Button key="edit" type="button" onClick={() => detail && openEdit(detail)}>
            Cập nhật trạng thái
          </Button>,
          <Button key="close" type="button" variant="outline" onClick={() => setDetail(null)}>
            Đóng
          </Button>,
        ]}
        width={640}
      >
        {detail && (
          <div className="mt-4 space-y-3 text-sm">
            <div className="space-y-2">
              {[
                ['Mã hồ sơ', detail.document_number],
                ['Họ tên học viên', detail.student_full_name],
                ['Ngày sinh', detail.student_dob],
                ['Giới tính', detail.student_gender],
                ['CCCD/CMND', detail.student_cccd],
                ['Địa chỉ', detail.student_address],
                ['Phụ huynh', detail.parent_full_name],
                ['ĐT phụ huynh', detail.parent_phone],
                ['Ngoại ngữ', detail.language],
                ['Trình độ', detail.level],
                ['Hình thức', detail.training_type],
                ['Lịch học', detail.schedule],
                ['Cơ sở', detail.facility],
                ['Chương trình', detail.program_name],
                ['Học phí', detail.tuition_fee?.toString()],
                ['Ghi chú NV', detail.staff_notes],
              ].filter(([, value]) => value).map(([label, value]) => (
                <div key={label as string} className="flex gap-3 rounded-2xl bg-muted p-3">
                  <span className="w-32 shrink-0 text-muted-foreground">{label}</span>
                  <span className="font-medium text-foreground">{value}</span>
                </div>
              ))}
            </div>
            <Collapse
              size="small"
              items={[{
                key: 'logs',
                label: (
                  <span className="inline-flex items-center gap-2 font-medium">
                    <History className="size-4" />
                    Lịch sử thay đổi ({logs.length})
                  </span>
                ),
                children: logsLoading ? (
                  <div className="py-4 text-center text-muted-foreground">Đang tải...</div>
                ) : (
                  <Timeline
                    items={logs.map((log) => ({
                      color: log.action === 'STATUS_CHANGED' ? 'blue' : 'gray',
                      children: (
                        <div>
                          <p className="text-xs font-medium">{log.action.replace(/_/g, ' ')}</p>
                          {log.field_name && (
                            <p className="text-xs text-muted-foreground">
                              {log.field_name}: {log.old_value || '—'} → {log.new_value || '—'}
                            </p>
                          )}
                          <p className="text-xs text-muted-foreground">
                            {new Date(log.created_at).toLocaleString('vi-VN')} ·{' '}
                            {typeof log.changed_by === 'object' ? log.changed_by.email : log.changed_by}
                          </p>
                        </div>
                      ),
                    }))}
                  />
                ),
              }]}
            />
          </div>
        )}
      </Modal>

      <Modal
        title="Cập nhật trạng thái hồ sơ"
        open={editModal}
        onCancel={() => setEditModal(false)}
        footer={[
          <Button key="cancel" type="button" variant="outline" onClick={() => setEditModal(false)}>
            Hủy
          </Button>,
          <Button key="save" type="button" disabled={updating} onClick={handleUpdate}>
            {updating ? 'Đang lưu...' : 'Lưu'}
          </Button>,
        ]}
      >
        <Form form={form} layout="vertical" className="mt-4">
          <Form.Item name="status" label="Trạng thái mới" rules={[{ required: true }]}>
            <Select options={STATUS_OPTIONS} size="large" />
          </Form.Item>
          <Form.Item name="staff_notes" label="Ghi chú nội bộ">
            <textarea
              className="min-h-24 w-full resize-none rounded-xl border border-input bg-background px-3 py-2 text-sm outline-none transition-colors focus:border-ring focus:ring-2 focus:ring-ring/20"
              placeholder="Ghi chú của nhân viên..."
            />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}
