import { useEffect, useState } from 'react';
import { Card, Table, Tag, Button, Modal, Form, Input, Select, InputNumber, DatePicker, message, Popconfirm } from 'antd';
import { PlusOutlined, EditOutlined, TeamOutlined, UserAddOutlined, SyncOutlined, DeleteOutlined } from '@ant-design/icons';
import dayjs from 'dayjs';
import api from '../../services/api';
import type { ApiResponse } from '../../types';

interface ProgramOption {
  _id: string;
  name: string;
  language: string;
  level_code: string;
}

interface CourseClass {
  _id: string;
  code: string;
  name: string;
  language: string;
  level_code: string;
  program_id?: string | ProgramOption;
  teacher_name?: string;
  facility?: string;
  schedule?: string;
  start_date?: string;
  end_date?: string;
  max_students: number;
  current_students: number;
  status: 'open' | 'full' | 'closed' | 'completed';
  note?: string;
}

interface ClassEnrollment {
  _id: string;
  user_id?: { email?: string; full_name?: string; phone?: string };
  student_full_name?: string;
  parent_phone?: string;
  document_number?: string;
  language?: string;
  level?: string;
  exam_level_passed?: string;
  exam_score?: number;
  program_name?: string;
  class_id?: string;
  status?: string;
}

const LANGUAGE_OPTIONS = [
  { value: 'english', label: 'Tiếng Anh' },
  { value: 'japanese', label: 'Tiếng Nhật' },
  { value: 'korean', label: 'Tiếng Hàn' },
  { value: 'chinese', label: 'Tiếng Trung' },
  { value: 'french', label: 'Tiếng Pháp' },
];

const LANG_LABELS: Record<string, string> = {
  english: 'Tiếng Anh',
  japanese: 'Tiếng Nhật',
  korean: 'Tiếng Hàn',
  chinese: 'Tiếng Trung',
  french: 'Tiếng Pháp',
};

const STATUS_LABELS: Record<string, string> = {
  open: 'Đang mở',
  full: 'Đủ sĩ số',
  closed: 'Đã đóng',
  completed: 'Hoàn thành',
};

const STATUS_COLORS: Record<string, string> = {
  open: 'green',
  full: 'orange',
  closed: 'red',
  completed: 'blue',
};

