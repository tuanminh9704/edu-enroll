import { useEffect, useState } from 'react';
import { Button, Card, Alert, Radio, Tag, Spin, Modal, Input, message } from 'antd';
import { CalendarOutlined, ClockCircleOutlined, EnvironmentOutlined, TrophyOutlined, QuestionCircleOutlined } from '@ant-design/icons';
import { enrollmentService } from '../../../services/enrollment.service';
import { useEnrollmentStore } from '../../../store/enrollment.store';
import api from '../../../services/api';
import type { ExamSchedule, ExamResult, ApiResponse } from '../../../types';

export default function Step4Exam() {
  const { enrollment, setEnrollment } = useEnrollmentStore();
  const [schedules, setSchedules] = useState<ExamSchedule[]>([]);
  const [selected, setSelected] = useState<string>(enrollment?.exam_schedule_id || '');
  const [loading, setLoading] = useState(false);
  const [loadingSchedules, setLoadingSchedules] = useState(true);
  const [error, setError] = useState('');
  const [examResult, setExamResult] = useState<ExamResult | null>(null);
  const [skipModal, setSkipModal] = useState(false);
  const [recheckModal, setRecheckModal] = useState(false);
  const [recheckReason, setRecheckReason] = useState('');
  const [recheckSending, setRecheckSending] = useState(false);
  const [recheckSent, setRecheckSent] = useState(false);

  const examRequired = !!enrollment?.exam_required;
  const registered = !!enrollment?.exam_schedule_id;
  const getScheduleId = (schedule: ExamSchedule) => schedule._id || schedule.id;

  useEffect(() => {
    const load = async () => {
      setLoadingSchedules(true);
      try {
        const lang = enrollment?.language || 'english';
        const list = await enrollmentService.getExamSchedules(lang);
        setSchedules(list);
        if (enrollment?.exam_schedule_id) setSelected(enrollment.exam_schedule_id);
        if (registered) {
          const result = await enrollmentService.getExamResult();
          if (result) setExamResult(result);
        }
      } catch {
        setError('Không thể tải lịch thi');
      } finally {
        setLoadingSchedules(false);
      }
    };
    load();
  }, [enrollment?.language, registered]);

  const handleRegister = async () => {
    if (!selected) { setError('Vui lòng chọn ca thi'); return; }
    setLoading(true);
    setError('');
    try {
      const updated = await enrollmentService.registerExam(selected);
      setEnrollment(updated);
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } }).response?.data?.message || 'Đăng ký thi thất bại';
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  const handleSkip = async () => {
    setSkipModal(false);
    setLoading(true);
    try {
      const updated = await enrollmentService.skipExam();
      setEnrollment(updated);
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } }).response?.data?.message || 'Có lỗi xảy ra';
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  const handleAdvance = async () => {
    setLoading(true);
    try {
      const updated = await enrollmentService.advanceToStep5();
      setEnrollment(updated);
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } }).response?.data?.message || 'Có lỗi xảy ra';
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  if (loadingSchedules) {
    return <div className="flex justify-center py-12"><Spin size="large" /></div>;
  }

  if (!examRequired) {
    return (
      <Card className="shadow-md border-0 rounded-2xl text-center py-8">
        <TrophyOutlined className="text-5xl text-indigo-500 mb-3" />
        <h3 className="text-lg font-semibold text-gray-900 mb-2">Trình độ của bạn không cần kiểm tra</h3>
        <p className="text-gray-500 text-sm mb-6">Bạn đăng ký trình độ cơ bản, bỏ qua bước kiểm tra năng lực.</p>
        <Button type="primary" size="large" loading={loading} onClick={handleSkip} style={{ backgroundColor: '#4f46e5' }}>
          Tiếp tục chọn chương trình →
        </Button>
      </Card>
    );
  }

  const handleSubmitRecheck = async () => {
    if (!recheckReason.trim()) { message.warning('Vui lòng nhập lý do phúc khảo'); return; }
    setRecheckSending(true);
    try {
      await api.post<ApiResponse>('/enrollments/recheck', { reason: recheckReason });
      message.success('Gửi yêu cầu phúc khảo thành công');
      setRecheckModal(false);
      setRecheckSent(true);
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } }).response?.data?.message || 'Gửi phúc khảo thất bại';
      message.error(msg);
    } finally {
      setRecheckSending(false);
    }
  };

  if (registered && examResult && examResult.score_status === 'scored') {
    const passed = examResult.pass_status === 'passed';
    return (
      <Card className="shadow-md border-0 rounded-2xl">
        <div className="flex items-center gap-3 mb-6">
          <TrophyOutlined className="text-indigo-600 text-xl" />
          <h2 className="text-lg font-bold text-gray-900">Kết quả kiểm tra năng lực</h2>
        </div>
        {error && <Alert message={error} type="error" showIcon className="mb-4" />}
        <div className="bg-indigo-50 rounded-xl p-6 mb-6 text-center">
          <p className="text-gray-500 text-sm mb-1">Điểm số</p>
          <p className="text-5xl font-bold text-indigo-600">{examResult.score}</p>
          <Tag color={passed ? 'success' : 'error'} className="mt-3 text-sm px-3 py-1">
            {passed ? 'Đỗ' : 'Trượt'}{examResult.pass_threshold !== undefined ? ` - Ngưỡng ${examResult.pass_threshold}` : ''}
          </Tag>
          {examResult.level_passed && (
            <p className="text-gray-600 text-sm mt-2">Xếp loại: <strong>{examResult.level_passed}</strong></p>
          )}
        </div>
        <div className="flex gap-3">
          {passed ? (
            <Button type="primary" size="large" loading={loading} onClick={handleAdvance}
              style={{ backgroundColor: '#4f46e5', height: 48, fontWeight: 600, flex: 1 }}>
              Tiếp tục chọn chương trình →
            </Button>
          ) : (
            <Alert
              type="warning"
              showIcon
              className="flex-1"
              message="Kết quả chưa đạt ngưỡng chọn chương trình. Bạn có thể gửi yêu cầu phúc khảo."
            />
          )}
          {!recheckSent ? (
            <Button size="large" icon={<QuestionCircleOutlined />} onClick={() => setRecheckModal(true)} style={{ height: 48 }}>
              Phúc khảo
            </Button>
          ) : (
            <Tag color="orange" className="flex items-center px-3">Đã gửi phúc khảo</Tag>
          )}
        </div>

        <Modal
          title="Yêu cầu phúc khảo"
          open={recheckModal}
          onOk={handleSubmitRecheck}
          onCancel={() => setRecheckModal(false)}
          okText="Gửi yêu cầu"
          cancelText="Huỷ"
          okButtonProps={{ loading: recheckSending, style: { backgroundColor: '#4f46e5' } }}
        >
          <p className="text-gray-500 text-sm mb-3">Nếu bạn không đồng ý với kết quả, hãy cung cấp lý do để nhân viên xem xét lại.</p>
          <Input.TextArea
            rows={4}
            placeholder="Nhập lý do phúc khảo..."
            value={recheckReason}
            onChange={(e) => setRecheckReason(e.target.value)}
            maxLength={500}
            showCount
          />
        </Modal>
      </Card>
    );
  }

  return (
    <Card className="shadow-md border-0 rounded-2xl">
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 bg-indigo-100 rounded-xl flex items-center justify-center">
          <span className="text-indigo-600 font-bold text-lg">4</span>
        </div>
        <div>
          <h2 className="text-lg font-bold text-gray-900">Đăng ký kiểm tra năng lực</h2>
          <p className="text-gray-500 text-sm">Chọn ca thi phù hợp với lịch của bạn</p>
        </div>
      </div>

      {error && <Alert message={error} type="error" showIcon className="mb-4" />}

      {registered && (
        <Alert
          type="info"
          showIcon
          className="mb-4"
          message="Bạn đã đăng ký ca thi. Có thể chọn ca khác và lưu lại nếu chưa có kết quả thi."
        />
      )}

      {schedules.length === 0 ? (
        <div className="text-center py-8 text-gray-500">
          <CalendarOutlined className="text-4xl mb-3" />
          <p>Hiện chưa có lịch thi cho ngôn ngữ này.</p>
        </div>
      ) : (
        <Radio.Group className="w-full space-y-3" value={selected} onChange={(e) => setSelected(e.target.value)}>
          {schedules.map((s) => {
            const scheduleId = getScheduleId(s);
            const available = s.max_slots - s.registered_slots;
            return (
              <Radio key={scheduleId} value={scheduleId} disabled={available === 0} className="w-full">
                <div className="w-full border border-gray-200 rounded-xl p-4 ml-2 hover:border-indigo-300 transition-colors">
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="font-semibold text-gray-900">{new Date(s.exam_date).toLocaleDateString('vi-VN')}</p>
                      <div className="flex flex-wrap items-center gap-4 mt-1 text-sm text-gray-500">
                        <span className="flex items-center gap-1">
                          <EnvironmentOutlined /> {s.location}{s.room ? ` - ${s.room}` : ''}
                        </span>
                        <span className="flex items-center gap-1">
                          <ClockCircleOutlined /> {s.format === 'online' ? 'Trực tuyến' : 'Trực tiếp'}
                        </span>
                      </div>
                      <p className="text-sm text-gray-400 mt-1">Còn {available}/{s.max_slots} chỗ</p>
                    </div>
                    {available === 0 ? (
                      <Tag color="red">Hết chỗ</Tag>
                    ) : available <= 5 ? (
                      <Tag color="orange">Còn {available} chỗ</Tag>
                    ) : (
                      <Tag color="green">Còn chỗ</Tag>
                    )}
                  </div>
                </div>
              </Radio>
            );
          })}
        </Radio.Group>
      )}

      <div className="mt-6 flex gap-3">
        <Button
          type="primary"
          size="large"
          loading={loading}
          disabled={!selected}
          onClick={handleRegister}
          style={{ backgroundColor: '#4f46e5', height: 48, fontWeight: 600, flex: 1 }}
        >
          {registered ? 'Cập nhật ca thi' : 'Đăng ký thi'}
        </Button>
        <Button size="large" onClick={() => setSkipModal(true)} style={{ height: 48 }}>
          Bỏ qua
        </Button>
      </div>

      <Modal
        title="Bỏ qua kiểm tra năng lực?"
        open={skipModal}
        onOk={handleSkip}
        onCancel={() => setSkipModal(false)}
        okText="Bỏ qua"
        cancelText="Huỷ"
        okButtonProps={{ style: { backgroundColor: '#4f46e5' } }}
      >
        <p>Nếu bỏ qua, bạn sẽ được xếp lớp theo trình độ đã chọn. Bạn có chắc không?</p>
      </Modal>
    </Card>
  );
}
