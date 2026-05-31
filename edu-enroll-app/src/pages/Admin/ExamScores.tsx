import { useEffect, useState } from 'react';
import { Alert, Card, Table, Tag, Button, Modal, Form, Input, InputNumber, Select, Upload, message } from 'antd';
import { DownloadOutlined, EditOutlined, FilterOutlined, SyncOutlined, UploadOutlined } from '@ant-design/icons';
import api from '../../services/api';
import type { ApiResponse } from '../../types';
import { downloadAdminCsv, importAdminCsv } from '../../utils/adminCsv';

interface ExamScheduleOption {
  _id: string;
  title: string;
  language: string;
  exam_date: string;
  room?: string;
}

interface ExamRegistration {
  _id: string;
  user_id: string | { email: string; full_name: string };
  schedule_id: string;
  room_id?: string | { name?: string; location?: string };
  exam_code: string;
  bag_number?: string;
  anonymous_code?: string;
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

type ScorePageMode = 'entry' | 'view';

export default function AdminExamScores({ mode = 'entry' }: { mode?: ScorePageMode }) {
  const isViewMode = mode === 'view';
  const [schedules, setSchedules] = useState<ExamScheduleOption[]>([]);
  const [selectedSchedule, setSelectedSchedule] = useState<string>('');
  const [selectedLanguage, setSelectedLanguage] = useState<string>('english');
  const [registrations, setRegistrations] = useState<ExamRegistration[]>([]);
  const [loading, setLoading] = useState(false);
  const [scoreModal, setScoreModal] = useState(false);
  const [activeReg, setActiveReg] = useState<ExamRegistration | null>(null);
  const [form] = Form.useForm();
  const [saving, setSaving] = useState(false);
  const [schedulePassThreshold, setSchedulePassThreshold] = useState(50);
  const watchedScore = Form.useWatch('score', form);
  const watchedThreshold = Form.useWatch('pass_threshold', form);
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

  const openScoreModal = (reg: ExamRegistration) => {
    setActiveReg(reg);
    form.setFieldsValue({
      score: reg.score?.score,
      level_passed: reg.score?.level_passed,
      pass_threshold: reg.score?.pass_threshold || 50,
      bag_number: reg.bag_number || '',
      anonymous_code: reg.anonymous_code || '',
    });
    setScoreModal(true);
  };

  const handleSaveScore = async () => {
    const values = await form.validateFields();
    if (!activeReg) return;
    setSaving(true);
    try {
      await api.post(`/admin/exam-registrations/${activeReg._id}/score-draft`, values);
      message.success('Đã lưu điểm nháp. Học viên sẽ thấy kết quả sau khi đồng bộ.');
      setScoreModal(false);
      loadRegistrations(selectedSchedule);
    } catch {
      message.error('Nhập điểm thất bại');
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
        const res = await api.post<ApiResponse<{ matched: number; synced: number; skipped: number }>>(
          `/admin/exam-schedules/${selectedSchedule}/sync-scores`,
          { pass_threshold: schedulePassThreshold },
        );
        message.success(`Đã đồng bộ ${res.data.data.synced}, bỏ qua ${res.data.data.skipped}/${res.data.data.matched}`);
        loadRegistrations(selectedSchedule);
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

  const handleExport = async () => {
    if (!selectedSchedule) {
      message.warning('Vui lòng chọn kỳ thi');
      return;
    }
    try {
      await downloadAdminCsv(`exam-scores?scheduleId=${selectedSchedule}`, 'exam-scores.csv');
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
      message.success(`Đã nhập ${result.imported}, bỏ qua ${result.skipped}`);
      if (result.errors?.length) message.warning(result.errors.slice(0, 3).join('; '));
      loadRegistrations(selectedSchedule);
    } catch {
      message.error('Nhập điểm thất bại');
    }
  };

  const columns = [
    {
      title: 'Thí sinh',
      dataIndex: 'user_id',
      key: 'user',
      render: (v: ExamRegistration['user_id']) => typeof v === 'object' ? (
        <div>
          <p className="font-medium">{v.full_name}</p>
          <p className="text-xs text-gray-400">{v.email}</p>
        </div>
      ) : <span className="font-mono text-xs">{String(v)}</span>,
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
      render: (_: unknown, r: ExamRegistration) => typeof r.room_id === 'object' ? (r.room_id.name || '—') : '—',
    },
    { title: 'Số túi', dataIndex: 'bag_number', key: 'bag_number', width: 90, render: (v: string) => v || <span className="text-gray-300">—</span> },
    { title: 'Mã phách', dataIndex: 'anonymous_code', key: 'anonymous_code', width: 110, render: (v: string) => v || <span className="text-gray-300">—</span> },
    {
      title: 'Ngày đăng ký',
      dataIndex: 'created_at',
      key: 'created_at',
      width: 120,
      render: (v: string) => v ? new Date(v).toLocaleDateString('vi-VN') : '—',
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
              {r.score ? 'Sửa' : 'Nhập'}
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
                <Button icon={<UploadOutlined />} disabled={!selectedSchedule}>Nhập CSV</Button>
              </Upload>
            </>
          )}
          <Button icon={<DownloadOutlined />} disabled={!selectedSchedule} onClick={handleExport}>
            Xuất CSV
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
          locale={{ emptyText: selectedSchedule ? 'Chưa có đăng ký thi' : 'Chọn kỳ thi để xem danh sách' }}
          pagination={{ pageSize: 20, showTotal: (t) => `${t} thí sinh` }}
        />
      </Card>

      <Modal
        title="Nhập điểm riêng"
        open={scoreModal}
        onOk={handleSaveScore}
        onCancel={() => setScoreModal(false)}
        okText="Lưu điểm"
        cancelText="Huỷ"
        okButtonProps={{ loading: saving, style: { backgroundColor: '#4f46e5' } }}
      >
        <Form form={form} layout="vertical" className="mt-4">
          <Form.Item name="score" label="Điểm số (0 - 100)" rules={[{ required: true, message: 'Nhập điểm' }]}>
            <InputNumber min={0} max={100} className="w-full" size="large" />
          </Form.Item>
          <div className="grid grid-cols-2 gap-3">
            <Form.Item name="bag_number" label="Số túi">
              <Input placeholder="VD: T01" size="large" />
            </Form.Item>
            <Form.Item name="anonymous_code" label="Mã phách">
              <Input placeholder="VD: MP001" size="large" />
            </Form.Item>
          </div>
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
    </div>
  );
}
