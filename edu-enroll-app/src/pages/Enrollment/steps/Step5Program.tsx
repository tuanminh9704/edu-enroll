import { useEffect, useState } from 'react';
import { Button, Card, Alert, Tag, Spin, Radio } from 'antd';
import { ClockCircleOutlined, TeamOutlined, TrophyOutlined, CheckCircleOutlined } from '@ant-design/icons';
import { enrollmentService } from '../../../services/enrollment.service';
import { useEnrollmentStore } from '../../../store/enrollment.store';
import type { TrainingProgram } from '../../../types';
import { formatCurrency } from '../../../constants';

const LEVEL_COLORS: Record<string, string> = {
  A1: 'green', A2: 'cyan', B1: 'blue', B2: 'geekblue', IELTS: 'purple',
  N5: 'green', N4: 'blue', N3: 'purple',
  K1: 'green', K2: 'blue', TOPIK: 'purple',
  HSK1: 'green', HSK2: 'blue', HSK3: 'purple',
  FR_A1: 'green', FR_A2: 'blue', FR_B1: 'purple',
};

export default function Step5Program() {
  const { enrollment, setEnrollment } = useEnrollmentStore();
  const [programs, setPrograms] = useState<TrainingProgram[]>([]);
  const [selected, setSelected] = useState<string>(enrollment?.program_id || '');
  const [loading, setLoading] = useState(false);
  const [loadingPrograms, setLoadingPrograms] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const load = async () => {
      setLoadingPrograms(true);
      try {
        const list = await enrollmentService.getPrograms();
        setPrograms(list);
      } catch {
        setError('Không thể tải danh sách chương trình');
      } finally {
        setLoadingPrograms(false);
      }
    };
    load();
  }, []);

  const handleSelect = async () => {
    if (!selected) { setError('Vui lòng chọn chương trình'); return; }
    setLoading(true);
    setError('');
    try {
      const updated = await enrollmentService.selectProgram(selected);
      setEnrollment(updated);
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } }).response?.data?.message || 'Có lỗi xảy ra';
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  if (loadingPrograms) {
    return <div className="flex justify-center py-12"><Spin size="large" /></div>;
  }

  const filteredPrograms = enrollment?.language
    ? programs.filter(p => p.language === enrollment.language)
    : programs;

  return (
    <Card className="shadow-md border-0 rounded-2xl">
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 bg-indigo-100 rounded-xl flex items-center justify-center">
          <span className="text-indigo-600 font-bold text-lg">5</span>
        </div>
        <div>
          <h2 className="text-lg font-bold text-gray-900">Chọn chương trình học</h2>
          <p className="text-gray-500 text-sm">Chọn khóa học phù hợp với mục tiêu của bạn</p>
        </div>
      </div>

      {error && <Alert message={error} type="error" showIcon className="mb-4" />}

      {enrollment?.exam_required && enrollment.exam_pass_status === 'failed' && (
        <Alert
          type="warning"
          showIcon
          className="mb-4"
          message="Kết quả thi chưa đạt ngưỡng để chọn chương trình đào tạo."
        />
      )}

      {(enrollment?.exam_level_passed || enrollment?.level) && (
        <div className="bg-indigo-50 rounded-xl p-3 mb-4 text-sm text-indigo-700">
          Đề xuất dựa trên trình độ của bạn: <strong>{enrollment.exam_level_passed || enrollment.level}</strong>
          {enrollment.exam_score && <span> (Điểm thi: <strong>{enrollment.exam_score}</strong>)</span>}
          {enrollment.exam_pass_status && (
            <span> - <strong>{enrollment.exam_pass_status === 'passed' ? 'Đỗ' : 'Trượt'}</strong></span>
          )}
        </div>
      )}

      <Radio.Group className="w-full" value={selected} onChange={(e) => setSelected(e.target.value)}>
        <div className="space-y-3">
          {(filteredPrograms.length > 0 ? filteredPrograms : programs).map((program) => (
            <Radio key={program.id} value={program.id} className="w-full">
              <div className={`w-full border-2 rounded-xl p-4 ml-2 transition-all ${selected === program.id ? 'border-indigo-400 bg-indigo-50' : 'border-gray-200 hover:border-indigo-200'}`}>
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="font-semibold text-gray-900">{program.name}</h3>
                      <Tag color={LEVEL_COLORS[program.level] || 'blue'}>{program.level}</Tag>
                    </div>
                    <p className="text-sm text-gray-500 mb-2">{program.description}</p>
                    <div className="flex flex-wrap gap-4 text-sm text-gray-500">
                      <span className="flex items-center gap-1">
                        <ClockCircleOutlined /> {program.duration_months} tháng
                      </span>
                      <span className="flex items-center gap-1">
                        <TeamOutlined /> {program.sessions_per_week} buổi/tuần
                      </span>
                      <span className="flex items-center gap-1">
                        <TrophyOutlined /> {program.language}
                      </span>
                      {typeof program.min_score === 'number' && program.min_score > 0 && (
                        <span>Điểm tối thiểu: {program.min_score}</span>
                      )}
                    </div>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="text-xl font-bold text-indigo-600">{formatCurrency(program.tuition_fee)}</p>
                    {selected === program.id && (
                      <CheckCircleOutlined className="text-indigo-500 text-lg mt-1" />
                    )}
                  </div>
                </div>
              </div>
            </Radio>
          ))}
        </div>
      </Radio.Group>

      <Button
        type="primary"
        size="large"
        block
        className="mt-6"
        loading={loading}
        disabled={!selected}
        onClick={handleSelect}
        style={{ backgroundColor: '#4f46e5', height: 48, fontWeight: 600 }}
      >
        Xác nhận chương trình
      </Button>
    </Card>
  );
}
