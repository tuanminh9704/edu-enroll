import { useEffect, useState } from 'react';
import { Card, Table, Tag, Button, Modal, Form, Input, Select, InputNumber, message, Popconfirm, Upload } from 'antd';
import { PlusOutlined, CloseCircleOutlined, UserAddOutlined, DownloadOutlined, UploadOutlined, HomeOutlined, ApartmentOutlined } from '@ant-design/icons';
import api from '../../services/api';
import type { ApiResponse } from '../../types';
import dayjs from 'dayjs';
import { downloadAdminCsv, formatImportResult, importAdminCsv } from '../../utils/adminCsv';
import { FIXED_EXAM_DATES } from '../../constants';

interface ExamSchedule {
  _id: string;
  title: string;
  language: string;
  exam_date: string;
  location: string;
  room?: string;
  format: string;
  max_slots: number;
  registered_slots: number;
  status: string;
}

interface EligibleEnrollment {
  _id: string;
  student_full_name?: string;
  document_number?: string;
  student_cccd?: string;
  language?: string;
  level?: string;
  preferred_exam_date?: string;
  exam_schedule_id?: string;
}

interface ExamRoom {
  _id: string;
  name: string;
  location?: string;
  capacity: number;
  assigned_count: number;
}

const LANGUAGE_OPTIONS = [
  { value: 'english', label: 'Tiếng Anh' },
  { value: 'japanese', label: 'Tiếng Nhật' },
  { value: 'korean', label: 'Tiếng Hàn' },
  { value: 'chinese', label: 'Tiếng Trung' },
  { value: 'french', label: 'Tiếng Pháp' },
];
const FORMAT_OPTIONS = [
  { value: 'offline', label: 'Trực tiếp (Offline)' },
  { value: 'online', label: 'Trực tuyến (Online)' },
];
const STATUS_COLORS: Record<string, string> = { open: 'green', closed: 'red', full: 'orange', cancelled: 'default' };
const STATUS_LABELS: Record<string, string> = { open: 'Đang mở', closed: 'Đã đóng', full: 'Hết chỗ', cancelled: 'Đã hủy' };

