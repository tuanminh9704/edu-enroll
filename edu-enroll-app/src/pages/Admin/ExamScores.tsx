import { useEffect, useState } from 'react';
import { Alert, Card, Table, Tag, Button, Checkbox, Modal, Form, Input, InputNumber, Select, Upload, message } from 'antd';
import { ApartmentOutlined, DownloadOutlined, EditOutlined, FilterOutlined, PlusOutlined, SyncOutlined, UploadOutlined } from '@ant-design/icons';
import api from '../../services/api';
import type { ApiResponse } from '../../types';
import { downloadAdminCsv, importAdminCsv } from '../../utils/adminCsv';

interface ExamScheduleOption {
  _id: string;
  title: string;
  language: string;
  exam_date: string;
  location?: string;
  room?: string;
}

interface ExamRoom {
  _id: string;
  name: string;
  location?: string;
  capacity: number;
  assigned_count: number;
}

interface ExamRegistration {
  _id: string;
  user_id: string | { email?: string; full_name?: string } | null;
  schedule_id: string;
  room_id?: string | { name?: string; location?: string } | null;
  subject_code?: string;
  exam_code: string;
  bag_number?: string;
  anonymous_code?: string;
  attendance_status?: 'pending' | 'attended' | 'absent';
  absence_report_number?: string;
  absence_reason?: string;
  exam_violation?: boolean;
  violation_report_number?: string;
  violation_note?: string;
  status: string;
  created_at: string;
  score: { score: number; level_passed: string; pass_status?: 'passed' | 'failed'; pass_threshold?: number; status: string } | null;
}

const LEVEL_OPTIONS: Record<string, { value: string; label: string }[]> = {
  english: [
    { value: 'A1', label: 'A1 - Sơ cấp 1' }, { value: 'A2', label: 'A2 - Sơ cấp 2' },
    { value: 'B1', label: 'B1 - Trung cấp' }, { value: 'B2', label: 'B2 - Trung cao' },
    { value: 'C1', label: 'C1 - Nâng cao' }, { value: 'IELTS', label: 'IELTS' }, { value: 'TOEIC', label: 'TOEIC' },
  ],
  japanese: [
    { value: 'N5', label: 'N5' }, { value: 'N4', label: 'N4' }, { value: 'N3', label: 'N3' },
    { value: 'N2', label: 'N2' }, { value: 'N1', label: 'N1' },
  ],
  korean: [{ value: 'K1', label: 'Sơ cấp 1' }, { value: 'K2', label: 'Sơ cấp 2' }, { value: 'K3', label: 'Trung cấp' }, { value: 'TOPIK', label: 'TOPIK' }],
  chinese: [{ value: 'HSK1', label: 'HSK 1-2' }, { value: 'HSK3', label: 'HSK 3-4' }, { value: 'HSK5', label: 'HSK 5-6' }],
  french: [{ value: 'FR_A1', label: 'A1' }, { value: 'FR_A2', label: 'A2' }, { value: 'FR_B1', label: 'B1' }, { value: 'FR_B2', label: 'B2' }],
};

const LEVEL_RULES: Record<string, Array<{ min: number; level: string }>> = {
  english: [
    { min: 85, level: 'C1' },
    { min: 70, level: 'B2' },
    { min: 55, level: 'B1' },
    { min: 40, level: 'A2' },
    { min: 0, level: 'A1' },
  ],
  japanese: [
    { min: 85, level: 'N2' },
    { min: 70, level: 'N3' },
    { min: 55, level: 'N4' },
    { min: 0, level: 'N5' },
  ],
  korean: [{ min: 75, level: 'K3' }, { min: 50, level: 'K2' }, { min: 0, level: 'K1' }],
  chinese: [{ min: 75, level: 'HSK5' }, { min: 50, level: 'HSK3' }, { min: 0, level: 'HSK1' }],
  french: [{ min: 80, level: 'FR_B2' }, { min: 65, level: 'FR_B1' }, { min: 45, level: 'FR_A2' }, { min: 0, level: 'FR_A1' }],
};

const calculatePreview = (score?: number, threshold = 50, language = 'english') => {
  if (typeof score !== 'number') return null;
  const rules = LEVEL_RULES[language] || LEVEL_RULES.english;
  return {
    level: rules.find((rule) => score >= rule.min)?.level || rules[rules.length - 1].level,
    passed: score >= threshold,
  };
};

