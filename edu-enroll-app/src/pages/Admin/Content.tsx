import { useEffect, useState } from 'react';
import { Button, Card, Form, Input, InputNumber, Modal, Popconfirm, Select, Switch, Table, Tabs, Tag, message } from 'antd';
import { DeleteOutlined, EditOutlined, PlusOutlined } from '@ant-design/icons';
import api from '../../services/api';
import type { ApiResponse } from '../../types';

interface Banner {
  _id: string;
  title: string;
  subtitle?: string;
  image_url?: string;
  link_url?: string;
  position: string;
  is_active: boolean;
  sort_order: number;
}

interface NewsItem {
  _id: string;
  title: string;
  slug: string;
  summary?: string;
  category: string;
  status: string;
  published_at?: string;
}

interface ConfigItem {
  _id: string;
  key: string;
  value: string;
  group: string;
  description?: string;
}

export default function AdminContent() {
  const [banners, setBanners] = useState<Banner[]>([]);
  const [news, setNews] = useState<NewsItem[]>([]);
  const [configs, setConfigs] = useState<ConfigItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [modal, setModal] = useState<'banner' | 'news' | 'config' | null>(null);
  const [editing, setEditing] = useState<Banner | NewsItem | ConfigItem | null>(null);
  const [form] = Form.useForm();
  const [saving, setSaving] = useState(false);

  const load = async () => {
    setLoading(true);
    try {
      const [bannerRes, newsRes, configRes] = await Promise.all([
        api.get<ApiResponse<Banner[]>>('/admin/banners'),
        api.get<ApiResponse<NewsItem[]>>('/admin/news'),
        api.get<ApiResponse<ConfigItem[]>>('/admin/configs'),
      ]);
      setBanners(bannerRes.data.data || []);
      setNews(newsRes.data.data || []);
      setConfigs(configRes.data.data || []);
    } catch {
      message.error('Không thể tải nội dung');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const openModal = (type: 'banner' | 'news' | 'config', record?: Banner | NewsItem | ConfigItem) => {
    setModal(type);
    setEditing(record || null);
    form.resetFields();
    if (record) form.setFieldsValue(record);
    if (!record && type === 'banner') form.setFieldsValue({ position: 'home', is_active: true, sort_order: 0 });
    if (!record && type === 'news') form.setFieldsValue({ category: 'announcement', status: 'draft' });
    if (!record && type === 'config') form.setFieldsValue({ group: 'general' });
  };

  const handleSave = async () => {
    if (!modal) return;
    const values = await form.validateFields();
    setSaving(true);
    try {
      if (modal === 'banner') {
        if (editing) await api.put(`/admin/banners/${editing._id}`, values);
        else await api.post('/admin/banners', values);
      }
      if (modal === 'news') {
        if (editing) await api.put(`/admin/news/${editing._id}`, values);
        else await api.post('/admin/news', values);
      }
      if (modal === 'config') await api.post('/admin/configs', values);
      message.success('Đã lưu nội dung');
      setModal(null);
      setEditing(null);
      form.resetFields();
      load();
    } catch {
      message.error('Lưu nội dung thất bại');
    } finally {
      setSaving(false);
    }
  };

  const publishExamRooms = async () => {
    try {
      await api.post('/admin/exam-rooms/publish');
      message.success('Đã công bố phòng thi. Học sinh có thể tra cứu phòng thi và số báo danh.');
      load();
    } catch {
      message.error('Công bố phòng thi thất bại');
    }
  };

  const deleteItem = async (type: 'banner' | 'news', id: string) => {
    try {
      await api.delete(`/admin/${type === 'banner' ? 'banners' : 'news'}/${id}`);
      message.success(type === 'banner' ? 'Đã ẩn banner' : 'Đã lưu trữ tin');
      load();
    } catch {
      message.error('Thao tác thất bại');
    }
  };

  const bannerColumns = [
    { title: 'Tiêu đề', dataIndex: 'title', key: 'title' },
    { title: 'Vị trí', dataIndex: 'position', key: 'position', width: 100 },
    { title: 'Thứ tự', dataIndex: 'sort_order', key: 'sort_order', width: 90 },
    { title: 'Trạng thái', dataIndex: 'is_active', key: 'is_active', width: 120, render: (v: boolean) => <Tag color={v ? 'success' : 'default'}>{v ? 'Đang hiện' : 'Đã ẩn'}</Tag> },
    {
      title: 'Thao tác',
      key: 'action',
      width: 100,
      render: (_: unknown, r: Banner) => (
        <div className="flex gap-2">
          <Button size="small" icon={<EditOutlined />} onClick={() => openModal('banner', r)} />
          <Popconfirm title="Ẩn banner này?" onConfirm={() => deleteItem('banner', r._id)} okText="Ẩn" cancelText="Hủy">
            <Button size="small" danger icon={<DeleteOutlined />} />
          </Popconfirm>
        </div>
      ),
    },
  ];

  const newsColumns = [
    { title: 'Tiêu đề', dataIndex: 'title', key: 'title' },
    { title: 'Slug', dataIndex: 'slug', key: 'slug', width: 180 },
    { title: 'Danh mục', dataIndex: 'category', key: 'category', width: 120 },
    { title: 'Trạng thái', dataIndex: 'status', key: 'status', width: 120, render: (v: string) => <Tag color={v === 'published' ? 'success' : v === 'archived' ? 'default' : 'processing'}>{v}</Tag> },
    {
      title: 'Thao tác',
      key: 'action',
      width: 100,
      render: (_: unknown, r: NewsItem) => (
        <div className="flex gap-2">
          <Button size="small" icon={<EditOutlined />} onClick={() => openModal('news', r)} />
          <Popconfirm title="Lưu trữ tin này?" onConfirm={() => deleteItem('news', r._id)} okText="Lưu trữ" cancelText="Hủy">
            <Button size="small" danger icon={<DeleteOutlined />} />
          </Popconfirm>
        </div>
      ),
    },
  ];

  const configColumns = [
    { title: 'Key', dataIndex: 'key', key: 'key', width: 180, render: (v: string) => <span className="font-mono text-xs">{v}</span> },
    { title: 'Value', dataIndex: 'value', key: 'value' },
    { title: 'Nhóm', dataIndex: 'group', key: 'group', width: 120 },
    { title: 'Mô tả', dataIndex: 'description', key: 'description' },
    { title: 'Thao tác', key: 'action', width: 80, render: (_: unknown, r: ConfigItem) => <Button size="small" icon={<EditOutlined />} onClick={() => openModal('config', r)} /> },
  ];

  const modalTitle = modal === 'banner' ? 'Banner' : modal === 'news' ? 'Tin tức' : 'Cấu hình';

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Nội dung & cấu hình</h1>
        <p className="text-gray-500 mt-1">Quản lý banner, tin tức tuyển sinh và cấu hình hệ thống</p>
      </div>

      <Tabs
        items={[
          {
            key: 'banners',
            label: 'Banner',
            children: (
              <Card className="border-0 shadow-md rounded-2xl">
                <div className="mb-4 flex justify-end">
                  <Button type="primary" icon={<PlusOutlined />} onClick={() => openModal('banner')} style={{ backgroundColor: '#4f46e5' }}>Thêm banner</Button>
                </div>
                <Table dataSource={banners} columns={bannerColumns} rowKey="_id" loading={loading} />
              </Card>
            ),
          },
          {
            key: 'news',
            label: 'Tin tức',
            children: (
              <Card className="border-0 shadow-md rounded-2xl">
                <div className="mb-4 flex justify-end">
                  <Button type="primary" icon={<PlusOutlined />} onClick={() => openModal('news')} style={{ backgroundColor: '#4f46e5' }}>Thêm tin</Button>
                </div>
                <Table dataSource={news} columns={newsColumns} rowKey="_id" loading={loading} />
              </Card>
            ),
          },
          {
            key: 'configs',
            label: 'Cấu hình',
            children: (
              <Card className="border-0 shadow-md rounded-2xl">
                <div className="mb-4 flex justify-end gap-2">
                  <Button onClick={publishExamRooms}>Công bố phòng thi</Button>
                  <Button type="primary" icon={<PlusOutlined />} onClick={() => openModal('config')} style={{ backgroundColor: '#4f46e5' }}>Thêm cấu hình</Button>
                </div>
                <Table dataSource={configs} columns={configColumns} rowKey="_id" loading={loading} />
              </Card>
            ),
          },
        ]}
      />

      <Modal
        title={`${editing ? 'Chỉnh sửa' : 'Thêm'} ${modalTitle}`}
        open={!!modal}
        onOk={handleSave}
        onCancel={() => { setModal(null); setEditing(null); form.resetFields(); }}
        okText="Lưu"
        cancelText="Hủy"
        okButtonProps={{ loading: saving, style: { backgroundColor: '#4f46e5' } }}
        width={640}
      >
        <Form form={form} layout="vertical" className="mt-4">
          {modal === 'banner' && (
            <>
              <Form.Item name="title" label="Tiêu đề" rules={[{ required: true }]}><Input /></Form.Item>
              <Form.Item name="subtitle" label="Mô tả ngắn"><Input /></Form.Item>
              <Form.Item name="image_url" label="URL hình ảnh"><Input /></Form.Item>
              <Form.Item name="link_url" label="URL liên kết"><Input /></Form.Item>
              <div className="grid grid-cols-3 gap-4">
                <Form.Item name="position" label="Vị trí"><Input /></Form.Item>
                <Form.Item name="sort_order" label="Thứ tự"><InputNumber className="w-full" /></Form.Item>
                <Form.Item name="is_active" label="Hiển thị" valuePropName="checked"><Switch /></Form.Item>
              </div>
            </>
          )}
          {modal === 'news' && (
            <>
              <Form.Item name="title" label="Tiêu đề" rules={[{ required: true }]}><Input /></Form.Item>
              <Form.Item name="slug" label="Slug"><Input placeholder="Tự sinh nếu bỏ trống" /></Form.Item>
              <div className="grid grid-cols-2 gap-4">
                <Form.Item name="category" label="Danh mục"><Input /></Form.Item>
                <Form.Item name="status" label="Trạng thái"><Select options={[{ value: 'draft', label: 'Nháp' }, { value: 'published', label: 'Xuất bản' }, { value: 'archived', label: 'Lưu trữ' }]} /></Form.Item>
              </div>
              <Form.Item name="summary" label="Tóm tắt"><Input.TextArea rows={2} /></Form.Item>
              <Form.Item name="content" label="Nội dung"><Input.TextArea rows={6} /></Form.Item>
            </>
          )}
          {modal === 'config' && (
            <>
              <Form.Item name="key" label="Key" rules={[{ required: true }]}><Input disabled={!!editing} /></Form.Item>
              <Form.Item name="value" label="Value" rules={[{ required: true }]}><Input.TextArea rows={3} /></Form.Item>
              <Form.Item name="group" label="Nhóm"><Input /></Form.Item>
              <Form.Item name="description" label="Mô tả"><Input /></Form.Item>
            </>
          )}
        </Form>
      </Modal>
    </div>
  );
}
