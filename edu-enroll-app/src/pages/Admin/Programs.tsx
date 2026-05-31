import { useEffect, useState } from 'react';
import { Card, Table, Tag, Button, Modal, Form, Input, Select, InputNumber, message, Popconfirm, Switch, Upload } from 'antd';
import { PlusOutlined, EditOutlined, DeleteOutlined, DownloadOutlined, UploadOutlined } from '@ant-design/icons';
import api from '../../services/api';
import type { ApiResponse } from '../../types';
import { downloadAdminCsv, formatImportResult, importAdminCsv } from '../../utils/adminCsv';

interface Program {
  _id: string;
  name: string;
  language: string;
  level_code: string;
  duration_months: number;
  sessions_per_week: number;
  tuition_fee: number;
  min_score?: number;
  description: string;
  is_active: boolean;
}

const LANGUAGE_OPTIONS = [
  { value: 'english', label: 'Tiếng Anh' },
  { value: 'japanese', label: 'Tiếng Nhật' },
  { value: 'korean', label: 'Tiếng Hàn' },
  { value: 'chinese', label: 'Tiếng Trung' },
  { value: 'french', label: 'Tiếng Pháp' },
];

const LANG_LABELS: Record<string, string> = {
  english: 'Tiếng Anh', japanese: 'Tiếng Nhật',
  korean: 'Tiếng Hàn', chinese: 'Tiếng Trung', french: 'Tiếng Pháp',
};