const isRecord = (value: unknown): value is Record<string, unknown> =>
  Boolean(value) && typeof value === 'object';

const renderUser = (value: ExamRegistration['user_id']) => {
  if (isRecord(value)) {
    return (
      <div>
        <p className="font-medium">{String(value.full_name || 'Chưa có tên')}</p>
        <p className="text-xs text-gray-400">{String(value.email || 'Chưa có email')}</p>
      </div>
    );
  }

  return <span className="font-mono text-xs">{value ? String(value) : 'Không tìm thấy tài khoản'}</span>;
};

const renderRoomName = (value: ExamRegistration['room_id']) => {
  if (isRecord(value)) return String(value.name || '—');
  return '—';
};

type ScorePageMode = 'entry' | 'view';

export default function AdminExamScores({ mode = 'entry' }: { mode?: ScorePageMode }) {
  const isViewMode = mode === 'view';
  const [schedules, setSchedules] = useState<ExamScheduleOption[]>([]);
  const [selectedSchedule, setSelectedSchedule] = useState<string>('');
  const [selectedLanguage, setSelectedLanguage] = useState<string>('english');
  const [registrations, setRegistrations] = useState<ExamRegistration[]>([]);
  const [loading, setLoading] = useState(false);
  const [scoreModal, setScoreModal] = useState(false);
  const [roomModal, setRoomModal] = useState(false);
  const [rooms, setRooms] = useState<ExamRoom[]>([]);
  const [loadingRooms, setLoadingRooms] = useState(false);
  const [activeReg, setActiveReg] = useState<ExamRegistration | null>(null);
  const [form] = Form.useForm();
  const [roomForm] = Form.useForm();
  const [saving, setSaving] = useState(false);
  const [schedulePassThreshold, setSchedulePassThreshold] = useState(50);
  const watchedScore = Form.useWatch('score', form);
  const watchedThreshold = Form.useWatch('pass_threshold', form);
  const watchedAttendance = Form.useWatch('attendance_status', form);
  const watchedViolation = Form.useWatch('exam_violation', form);
  const resultPreview = calculatePreview(
    typeof watchedScore === 'number' ? watchedScore : undefined,
    typeof watchedThreshold === 'number' ? watchedThreshold : 50,
    selectedLanguage,
  );

  useEffect(() => {
    api.get<ApiResponse<ExamScheduleOption[]>>('/admin/exam-schedules')
      .then((r) => setSchedules(r.data.data || []))
      .catch(() => {});
  }, []);

  const loadRegistrations = async (scheduleId: string) => {
    if (!scheduleId) return;
    setLoading(true);
    try {
      const res = await api.get<ApiResponse<ExamRegistration[]>>(`/admin/exam-registrations?scheduleId=${scheduleId}`);
      setRegistrations(res.data.data || []);
      const sch = schedules.find((s) => s._id === scheduleId);
      if (sch) setSelectedLanguage(sch.language);
    } catch {
      message.error('Không thể tải danh sách đăng ký thi');
    } finally {
      setLoading(false);
    }
  };

  const getSelectedSchedule = () => schedules.find((schedule) => schedule._id === selectedSchedule);

  const loadRooms = async (scheduleId = selectedSchedule) => {
    if (!scheduleId) return;
    setLoadingRooms(true);
    try {
      const res = await api.get<ApiResponse<ExamRoom[]>>(`/admin/exam-schedules/${scheduleId}/rooms`);
      setRooms(res.data.data || []);
    } catch {
      message.error('Không thể tải danh sách phòng thi');
    } finally {
      setLoadingRooms(false);
    }
  };

  const openRoomModal = () => {
    if (!selectedSchedule) {
      message.warning('Vui lòng chọn kỳ thi');
      return;
    }
    roomForm.resetFields();
    roomForm.setFieldsValue({ capacity: 25 });
    setRoomModal(true);
    loadRooms(selectedSchedule);
  };

  const handleCreateRoom = async () => {
    if (!selectedSchedule) return;
    const values = await roomForm.validateFields();
    try {
      await api.post(`/admin/exam-schedules/${selectedSchedule}/rooms`, values);
      const assignRes = await api.post<ApiResponse<{ matched: number; assigned: number; skipped: number; full: boolean }>>(
        `/admin/exam-schedules/${selectedSchedule}/auto-assign-rooms`,
      );
      await api.post(`/admin/exam-schedules/${selectedSchedule}/generate-bags`);
      const result = assignRes.data.data;
      message.success(
        `Đã thêm phòng và xếp lại ${result.assigned}/${result.matched} thí sinh` +
        `${result.full ? ', còn thí sinh chưa có phòng do thiếu sức chứa' : ''}.`,
      );
      roomForm.resetFields();
      roomForm.setFieldsValue({ capacity: 25 });
      loadRooms(selectedSchedule);
      loadRegistrations(selectedSchedule);
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } }).response?.data?.message || 'Thêm phòng thi thất bại';
      message.error(msg);
    }
  };

  const openScoreModal = (reg: ExamRegistration) => {
    setActiveReg(reg);
    form.setFieldsValue({
      score: reg.score?.score,
      level_passed: reg.score?.level_passed,
      pass_threshold: reg.score?.pass_threshold || 50,
      subject_code: reg.subject_code || selectedLanguage,
      bag_number: reg.bag_number || '',
      anonymous_code: reg.anonymous_code || '',
      attendance_status: reg.attendance_status || 'pending',
      absence_report_number: reg.absence_report_number || '',
      absence_reason: reg.absence_reason || '',
      exam_violation: Boolean(reg.exam_violation),
      violation_report_number: reg.violation_report_number || '',
      violation_note: reg.violation_note || '',
    });
    setScoreModal(true);
  };

  const handleSaveScore = async () => {
    const values = await form.validateFields();
    if (!activeReg) return;
    setSaving(true);
    try {
      if (values.attendance_status === 'attended' && !values.exam_violation && typeof values.score === 'number') {
        await api.post(`/admin/exam-registrations/${activeReg._id}/score-draft`, values);
        message.success('Đã lưu điểm nháp. Học viên sẽ thấy kết quả sau khi đồng bộ.');
      } else {
        const processValues = { ...values };
        delete processValues.score;
        await api.post(`/admin/exam-registrations/${activeReg._id}/process`, processValues);
        message.success('Đã lưu quy trình thi.');
      }
      setScoreModal(false);
      loadRegistrations(selectedSchedule);
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } }).response?.data?.message || 'Lưu thất bại';
      message.error(msg);
    } finally {
      setSaving(false);
    }
  };

  const handleSyncOne = async (reg: ExamRegistration) => {
    try {
      await api.post(`/admin/exam-registrations/${reg._id}/sync-score`);
      message.success('Đã đồng bộ điểm cho học viên');
      loadRegistrations(selectedSchedule);
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } }).response?.data?.message || 'Đồng bộ điểm thất bại';
      message.error(msg);
    }
  };

  const handleSyncAll = async () => {
    if (!selectedSchedule) {
      message.warning('Vui lòng chọn kỳ thi');
      return;
    }
    Modal.confirm({
      title: 'Đồng bộ điểm cho kỳ thi này?',
      content: 'Sau khi đồng bộ, học viên sẽ thấy điểm thi và trạng thái đỗ/trượt.',
      okText: 'Đồng bộ',
      cancelText: 'Huỷ',
      okButtonProps: { style: { backgroundColor: '#4f46e5' } },
      onOk: async () => {
        try {
          const res = await api.post<ApiResponse<{ matched: number; synced: number; skipped: number }>>(
            `/admin/exam-schedules/${selectedSchedule}/sync-scores`,
            { pass_threshold: schedulePassThreshold },
          );
          message.success(`Đã đồng bộ ${res.data.data.synced}, bỏ qua ${res.data.data.skipped}/${res.data.data.matched}`);
          loadRegistrations(selectedSchedule);
        } catch (err: unknown) {
          const msg = (err as { response?: { data?: { message?: string } } }).response?.data?.message || 'Đồng bộ điểm theo kỳ thi thất bại';
          message.error(msg);
        }
      },
    });
  };

  const handleGenerateBags = async () => {
    if (!selectedSchedule) {
      message.warning('Vui lòng chọn kỳ thi');
      return;
    }
    try {
      const res = await api.post<ApiResponse<{ matched: number; generated: number }>>(`/admin/exam-schedules/${selectedSchedule}/generate-bags`);
      message.success(`Đã đánh số túi và mã phách cho ${res.data.data.generated}/${res.data.data.matched} thí sinh`);
      loadRegistrations(selectedSchedule);
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } }).response?.data?.message || 'Đánh số túi/mã phách thất bại';
      message.error(msg);
    }
  };

  const handleSetupExamProcess = async () => {
    if (!selectedSchedule) {
      message.warning('Vui lòng chọn kỳ thi');
      return;
    }
    try {
      const res = await api.post<ApiResponse<{
        rooms: { total_rooms: number; created: number };
        assigned: { matched: number; assigned: number; skipped: number };
        coded: { generated: number; bag_count: number };
      }>>(`/admin/exam-schedules/${selectedSchedule}/setup-exam-process`, { room_capacity: 25, room_prefix: 'P' });
      const result = res.data.data;
      message.success(
        `Setup xong: ${result.rooms.total_rooms} phòng, xếp ${result.assigned.assigned}/${result.assigned.matched}, ` +
        `${result.coded.bag_count} túi, ${result.coded.generated} mã phách.`,
      );
      loadRegistrations(selectedSchedule);
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } }).response?.data?.message || 'Setup quy trình thi thất bại';
      message.error(msg);
    }
  };

  const handleExport = async () => {
    if (!selectedSchedule) {
      message.warning('Vui lòng chọn kỳ thi');
      return;
    }
    try {
      await downloadAdminCsv(`exam-scores?scheduleId=${selectedSchedule}`, 'exam-process-scores.csv');
    } catch {
      message.error('Xuất dữ liệu thất bại');
    }
  };

  const handleImport = async (file: File) => {
    if (!selectedSchedule) {
      message.warning('Vui lòng chọn kỳ thi trước khi nhập điểm');
      return;
    }
    try {
      const result = await importAdminCsv('exam-scores', file, { schedule_id: selectedSchedule }) as unknown as { imported: number; skipped: number; errors?: string[] };
      message.success(`Đã nhập/cập nhật ${result.imported}, bỏ qua ${result.skipped}`);
      if (result.errors?.length) message.warning(result.errors.slice(0, 3).join('; '));
      loadRegistrations(selectedSchedule);
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } }).response?.data?.message || 'Nhập dữ liệu thất bại';
      message.error(msg);
    }
  };

  const canEnterScore = (r: ExamRegistration) =>
    Boolean(r.room_id && r.exam_code && !r.exam_code.startsWith('TMP') && r.bag_number && r.anonymous_code && r.attendance_status === 'attended' && !r.exam_violation);

  const columns = [
    {
      title: 'Thí sinh',
      dataIndex: 'user_id',
      key: 'user',
      render: renderUser,
    },
    {
      title: 'Trạng thái ĐK',
      dataIndex: 'status',
      key: 'status',
      width: 130,
      render: (v: string) => <Tag color={v === 'confirmed' ? 'green' : 'default'}>{v === 'confirmed' ? 'Xác nhận' : v}</Tag>,
    },
    {
      title: 'Phòng',
      key: 'room',
      width: 110,
      render: (_: unknown, r: ExamRegistration) => renderRoomName(r.room_id),
    },
    { title: 'SBD', dataIndex: 'exam_code', key: 'exam_code', width: 120, render: (v: string) => v?.startsWith('TMP') ? <span className="text-gray-300">Chưa đánh</span> : v },
    { title: 'Môn', dataIndex: 'subject_code', key: 'subject_code', width: 90, render: (v: string) => v || <span className="text-gray-300">—</span> },
    { title: 'Số túi', dataIndex: 'bag_number', key: 'bag_number', width: 90, render: (v: string) => v || <span className="text-gray-300">—</span> },
    { title: 'Mã phách', dataIndex: 'anonymous_code', key: 'anonymous_code', width: 110, render: (v: string) => v || <span className="text-gray-300">—</span> },
    {
      title: 'Dự thi',
      dataIndex: 'attendance_status',
      key: 'attendance_status',
      width: 110,
      render: (v: ExamRegistration['attendance_status']) => {
        if (v === 'attended') return <Tag color="green">Có thi</Tag>;
        if (v === 'absent') return <Tag color="red">Vắng thi</Tag>;
        return <Tag>Chờ BB</Tag>;
      },
    },
    {
      title: 'BB vắng',
      dataIndex: 'absence_report_number',
      key: 'absence_report_number',
      width: 110,
      render: (v: string) => v || <span className="text-gray-300">—</span>,
    },
    {
      title: 'VPQC',
      dataIndex: 'exam_violation',
      key: 'exam_violation',
      width: 90,
      render: (v: boolean, r: ExamRegistration) => v ? <Tag color="red">{r.violation_report_number || 'Có'}</Tag> : <Tag color="green">Không</Tag>,
    },
    {
      title: 'Điểm',
      key: 'score',
      width: 80,
      render: (_: unknown, r: ExamRegistration) => r.score ? (
        <span className="font-bold text-indigo-600">{r.score.score}</span>
      ) : <span className="text-gray-300">—</span>,
    },
    {
      title: 'Level đạt',
      key: 'level',
      width: 100,
      render: (_: unknown, r: ExamRegistration) => r.score?.level_passed ? (
        <Tag color="purple">{r.score.level_passed}</Tag>
      ) : <span className="text-gray-300">—</span>,
    },
    {
      title: 'Kết quả',
      key: 'pass_status',
      width: 110,
      render: (_: unknown, r: ExamRegistration) => r.score?.pass_status ? (
        <Tag color={r.score.pass_status === 'passed' ? 'success' : 'error'}>
          {r.score.pass_status === 'passed' ? 'Đỗ' : 'Trượt'}
        </Tag>
      ) : <span className="text-gray-300">—</span>,
    },
    {
      title: 'Đồng bộ',
      key: 'score_status',
      width: 110,
      render: (_: unknown, r: ExamRegistration) => r.score ? (
        <Tag color={r.score.status === 'scored' ? 'success' : 'orange'}>
          {r.score.status === 'scored' ? 'Đã đồng bộ' : 'Nháp'}
        </Tag>
      ) : <span className="text-gray-300">—</span>,
    },
    {
      title: 'Thao tác',
      key: 'action',
      width: 190,
      render: (_: unknown, r: ExamRegistration) => (
        <div className="flex gap-2">
          {!isViewMode && (
            <Button size="small" icon={<EditOutlined />} type="primary" onClick={() => openScoreModal(r)} style={{ backgroundColor: '#4f46e5' }}>
              {r.score ? 'Sửa' : 'Quy trình/điểm'}
            </Button>
          )}
          {isViewMode && (
            <Button size="small" icon={<SyncOutlined />} disabled={!r.score || r.score.status === 'scored'} onClick={() => handleSyncOne(r)}>
              Đồng bộ
            </Button>
          )}
        </div>
      ),
    },
  ];

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">{isViewMode ? 'Xem điểm thi' : 'Nhập điểm thi'}</h1>
        <p className="text-gray-500 mt-1">
          {isViewMode
            ? 'Kiểm tra kết quả, đồng bộ điểm và set đỗ/trượt cho kỳ thi'
            : 'Nhập điểm riêng, lưu nháp và quản lý số túi/mã phách'}
        </p>
      </div>

      <Card className="border-0 shadow-md rounded-2xl mb-4">
        <div className="flex flex-wrap items-center gap-3">
          <FilterOutlined className="text-indigo-600" />
          <Select
            placeholder="Chọn kỳ thi để xem danh sách thí sinh"
            className="min-w-80"
            value={selectedSchedule || undefined}
            onChange={(v) => { setSelectedSchedule(v); loadRegistrations(v); }}
            options={schedules.map((s) => ({
              value: s._id,
              label: `${s.title} — ${new Date(s.exam_date).toLocaleDateString('vi-VN')}${s.room ? ` — ${s.room}` : ''}`,
            }))}
          />
          <span className="text-sm text-gray-400">{registrations.length} thí sinh</span>
          {isViewMode ? (
            <div className="flex items-center gap-2">
              <span className="text-sm text-gray-500">Ngưỡng đỗ kỳ thi</span>
              <InputNumber min={0} max={100} value={schedulePassThreshold} onChange={(v) => setSchedulePassThreshold(Number(v ?? 50))} />
            </div>
          ) : (
            <>
              <Button disabled={!selectedSchedule} icon={<ApartmentOutlined />} onClick={openRoomModal}>
                Phòng thi
              </Button>
              <Button disabled={!selectedSchedule} onClick={handleSetupExamProcess}>
                Setup phòng/SBD/túi/phách
              </Button>
              <Button disabled={!selectedSchedule} onClick={handleGenerateBags}>
                Đánh số túi/mã phách
              </Button>
              <Upload
                accept=".csv,text/csv"
                showUploadList={false}
                beforeUpload={(file) => {
                  void handleImport(file as File);
                  return false;
                }}
              >
                <Button icon={<UploadOutlined />} disabled={!selectedSchedule}>Nhập Excel/CSV</Button>
              </Upload>
            </>
          )}
          <Button icon={<DownloadOutlined />} disabled={!selectedSchedule} onClick={handleExport}>
            Xuất Excel/CSV
          </Button>
          {isViewMode && (
            <Button icon={<SyncOutlined />} disabled={!selectedSchedule} onClick={handleSyncAll}>
              Đồng bộ điểm & set đỗ/trượt
            </Button>
          )}
        </div>
      </Card>

      <Card className="border-0 shadow-md rounded-2xl">
        <Table
          dataSource={registrations}
          columns={columns}
          rowKey="_id"
          loading={loading}
          scroll={{ x: 1450 }}
          locale={{ emptyText: selectedSchedule ? 'Chưa có đăng ký thi' : 'Chọn kỳ thi để xem danh sách' }}
          pagination={{ pageSize: 20, showTotal: (t) => `${t} thí sinh` }}
        />
      </Card>

      <Modal
        title="Quy trình thi và nhập điểm"
        open={scoreModal}
        onOk={handleSaveScore}
        onCancel={() => setScoreModal(false)}
        okText="Lưu điểm"
        cancelText="Huỷ"
        okButtonProps={{ loading: saving, style: { backgroundColor: '#4f46e5' } }}
      >
        <Form form={form} layout="vertical" className="mt-4">
          <Alert
            showIcon
            type={activeReg && canEnterScore(activeReg) ? 'success' : 'info'}
            className="mb-4"
            message="Điểm chỉ được nhập khi đã xếp phòng, có SBD, số túi, mã phách, có thi và không VPQC."
          />
          <div className="grid grid-cols-2 gap-3">
            <Form.Item name="subject_code" label="Môn thi">
              <Input placeholder="VD: english" size="large" />
            </Form.Item>
            <Form.Item name="attendance_status" label="Trạng thái dự thi" rules={[{ required: true, message: 'Chọn trạng thái dự thi' }]}>
              <Select
                size="large"
                options={[
                  { value: 'pending', label: 'Chờ biên bản' },
                  { value: 'attended', label: 'Có thi' },
                  { value: 'absent', label: 'Vắng thi' },
                ]}
              />
            </Form.Item>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Form.Item name="bag_number" label="Số túi">
              <Input placeholder="VD: T01" size="large" />
            </Form.Item>
            <Form.Item name="anonymous_code" label="Mã phách">
              <Input placeholder="VD: MP001" size="large" />
            </Form.Item>
          </div>
          {watchedAttendance === 'absent' && (
            <div className="grid grid-cols-2 gap-3">
              <Form.Item name="absence_report_number" label="Số biên bản vắng thi" rules={[{ required: true, message: 'Nhập số biên bản vắng thi' }]}>
                <Input placeholder="VD: BBVT-001" size="large" />
              </Form.Item>
              <Form.Item name="absence_reason" label="Lý do vắng">
                <Input placeholder="Lý do vắng thi" size="large" />
              </Form.Item>
            </div>
          )}
          <Form.Item name="exam_violation" valuePropName="checked">
            <Checkbox>Thí sinh có biên bản vi phạm quy chế thi (VPQC)</Checkbox>
          </Form.Item>
          {watchedViolation && (
            <div className="grid grid-cols-2 gap-3">
              <Form.Item name="violation_report_number" label="Số biên bản VPQC" rules={[{ required: true, message: 'Nhập số biên bản VPQC' }]}>
                <Input placeholder="VD: BBVPQC-001" size="large" />
              </Form.Item>
              <Form.Item name="violation_note" label="Ghi chú VPQC">
                <Input placeholder="Nội dung vi phạm" size="large" />
              </Form.Item>
            </div>
          )}
          <Form.Item name="score" label="Điểm số (0 - 100)">
            <InputNumber
              min={0}
              max={100}
              className="w-full"
              size="large"
              disabled={watchedAttendance !== 'attended' || Boolean(watchedViolation)}
              placeholder={watchedAttendance !== 'attended' || watchedViolation ? 'Không nhập điểm cho thí sinh vắng/VPQC' : 'Nhập điểm'}
            />
          </Form.Item>
          <Form.Item name="pass_threshold" label="Ngưỡng đỗ" initialValue={50} rules={[{ required: true, message: 'Nhập ngưỡng đỗ' }]}>
            <InputNumber min={0} max={100} className="w-full" size="large" />
          </Form.Item>
          <Form.Item name="level_passed" label="Level đạt được">
            <Select
              allowClear
              size="large"
              options={LEVEL_OPTIONS[selectedLanguage] || LEVEL_OPTIONS.english}
              placeholder="Bỏ trống để hệ thống tự tính theo điểm"
            />
          </Form.Item>
          {resultPreview && (
            <Alert
              showIcon
              type={resultPreview.passed ? 'success' : 'warning'}
              message={`Hệ thống sẽ tính: ${resultPreview.passed ? 'Đỗ' : 'Trượt'} - level ${form.getFieldValue('level_passed') || resultPreview.level}`}
              description="Kết quả được lưu nháp trước. Học viên chỉ thấy điểm và đỗ/trượt sau khi admin bấm đồng bộ."
            />
          )}
        </Form>
      </Modal>

      <Modal
        title="Phòng thi của kỳ thi"
        open={roomModal}
        onCancel={() => setRoomModal(false)}
        footer={null}
        width={860}
      >
        <div className="mt-2 space-y-4">
          {getSelectedSchedule() && (
            <div className="rounded-lg border border-gray-100 bg-gray-50 p-3">
              <p className="font-medium text-gray-900">{getSelectedSchedule()?.title}</p>
              <p className="mt-1 text-sm text-gray-500">
                {new Date(getSelectedSchedule()!.exam_date).toLocaleDateString('vi-VN')}
                {getSelectedSchedule()?.location ? ` - ${getSelectedSchedule()?.location}` : ''}
              </p>
              <p className="mt-1 text-sm text-gray-500">
                Tổng sức chứa phòng: {rooms.reduce((sum, room) => sum + room.capacity, 0)} / {registrations.length} thí sinh trong kỳ thi
              </p>
            </div>
          )}

          {rooms.reduce((sum, room) => sum + room.capacity, 0) < registrations.length && (
            <Alert
              showIcon
              type="warning"
              message="Tổng sức chứa phòng thi đang nhỏ hơn số thí sinh. Một số thí sinh có thể chưa được xếp phòng."
            />
          )}

          <Form form={roomForm} layout="inline" className="gap-2">
            <Form.Item name="name" rules={[{ required: true, message: 'Nhập tên phòng' }]}>
              <Input placeholder="Tên phòng, VD: P02" />
            </Form.Item>
            <Form.Item name="capacity" rules={[{ required: true, message: 'Nhập sức chứa' }]}>
              <InputNumber min={1} max={500} placeholder="Sức chứa" />
            </Form.Item>
            <Form.Item name="location">
              <Input placeholder="Địa điểm/phòng học" />
            </Form.Item>
            <Button type="primary" icon={<PlusOutlined />} onClick={handleCreateRoom} style={{ backgroundColor: '#4f46e5' }}>
              Thêm phòng & xếp lại
            </Button>
          </Form>

          <Table
            dataSource={rooms}
            rowKey="_id"
            loading={loadingRooms}
            pagination={false}
            columns={[
              { title: 'Phòng', dataIndex: 'name', key: 'name' },
              { title: 'Địa điểm', dataIndex: 'location', key: 'location', render: (v: string) => v || getSelectedSchedule()?.location || '—' },
              { title: 'Sức chứa', dataIndex: 'capacity', key: 'capacity', width: 100 },
              { title: 'Đã xếp', dataIndex: 'assigned_count', key: 'assigned_count', width: 100 },
              {
                title: 'Trạng thái',
                key: 'status',
                width: 130,
                render: (_: unknown, room: ExamRoom) => room.assigned_count >= room.capacity
                  ? <Tag color="orange">Đủ phòng</Tag>
                  : <Tag color="green">Còn {room.capacity - room.assigned_count}</Tag>,
              },
            ]}
          />

          <p className="text-sm text-gray-500">
            Khi thêm phòng, hệ thống sẽ tự động xếp lại thí sinh theo giới hạn sức chứa từng phòng, đánh lại SBD, số túi theo phòng và mã phách riêng cho từng học viên.
          </p>
        </div>
      </Modal>
    </div>
  );
}