export default function AdminExamSchedules() {
  const [data, setData] = useState<ExamSchedule[]>([]);
  const [loading, setLoading] = useState(false);
  const [modal, setModal] = useState(false);
  const [assignModal, setAssignModal] = useState(false);
  const [activeSchedule, setActiveSchedule] = useState<ExamSchedule | null>(null);
  const [eligibleEnrollments, setEligibleEnrollments] = useState<EligibleEnrollment[]>([]);
  const [selectedEnrollmentId, setSelectedEnrollmentId] = useState<string>();
  const [loadingEligible, setLoadingEligible] = useState(false);
  const [assigning, setAssigning] = useState(false);
  const [form] = Form.useForm();
  const [roomForm] = Form.useForm();
  const [roomModal, setRoomModal] = useState(false);
  const [rooms, setRooms] = useState<ExamRoom[]>([]);
  const [loadingRooms, setLoadingRooms] = useState(false);
  const [saving, setSaving] = useState(false);

  const load = async () => {
    setLoading(true);
    try {
      const res = await api.get<ApiResponse<ExamSchedule[]>>('/admin/exam-schedules');
      setData(res.data.data || []);
    } catch {
      message.error('Không thể tải lịch thi');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const handleCreate = async () => {
    const values = await form.validateFields();
    setSaving(true);
    try {
      await api.post('/admin/exam-schedules', {
        ...values,
        exam_date: values.exam_date,
        status: 'open',
      });
      message.success('Tạo lịch thi thành công');
      setModal(false);
      form.resetFields();
      load();
    } catch {
      message.error('Tạo thất bại');
    } finally {
      setSaving(false);
    }
  };

  const handleExport = async () => {
    try {
      await downloadAdminCsv('exam-schedules', 'exam-schedules.csv');
    } catch {
      message.error('Xuất dữ liệu thất bại');
    }
  };

  const handleImport = async (file: File) => {
    try {
      const result = await importAdminCsv('exam-schedules', file);
      message.success(formatImportResult(result));
      if (result.errors?.length) message.warning(result.errors.slice(0, 3).join('; '));
      load();
    } catch {
      message.error('Nhập dữ liệu thất bại');
    }
  };

  const loadRooms = async (schedule: ExamSchedule) => {
    setLoadingRooms(true);
    try {
      const res = await api.get<ApiResponse<ExamRoom[]>>(`/admin/exam-schedules/${schedule._id}/rooms`);
      setRooms(res.data.data || []);
    } catch {
      message.error('Không thể tải phòng thi');
    } finally {
      setLoadingRooms(false);
    }
  };

  const openRooms = (schedule: ExamSchedule) => {
    setActiveSchedule(schedule);
    setRooms([]);
    setRoomModal(true);
    roomForm.resetFields();
    loadRooms(schedule);
  };

  const handleCreateRoom = async () => {
    if (!activeSchedule) return;
    const values = await roomForm.validateFields();
    try {
      await api.post(`/admin/exam-schedules/${activeSchedule._id}/rooms`, values);
      message.success('Đã thêm phòng thi');
      roomForm.resetFields();
      loadRooms(activeSchedule);
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } }).response?.data?.message || 'Thêm phòng thi thất bại';
      message.error(msg);
    }
  };

  const handleAutoAssignRooms = async (schedule: ExamSchedule) => {
    Modal.confirm({
      title: 'Xếp phòng và đánh số báo danh tự động?',
      content: 'Hệ thống sẽ xếp thí sinh vào các phòng theo sức chứa và đánh lại số báo danh theo kỳ thi.',
      okText: 'Xếp tự động',
      cancelText: 'Huỷ',
      okButtonProps: { style: { backgroundColor: '#4f46e5' } },
      onOk: async () => {
        const res = await api.post<ApiResponse<{ matched: number; assigned: number; skipped: number; full: boolean }>>(
          `/admin/exam-schedules/${schedule._id}/auto-assign-rooms`,
        );
        const result = res.data.data;
        message.success(`Đã xếp ${result.assigned}/${result.matched} thí sinh${result.full ? ', còn thí sinh chưa có phòng do hết chỗ' : ''}`);
        load();
      },
    });
  };

  const handleClose = async (id: string) => {
    try {
      await api.post(`/admin/exam-schedules/${id}/close`);
      message.success('Đã đóng lịch thi');
      load();
    } catch {
      message.error('Thao tác thất bại');
    }
  };

  const loadEligibleEnrollments = async (schedule: ExamSchedule, search = '') => {
    setLoadingEligible(true);
    try {
      const res = await api.get<ApiResponse<EligibleEnrollment[]>>(
        `/admin/exam-schedules/${schedule._id}/eligible-enrollments`,
        { params: { search } },
      );
      setEligibleEnrollments(res.data.data || []);
    } catch {
      message.error('Không thể tải danh sách hồ sơ đủ điều kiện');
    } finally {
      setLoadingEligible(false);
    }
  };

  const openAssign = (schedule: ExamSchedule) => {
    setActiveSchedule(schedule);
    setSelectedEnrollmentId(undefined);
    setAssignModal(true);
    loadEligibleEnrollments(schedule);
  };

  const handleAssign = async () => {
    if (!activeSchedule || !selectedEnrollmentId) {
      message.warning('Vui lòng chọn thí sinh');
      return;
    }

    setAssigning(true);
    try {
      await api.post(`/admin/exam-schedules/${activeSchedule._id}/assign-enrollment`, {
        enrollment_id: selectedEnrollmentId,
      });
      message.success('Đã thêm thí sinh vào kỳ thi');
      setAssignModal(false);
      setSelectedEnrollmentId(undefined);
      load();
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } }).response?.data?.message || 'Thêm thí sinh thất bại';
      message.error(msg);
    } finally {
      setAssigning(false);
    }
  };

  const handleAssignByDate = async (schedule: ExamSchedule) => {
    Modal.confirm({
      title: 'Thêm tất cả thí sinh theo ngày thi?',
      content: `Thêm các hồ sơ cùng ngôn ngữ và chọn ngày kiểm tra ${new Date(schedule.exam_date).toLocaleDateString('vi-VN')} vào kỳ thi này.`,
      okText: 'Thêm tất cả',
      cancelText: 'Huỷ',
      okButtonProps: { style: { backgroundColor: '#4f46e5' } },
      onOk: async () => {
        const res = await api.post<ApiResponse<{ matched: number; assigned: number; moved: number; skipped: number; full: boolean }>>(
          `/admin/exam-schedules/${schedule._id}/assign-by-date`,
        );
        const result = res.data.data;
        message.success(`Đã thêm ${result.assigned}, chuyển lịch ${result.moved}, bỏ qua ${result.skipped}/${result.matched}${result.full ? ' (đã hết chỗ)' : ''}`);
        load();
      },
    });
  };

  const columns = [
    { title: 'Tên kỳ thi', dataIndex: 'title', key: 'title', width: 260 },
    {
      title: 'Ngôn ngữ',
      dataIndex: 'language',
      key: 'language',
      width: 110,
      render: (v: string) => LANGUAGE_OPTIONS.find(l => l.value === v)?.label || v,
    },
    {
      title: 'Ngày thi',
      dataIndex: 'exam_date',
      key: 'exam_date',
      width: 120,
      render: (v: string) => v ? new Date(v).toLocaleDateString('vi-VN') : '-',
    },
    { title: 'Địa điểm', dataIndex: 'location', key: 'location' },
    { title: 'Phòng thi', dataIndex: 'room', key: 'room', width: 120, render: (v: string) => v || '-' },
    {
      title: 'Hình thức',
      dataIndex: 'format',
      key: 'format',
      width: 110,
      render: (v: string) => <Tag color={v === 'online' ? 'blue' : 'green'}>{v === 'online' ? 'Online' : 'Offline'}</Tag>,
    },
    {
      title: 'Chỗ đăng ký',
      key: 'slots',
      width: 120,
      render: (_: unknown, r: ExamSchedule) => `${r.registered_slots}/${r.max_slots}`,
    },
    {
      title: 'Trạng thái',
      dataIndex: 'status',
      key: 'status',
      width: 110,
      render: (v: string) => <Tag color={STATUS_COLORS[v] || 'default'}>{STATUS_LABELS[v] || v}</Tag>,
    },
    {
      title: 'Thao tác',
      key: 'action',
      width: 430,
      render: (_: unknown, r: ExamSchedule) => r.status === 'open' ? (
        <div className="flex flex-wrap gap-2">
          <Button size="small" icon={<HomeOutlined />} onClick={() => openRooms(r)}>
            Phòng thi
          </Button>
          <Button size="small" icon={<UserAddOutlined />} onClick={() => openAssign(r)}>
            Thêm thí sinh
          </Button>
          <Button size="small" onClick={() => handleAssignByDate(r)}>
            Thêm theo ngày
          </Button>
          <Button size="small" icon={<ApartmentOutlined />} onClick={() => handleAutoAssignRooms(r)}>
            Xếp phòng & SBD
          </Button>
          <Popconfirm title="Đóng lịch thi này?" onConfirm={() => handleClose(r._id)} okText="Đóng" cancelText="Huỷ">
            <Button size="small" danger icon={<CloseCircleOutlined />}>Đóng</Button>
          </Popconfirm>
        </div>
      ) : null,
    },
  ];

  return (
    <div className="p-6">
      <div className="mb-6 flex justify-between items-start">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Quản lý lịch thi</h1>
          <p className="text-gray-500 mt-1">Tạo lịch, xếp thí sinh và quản lý phòng thi</p>
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
          <Button type="primary" icon={<PlusOutlined />} onClick={() => setModal(true)} style={{ backgroundColor: '#4f46e5' }}>
            Tạo lịch thi
          </Button>
        </div>
      </div>

      <Card className="border-0 shadow-md rounded-2xl">
        <Table
          dataSource={data}
          columns={columns}
          rowKey="_id"
          loading={loading}
          scroll={{ x: 1100 }}
          pagination={{ pageSize: 10, showTotal: (t) => `${t} lịch thi` }}
        />
      </Card>

      <Modal
        title="Tạo lịch thi mới"
        open={modal}
        onOk={handleCreate}
        onCancel={() => { setModal(false); form.resetFields(); }}
        okText="Tạo"
        cancelText="Huỷ"
        okButtonProps={{ loading: saving, style: { backgroundColor: '#4f46e5' } }}
        width={560}
      >
        <Form form={form} layout="vertical" className="mt-4">
          <Form.Item name="title" label="Tên kỳ thi" rules={[{ required: true, message: 'Nhập tên kỳ thi' }]}>
            <Input placeholder="VD: Khảo sát năng lực Tiếng Anh - Tháng 7/2026" />
          </Form.Item>
          <div className="grid grid-cols-2 gap-4">
            <Form.Item name="language" label="Ngôn ngữ" rules={[{ required: true }]}>
              <Select options={LANGUAGE_OPTIONS} />
            </Form.Item>
            <Form.Item name="format" label="Hình thức" rules={[{ required: true }]}>
              <Select options={FORMAT_OPTIONS} />
            </Form.Item>
          </div>
          <Form.Item name="exam_date" label="Ngày thi cố định" rules={[{ required: true }]}>
            <Select
              placeholder="Chọn ngày thi đã cố định"
              options={FIXED_EXAM_DATES.map((date) => ({ value: date, label: dayjs(date).format('DD/MM/YYYY') }))}
            />
          </Form.Item>
          <Form.Item name="location" label="Địa điểm / Link thi" rules={[{ required: true }]}>
            <Input placeholder="VD: Cơ sở Hà Nội hoặc Zoom link" />
          </Form.Item>
          <Form.Item name="room" label="Phòng thi">
            <Input placeholder="VD: Phòng 201, Lab A, Zoom Room 1" />
          </Form.Item>
          <Form.Item name="max_slots" label="Số lượng chỗ tối đa" rules={[{ required: true }]}>
            <InputNumber min={1} max={500} className="w-full" />
          </Form.Item>
        </Form>
      </Modal>

      <Modal
        title="Phòng thi của kỳ thi"
        open={roomModal}
        onCancel={() => setRoomModal(false)}
        footer={null}
        width={760}
      >
        {activeSchedule && (
          <div className="mt-2 space-y-4">
            <div className="rounded-lg border border-gray-100 bg-gray-50 p-3">
              <p className="font-medium text-gray-900">{activeSchedule.title}</p>
              <p className="mt-1 text-sm text-gray-500">
                {new Date(activeSchedule.exam_date).toLocaleDateString('vi-VN')} - {activeSchedule.location}
              </p>
            </div>

            <Form form={roomForm} layout="inline" className="gap-2">
              <Form.Item name="name" rules={[{ required: true, message: 'Nhập tên phòng' }]}>
                <Input placeholder="Tên phòng, VD: P201" />
              </Form.Item>
              <Form.Item name="capacity" rules={[{ required: true, message: 'Nhập sức chứa' }]}>
                <InputNumber min={1} max={500} placeholder="Sức chứa" />
              </Form.Item>
              <Form.Item name="location">
                <Input placeholder="Địa điểm" />
              </Form.Item>
              <Button type="primary" icon={<PlusOutlined />} onClick={handleCreateRoom} style={{ backgroundColor: '#4f46e5' }}>
                Thêm phòng
              </Button>
            </Form>

            <Table
              dataSource={rooms}
              rowKey="_id"
              loading={loadingRooms}
              pagination={false}
              columns={[
                { title: 'Phòng', dataIndex: 'name', key: 'name' },
                { title: 'Địa điểm', dataIndex: 'location', key: 'location', render: (v: string) => v || activeSchedule.location },
                { title: 'Sức chứa', dataIndex: 'capacity', key: 'capacity', width: 100 },
                { title: 'Đã xếp', dataIndex: 'assigned_count', key: 'assigned_count', width: 100 },
              ]}
            />
          </div>
        )}
      </Modal>

      <Modal
        title="Thêm thí sinh vào kỳ thi"
        open={assignModal}
        onOk={handleAssign}
        onCancel={() => {
          setAssignModal(false);
          setSelectedEnrollmentId(undefined);
        }}
        okText="Thêm thí sinh"
        cancelText="Huỷ"
        okButtonProps={{ loading: assigning, disabled: !selectedEnrollmentId, style: { backgroundColor: '#4f46e5' } }}
        width={640}
      >
        <div className="mt-4 space-y-4">
          {activeSchedule && (
            <div className="rounded-lg border border-gray-100 bg-gray-50 p-3">
              <p className="font-medium text-gray-900">{activeSchedule.title}</p>
              <p className="mt-1 text-sm text-gray-500">
                {new Date(activeSchedule.exam_date).toLocaleDateString('vi-VN')} - {activeSchedule.location}
                {activeSchedule.room ? ` - ${activeSchedule.room}` : ''}
              </p>
              <p className="mt-1 text-sm text-gray-500">
                Chỗ đã xếp: {activeSchedule.registered_slots}/{activeSchedule.max_slots}
              </p>
            </div>
          )}

          <Input.Search
            allowClear
            placeholder="Tìm theo họ tên, mã hồ sơ hoặc CCCD"
            enterButton="Tìm"
            onSearch={(value) => activeSchedule && loadEligibleEnrollments(activeSchedule, value)}
            loading={loadingEligible}
          />

          <Select
            showSearch
            className="w-full"
            size="large"
            placeholder="Chọn hồ sơ đủ điều kiện"
            value={selectedEnrollmentId}
            onChange={setSelectedEnrollmentId}
            loading={loadingEligible}
            filterOption={(input, option) => String(option?.label || '').toLowerCase().includes(input.toLowerCase())}
            options={eligibleEnrollments.map((e) => ({
              value: e._id,
              label: `${e.student_full_name || 'Chưa có tên'} - ${e.document_number || 'Chưa có mã'} - ${e.level || 'Chưa chọn level'}${e.preferred_exam_date ? ` - ${new Date(e.preferred_exam_date).toLocaleDateString('vi-VN')}` : ''}`,
            }))}
            notFoundContent={loadingEligible ? 'Đang tải...' : 'Không có hồ sơ phù hợp'}
          />

          <p className="text-sm text-gray-500">
            Danh sách lấy hồ sơ đã thanh toán, có yêu cầu khảo sát và cùng ngôn ngữ với kỳ thi.
          </p>
        </div>
      </Modal>
    </div>
  );
}