export default function AdminClasses() {
  const [classes, setClasses] = useState<CourseClass[]>([]);
  const [programs, setPrograms] = useState<ProgramOption[]>([]);
  const [students, setStudents] = useState<ClassEnrollment[]>([]);
  const [eligible, setEligible] = useState<ClassEnrollment[]>([]);
  const [activeClass, setActiveClass] = useState<CourseClass | null>(null);
  const [selectedEnrollmentId, setSelectedEnrollmentId] = useState<string>();
  const [loading, setLoading] = useState(false);
  const [loadingRoster, setLoadingRoster] = useState(false);
  const [modal, setModal] = useState(false);
  const [manageModal, setManageModal] = useState(false);
  const [editing, setEditing] = useState<CourseClass | null>(null);
  const [form] = Form.useForm();

  const loadClasses = async () => {
    setLoading(true);
    try {
      const res = await api.get<ApiResponse<CourseClass[]>>('/admin/classes');
      setClasses(res.data.data || []);
    } catch {
      message.error('Không thể tải danh sách lớp');
    } finally {
      setLoading(false);
    }
  };

  const loadPrograms = async () => {
    try {
      const res = await api.get<ApiResponse<ProgramOption[]>>('/admin/programs');
      setPrograms(res.data.data || []);
    } catch {
      setPrograms([]);
    }
  };

  useEffect(() => {
    loadClasses();
    loadPrograms();
  }, []);

  const openCreate = () => {
    setEditing(null);
    form.resetFields();
    form.setFieldsValue({ max_students: 25, status: 'open' });
    setModal(true);
  };

  const openEdit = (record: CourseClass) => {
    setEditing(record);
    form.setFieldsValue({
      ...record,
      program_id: typeof record.program_id === 'object' ? record.program_id._id : record.program_id,
      start_date: record.start_date ? dayjs(record.start_date) : undefined,
      end_date: record.end_date ? dayjs(record.end_date) : undefined,
    });
    setModal(true);
  };

  const handleSave = async () => {
    const values = await form.validateFields();
    const payload = {
      ...values,
      start_date: values.start_date ? values.start_date.format('YYYY-MM-DD') : undefined,
      end_date: values.end_date ? values.end_date.format('YYYY-MM-DD') : undefined,
    };

    try {
      if (editing) {
        await api.put(`/admin/classes/${editing._id}`, payload);
        message.success('Đã cập nhật lớp');
      } else {
        await api.post('/admin/classes', payload);
        message.success('Đã tạo lớp');
      }
      setModal(false);
      form.resetFields();
      loadClasses();
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } }).response?.data?.message || 'Lưu lớp thất bại';
      message.error(msg);
    }
  };

  const loadRoster = async (klass: CourseClass, search = '') => {
    setLoadingRoster(true);
    try {
      const [studentsRes, eligibleRes] = await Promise.all([
        api.get<ApiResponse<ClassEnrollment[]>>(`/admin/classes/${klass._id}/students`),
        api.get<ApiResponse<ClassEnrollment[]>>(`/admin/classes/${klass._id}/eligible-enrollments`, { params: { search } }),
      ]);
      setStudents(studentsRes.data.data || []);
      setEligible(eligibleRes.data.data || []);
    } catch {
      message.error('Không thể tải dữ liệu xếp lớp');
    } finally {
      setLoadingRoster(false);
    }
  };

  const openManage = (klass: CourseClass) => {
    setActiveClass(klass);
    setSelectedEnrollmentId(undefined);
    setManageModal(true);
    loadRoster(klass);
  };

  const handleAssign = async () => {
    if (!activeClass || !selectedEnrollmentId) {
      message.warning('Vui lòng chọn học viên');
      return;
    }
    try {
      await api.post(`/admin/classes/${activeClass._id}/assign-enrollment`, { enrollment_id: selectedEnrollmentId });
      message.success('Đã xếp học viên vào lớp');
      setSelectedEnrollmentId(undefined);
      loadClasses();
      loadRoster(activeClass);
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } }).response?.data?.message || 'Xếp lớp thất bại';
      message.error(msg);
    }
  };

  const handleAutoAssign = async () => {
    if (!activeClass) return;
    try {
      const res = await api.post<ApiResponse<{ matched: number; assigned: number; skipped: number }>>(`/admin/classes/${activeClass._id}/auto-assign`);
      const result = res.data.data;
      message.success(`Đã xếp ${result.assigned}/${result.matched} học viên, bỏ qua ${result.skipped}`);
      loadClasses();
      loadRoster(activeClass);
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } }).response?.data?.message || 'Xếp tự động thất bại';
      message.error(msg);
    }
  };

  const handleRemove = async (enrollmentId: string) => {
    if (!activeClass) return;
    try {
      await api.delete(`/admin/classes/${activeClass._id}/students/${enrollmentId}`);
      message.success('Đã gỡ học viên khỏi lớp');
      loadClasses();
      loadRoster(activeClass);
    } catch {
      message.error('Gỡ học viên thất bại');
    }
  };

  const classColumns = [
    {
      title: 'Lớp',
      key: 'class',
      width: 260,
      render: (_: unknown, r: CourseClass) => (
        <div>
          <p className="font-semibold text-gray-900">{r.name}</p>
          <p className="text-xs text-gray-400">{r.code}</p>
        </div>
      ),
    },
    { title: 'Ngôn ngữ', dataIndex: 'language', key: 'language', width: 110, render: (v: string) => LANG_LABELS[v] || v },
    { title: 'Cấp độ', dataIndex: 'level_code', key: 'level_code', width: 90, render: (v: string) => <Tag color="purple">{v}</Tag> },
    {
      title: 'Chương trình',
      dataIndex: 'program_id',
      key: 'program',
      width: 220,
      render: (v: CourseClass['program_id']) => typeof v === 'object' ? v.name : <span className="text-gray-300">Theo cấp độ</span>,
    },
    { title: 'Giáo viên', dataIndex: 'teacher_name', key: 'teacher_name', width: 130, render: (v: string) => v || '—' },
    { title: 'Lịch học', dataIndex: 'schedule', key: 'schedule', render: (v: string) => v || '—' },
    {
      title: 'Sĩ số',
      key: 'size',
      width: 110,
      render: (_: unknown, r: CourseClass) => `${r.current_students}/${r.max_students}`,
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
      width: 180,
      render: (_: unknown, r: CourseClass) => (
        <div className="flex gap-2">
          <Button size="small" icon={<TeamOutlined />} onClick={() => openManage(r)}>Xếp lớp</Button>
          <Button size="small" icon={<EditOutlined />} onClick={() => openEdit(r)} />
        </div>
      ),
    },
  ];

  const studentColumns = [
    { title: 'Học viên', dataIndex: 'student_full_name', key: 'student_full_name', render: (v: string, r: ClassEnrollment) => v || r.user_id?.full_name || '—' },
    { title: 'Mã hồ sơ', dataIndex: 'document_number', key: 'document_number', width: 120, render: (v: string) => v || '—' },
    { title: 'Level', key: 'level', width: 90, render: (_: unknown, r: ClassEnrollment) => r.exam_level_passed || r.level || '—' },
    { title: 'Điểm', dataIndex: 'exam_score', key: 'exam_score', width: 80, render: (v: number) => v ?? '—' },
    { title: 'Chương trình', dataIndex: 'program_name', key: 'program_name', render: (v: string) => v || '—' },
    {
      title: '',
      key: 'remove',
      width: 60,
      render: (_: unknown, r: ClassEnrollment) => (
        <Popconfirm title="Gỡ học viên khỏi lớp?" onConfirm={() => handleRemove(r._id)} okText="Gỡ" cancelText="Huỷ">
          <Button size="small" danger icon={<DeleteOutlined />} />
        </Popconfirm>
      ),
    },
  ];

  return (
    <div className="p-6">
      <div className="mb-6 flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Quản lý lớp học</h1>
          <p className="mt-1 text-gray-500">Tạo lớp theo cấp độ và xếp học viên sau tuyển sinh</p>
        </div>
        <Button type="primary" icon={<PlusOutlined />} onClick={openCreate} style={{ backgroundColor: '#4f46e5' }}>
          Tạo lớp
        </Button>
      </div>

      <Card className="border-0 shadow-md rounded-2xl">
        <Table
          dataSource={classes}
          columns={classColumns}
          rowKey="_id"
          loading={loading}
          scroll={{ x: 1200 }}
          pagination={{ pageSize: 12, showTotal: (t) => `${t} lớp` }}
        />
      </Card>

      <Modal
        title={editing ? 'Cập nhật lớp học' : 'Tạo lớp học'}
        open={modal}
        onOk={handleSave}
        onCancel={() => setModal(false)}
        okText={editing ? 'Lưu' : 'Tạo'}
        cancelText="Huỷ"
        okButtonProps={{ style: { backgroundColor: '#4f46e5' } }}
        width={680}
      >
        <Form form={form} layout="vertical" className="mt-4">
          <div className="grid grid-cols-2 gap-4">
            <Form.Item name="code" label="Mã lớp">
              <Input placeholder="Bỏ trống để tự sinh" />
            </Form.Item>
            <Form.Item name="name" label="Tên lớp" rules={[{ required: true, message: 'Nhập tên lớp' }]}>
              <Input placeholder="VD: Tiếng Anh B1 - Tối T2/T4" />
            </Form.Item>
          </div>
          <div className="grid grid-cols-3 gap-4">
            <Form.Item name="language" label="Ngôn ngữ" rules={[{ required: true }]}>
              <Select options={LANGUAGE_OPTIONS} />
            </Form.Item>
            <Form.Item name="level_code" label="Cấp độ" rules={[{ required: true, message: 'Nhập cấp độ' }]}>
              <Input placeholder="VD: B1, N3" />
            </Form.Item>
            <Form.Item name="max_students" label="Sĩ số tối đa" rules={[{ required: true }]}>
              <InputNumber min={1} max={200} className="w-full" />
            </Form.Item>
          </div>
          <Form.Item name="program_id" label="Chương trình đào tạo">
            <Select
              allowClear
              showSearch
              placeholder="Có thể bỏ trống để xếp theo cấp độ"
              optionFilterProp="label"
              options={programs.map((p) => ({
                value: p._id,
                label: `${p.name} - ${LANG_LABELS[p.language] || p.language} - ${p.level_code}`,
              }))}
            />
          </Form.Item>
          <div className="grid grid-cols-2 gap-4">
            <Form.Item name="teacher_name" label="Giáo viên phụ trách">
              <Input placeholder="Tên giáo viên" />
            </Form.Item>
            <Form.Item name="facility" label="Cơ sở/phòng học">
              <Input placeholder="VD: Cơ sở Hà Nội - P201" />
            </Form.Item>
          </div>
          <Form.Item name="schedule" label="Lịch học">
            <Input placeholder="VD: Tối Thứ 2/4/6, 18:30 - 20:30" />
          </Form.Item>
          <div className="grid grid-cols-3 gap-4">
            <Form.Item name="start_date" label="Ngày bắt đầu">
              <DatePicker className="w-full" format="DD/MM/YYYY" />
            </Form.Item>
            <Form.Item name="end_date" label="Ngày kết thúc">
              <DatePicker className="w-full" format="DD/MM/YYYY" />
            </Form.Item>
            <Form.Item name="status" label="Trạng thái">
              <Select
                options={[
                  { value: 'open', label: 'Đang mở' },
                  { value: 'full', label: 'Đủ sĩ số' },
                  { value: 'closed', label: 'Đã đóng' },
                  { value: 'completed', label: 'Hoàn thành' },
                ]}
              />
            </Form.Item>
          </div>
          <Form.Item name="note" label="Ghi chú">
            <Input.TextArea rows={3} />
          </Form.Item>
        </Form>
      </Modal>

      <Modal
        title={activeClass ? `Xếp lớp: ${activeClass.name}` : 'Xếp lớp'}
        open={manageModal}
        onCancel={() => setManageModal(false)}
        footer={null}
        width={1100}
      >
        {activeClass && (
          <div className="mt-4 space-y-4">
            <div className="rounded-lg border border-gray-100 bg-gray-50 p-3">
              <p className="font-semibold text-gray-900">{activeClass.code} - {activeClass.name}</p>
              <p className="mt-1 text-sm text-gray-500">
                {LANG_LABELS[activeClass.language] || activeClass.language} - {activeClass.level_code} - Sĩ số {activeClass.current_students}/{activeClass.max_students}
              </p>
            </div>

            <div className="flex flex-wrap gap-2">
              <Input.Search
                allowClear
                className="max-w-md"
                placeholder="Tìm học viên đủ điều kiện"
                enterButton="Tìm"
                onSearch={(value) => loadRoster(activeClass, value)}
              />
              <Select
                showSearch
                className="min-w-96"
                placeholder="Chọn học viên đủ điều kiện"
                value={selectedEnrollmentId}
                onChange={setSelectedEnrollmentId}
                optionFilterProp="label"
                options={eligible.map((e) => ({
                  value: e._id,
                  label: `${e.student_full_name || e.user_id?.full_name || 'Chưa có tên'} - ${e.document_number || 'Chưa có mã'} - ${e.program_name || ''}`,
                }))}
              />
              <Button icon={<UserAddOutlined />} onClick={handleAssign} disabled={!selectedEnrollmentId}>
                Xếp vào lớp
              </Button>
              <Button icon={<SyncOutlined />} onClick={handleAutoAssign}>
                Tự động xếp theo cấp độ
              </Button>
            </div>

            <Table
              dataSource={students}
              columns={studentColumns}
              rowKey="_id"
              loading={loadingRoster}
              pagination={{ pageSize: 8, showTotal: (t) => `${t} học viên` }}
            />
          </div>
        )}
      </Modal>
    </div>
  );
}