export default function AdminPrograms() {
  const [data, setData] = useState<Program[]>([]);
  const [loading, setLoading] = useState(false);
  const [modal, setModal] = useState(false);
  const [editing, setEditing] = useState<Program | null>(null);
  const [form] = Form.useForm();
  const [saving, setSaving] = useState(false);

  const load = async () => {
    setLoading(true);
    try {
      const res = await api.get<ApiResponse<Program[]>>('/admin/programs');
      setData(res.data.data || []);
    } catch {
      message.error('Không thể tải danh sách chương trình');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const openCreate = () => {
    setEditing(null);
    form.resetFields();
    setModal(true);
  };

  const openEdit = (record: Program) => {
    setEditing(record);
    form.setFieldsValue(record);
    setModal(true);
  };

  const handleSave = async () => {
    const values = await form.validateFields();
    setSaving(true);
    try {
      if (editing) {
        await api.put(`/admin/programs/${editing._id}`, values);
        message.success('Cập nhật thành công');
      } else {
        await api.post('/admin/programs', { ...values, is_active: true });
        message.success('Tạo chương trình thành công');
      }
      setModal(false);
      form.resetFields();
      load();
    } catch {
      message.error('Thao tác thất bại');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await api.delete(`/admin/programs/${id}`);
      message.success('Đã vô hiệu hoá chương trình');
      load();
    } catch {
      message.error('Thao tác thất bại');
    }
  };

  const handleExport = async () => {
    try {
      await downloadAdminCsv('programs', 'programs.csv');
    } catch {
      message.error('Xuất dữ liệu thất bại');
    }
  };

  const handleImport = async (file: File) => {
    try {
      const result = await importAdminCsv('programs', file);
      message.success(formatImportResult(result));
      if (result.errors?.length) message.warning(result.errors.slice(0, 3).join('; '));
      load();
    } catch {
      message.error('Nhập dữ liệu thất bại');
    }
  };

  const formatCurrency = (v: number) => v?.toLocaleString('vi-VN') + ' ₫';

  const columns = [
    { title: 'Tên chương trình', dataIndex: 'name', key: 'name', width: 280 },
    {
      title: 'Ngôn ngữ',
      dataIndex: 'language',
      key: 'language',
      width: 110,
      render: (v: string) => LANG_LABELS[v] || v,
    },
    { title: 'Cấp độ', dataIndex: 'level_code', key: 'level_code', width: 80 },
    { title: 'Thời gian', dataIndex: 'duration_months', key: 'duration_months', width: 100, render: (v: number) => `${v} tháng` },
    { title: 'Buổi/tuần', dataIndex: 'sessions_per_week', key: 'sessions_per_week', width: 90, render: (v: number) => `${v} buổi` },
    { title: 'Điểm tối thiểu', dataIndex: 'min_score', key: 'min_score', width: 120, render: (v: number) => v ?? 0 },
    { title: 'Học phí', dataIndex: 'tuition_fee', key: 'tuition_fee', width: 130, render: (v: number) => formatCurrency(v) },
    {
      title: 'Trạng thái',
      dataIndex: 'is_active',
      key: 'is_active',
      width: 100,
      render: (v: boolean) => <Tag color={v ? 'success' : 'default'}>{v ? 'Đang mở' : 'Đã đóng'}</Tag>,
    },
    {
      title: 'Thao tác',
      key: 'action',
      width: 100,
      render: (_: unknown, r: Program) => (
        <div className="flex gap-2">
          <Button size="small" icon={<EditOutlined />} onClick={() => openEdit(r)} />
          {r.is_active && (
            <Popconfirm title="Vô hiệu hoá chương trình này?" onConfirm={() => handleDelete(r._id)} okText="Xác nhận" cancelText="Huỷ">
              <Button size="small" danger icon={<DeleteOutlined />} />
            </Popconfirm>
          )}
        </div>
      ),
    },
  ];

  return (
    <div className="p-6">
      <div className="mb-6 flex justify-between items-start">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Quản lý chương trình đào tạo</h1>
          <p className="text-gray-500 mt-1">Cấu hình các hệ đào tạo và học phí</p>
        </div>
        <div className="flex flex-wrap gap-2">
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
          <Button type="primary" icon={<PlusOutlined />} onClick={openCreate} style={{ backgroundColor: '#4f46e5' }}>
            Thêm chương trình
          </Button>
        </div>
      </div>

      <Card className="border-0 shadow-md rounded-2xl">
        <Table
          dataSource={data}
          columns={columns}
          rowKey="_id"
          loading={loading}
          scroll={{ x: 900 }}
          pagination={{ pageSize: 15, showTotal: (t) => `${t} chương trình` }}
        />
      </Card>

      <Modal
        title={editing ? 'Chỉnh sửa chương trình' : 'Thêm chương trình mới'}
        open={modal}
        onOk={handleSave}
        onCancel={() => { setModal(false); form.resetFields(); }}
        okText={editing ? 'Lưu' : 'Tạo'}
        cancelText="Huỷ"
        okButtonProps={{ loading: saving, style: { backgroundColor: '#4f46e5' } }}
        width={580}
      >
        <Form form={form} layout="vertical" className="mt-4">
          <Form.Item name="name" label="Tên chương trình" rules={[{ required: true }]}>
            <Input placeholder="VD: Tiếng Anh B1 - Trung cấp" />
          </Form.Item>
          <div className="grid grid-cols-2 gap-4">
            <Form.Item name="language" label="Ngôn ngữ" rules={[{ required: true }]}>
              <Select options={LANGUAGE_OPTIONS} />
            </Form.Item>
            <Form.Item name="level_code" label="Mã cấp độ" rules={[{ required: true }]}>
              <Input placeholder="VD: B1, N3, K2" />
            </Form.Item>
          </div>
          <div className="grid grid-cols-3 gap-4">
            <Form.Item name="duration_months" label="Thời gian (tháng)" rules={[{ required: true }]}>
              <InputNumber min={1} max={24} className="w-full" />
            </Form.Item>
            <Form.Item name="sessions_per_week" label="Buổi/tuần" rules={[{ required: true }]}>
              <InputNumber min={1} max={7} className="w-full" />
            </Form.Item>
            <Form.Item name="tuition_fee" label="Học phí (₫)" rules={[{ required: true }]}>
              <InputNumber min={0} step={100000} className="w-full" formatter={(v) => `${v}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')} />
            </Form.Item>
          </div>
          <Form.Item name="min_score" label="Điểm tối thiểu để được chọn hệ này" initialValue={0}>
            <InputNumber min={0} max={100} className="w-full" />
          </Form.Item>
          <Form.Item name="description" label="Mô tả">
            <Input.TextArea rows={3} placeholder="Mô tả ngắn về chương trình..." />
          </Form.Item>
          {editing && (
            <Form.Item name="is_active" label="Trạng thái" valuePropName="checked">
              <Switch checkedChildren="Đang mở" unCheckedChildren="Đã đóng" />
            </Form.Item>
          )}
        </Form>
      </Modal>
    </div>
  );
}
