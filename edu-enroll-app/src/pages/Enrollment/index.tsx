import { useEffect, useRef, useState } from 'react';
import { Steps, Card, Spin, Alert } from 'antd';
import { useEnrollmentStore } from '../../store/enrollment.store';
import { enrollmentService } from '../../services/enrollment.service';
import Step1Policy from './steps/Step1Policy';
import Step2Payment from './steps/Step2Payment';
import Step3Form from './steps/Step3Form';
import Step4Exam from './steps/Step4Exam';
import Step5Program from './steps/Step5Program';
import Step6Original from './steps/Step6Original';

const STEPS = [
  { title: 'Ký cam kết', description: 'Chính sách học viên' },
  { title: 'Lệ phí', description: 'Thanh toán 50.000đ' },
  { title: 'Hồ sơ', description: 'Điền thông tin' },
  { title: 'Kiểm tra', description: 'Thi năng lực' },
  { title: 'Chương trình', description: 'Chọn khóa học' },
  { title: 'Bản gốc', description: 'Nộp hồ sơ' },
];

export default function EnrollmentPage() {
  const { enrollment, loading, error, setEnrollment, setLoading, setError } = useEnrollmentStore();
  const [viewingStep, setViewingStep] = useState(1);
  const previousCurrentStep = useRef(1);

  useEffect(() => {
    const loadEnrollment = async () => {
      setLoading(true);
      try {
        const data = await enrollmentService.getEnrollment();
        setEnrollment(data);
      } catch {
        setError('Không thể tải thông tin hồ sơ');
      } finally {
        setLoading(false);
      }
    };
    loadEnrollment();
  }, [setEnrollment, setLoading, setError]);

  const maxStep = enrollment ? enrollment.current_step : 1;

  useEffect(() => {
    if (!enrollment) return;

    if (enrollment.current_step > previousCurrentStep.current) {
      setViewingStep(enrollment.current_step);
    } else if (viewingStep > enrollment.current_step) {
      setViewingStep(enrollment.current_step);
    }

    previousCurrentStep.current = enrollment.current_step;
  }, [enrollment, viewingStep]);

  const renderStep = () => {
    if (!enrollment) return null;
    switch (viewingStep) {
      case 1: return <Step1Policy />;
      case 2: return <Step2Payment />;
      case 3: return <Step3Form />;
      case 4: return <Step4Exam />;
      case 5: return <Step5Program />;
      case 6: return <Step6Original />;
      default: return null;
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Spin size="large" tip="Đang tải hồ sơ..." />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 py-8 px-4">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold text-gray-900">Hồ sơ tuyển sinh</h1>
          <p className="text-gray-500 mt-1 text-sm">Hoàn thành 6 bước để hoàn tất đăng ký</p>
          {enrollment && (
            <p className="text-indigo-600 text-sm mt-1 font-medium">
              Mã hồ sơ: {enrollment.document_number || 'Chưa cấp'}
            </p>
          )}
        </div>

        <Card className="shadow-md border-0 rounded-2xl mb-6 overflow-hidden">
          <Steps
            current={viewingStep - 1}
            onChange={(stepIndex) => {
              const nextStep = stepIndex + 1;
              if (nextStep <= maxStep) setViewingStep(nextStep);
            }}
            items={STEPS.map((step, index) => ({
              ...step,
              disabled: index + 1 > maxStep,
            }))}
            size="small"
            responsive
            className="px-2"
          />
        </Card>

        {viewingStep < maxStep && (
          <Alert
            type="info"
            showIcon
            className="mb-4 rounded-xl"
            message={`Bạn đang xem lại bước ${viewingStep}. Có thể chỉnh sửa và lưu lại thông tin ở bước này.`}
          />
        )}

        {error && <Alert message={error} type="error" showIcon className="mb-4 rounded-xl" />}

        <div className="mt-2">{renderStep()}</div>
      </div>
    </div>
  );
}
