import { useEffect, useState } from 'react';
import { Card, Steps, Tag, Button, Spin, Alert, message } from 'antd';
import { useNavigate } from 'react-router-dom';
import { FileTextOutlined, UserOutlined, CalendarOutlined } from '@ant-design/icons';
import { useAuthStore } from '../../store/auth.store';
import { useEnrollmentStore } from '../../store/enrollment.store';
import { enrollmentService } from '../../services/enrollment.service';
import { STATUS_LABELS, STEP_LABELS, formatCurrency } from '../../constants';
import type { ExamResult, Interview, Invoice } from '../../types';

const STATUS_COLORS: Record<string, string> = {
  step_1: 'processing', step_2: 'warning', step_3: 'processing',
  step_4: 'processing', step_5: 'processing', step_6: 'processing',
  completed: 'success', cancelled: 'error',
};

export default function Dashboard() {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const { enrollment, setEnrollment } = useEnrollmentStore();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [interviews, setInterviews] = useState<Interview[]>([]);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [examLookup, setExamLookup] = useState<ExamResult | null>(null);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const [data, interviewData, invoiceData, examData] = await Promise.all([
          enrollmentService.getEnrollment(),
          enrollmentService.getInterviews().catch(() => []),
          enrollmentService.getInvoices().catch(() => []),
          enrollmentService.getExamResult().catch(() => null),
        ]);
        setEnrollment(data);
        setInterviews(interviewData);
        setInvoices(invoiceData);
        setExamLookup(examData);
      } catch {
        setError('Không thể tải thông tin hồ sơ');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [setEnrollment]);

  const handleInterviewResponse = async (id: string, status: 'confirmed' | 'declined') => {
    try {
      await enrollmentService.respondInterview(id, status);
      setInterviews((items) => items.map((item) => item._id === id ? { ...item, status } : item));
      message.success(status === 'confirmed' ? 'Đã xác nhận lịch phỏng vấn' : 'Đã từ chối lịch phỏng vấn');
    } catch {
      message.error('Không thể cập nhật lịch phỏng vấn');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Spin size="large" tip="Đang tải..." />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-linear-to-br from-slate-50 to-blue-50 py-8 px-4">
      <div className="max-w-4xl mx-auto">
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-gray-900">Xin chào, {user?.full_name}!</h1>
          <p className="text-gray-500 mt-1">Theo dõi hồ sơ tuyển sinh của bạn</p>
        </div>

        {error && <Alert message={error} type="error" showIcon className="mb-6 rounded-xl" />}

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <Card className="border-0 shadow-md rounded-2xl bg-indigo-600 text-white">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center">
                <UserOutlined className="text-2xl" />
              </div>
              <div className="min-w-0">
                <p className="text-indigo-100 text-sm">Tài khoản</p>
                <p className="font-bold truncate">{user?.email}</p>
              </div>
            </div>
          </Card>

          <Card className="border-0 shadow-md rounded-2xl">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center">
                <FileTextOutlined className="text-green-600 text-2xl" />
              </div>
              <div>
                <p className="text-gray-500 text-sm">Mã hồ sơ</p>
                <p className="font-bold text-gray-900">{enrollment?.document_number || 'Chưa cấp'}</p>
              </div>
            </div>
          </Card>

          <Card className="border-0 shadow-md rounded-2xl">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center">
                <CalendarOutlined className="text-blue-600 text-2xl" />
              </div>
              <div>
                <p className="text-gray-500 text-sm">Trạng thái</p>
                {enrollment ? (
                  <Tag color={STATUS_COLORS[enrollment.status] || 'default'} className="mt-1">
                    {STATUS_LABELS[enrollment.status] || enrollment.status}
                  </Tag>
                ) : (
                  <p className="font-medium text-gray-400">Chưa có hồ sơ</p>
                )}
              </div>
            </div>
          </Card>
        </div>

        {enrollment ? (
          <>
            <Card className="shadow-md border-0 rounded-2xl mb-6">
              <h2 className="text-lg font-bold text-gray-900 mb-4">Tiến trình hồ sơ</h2>
              <Steps
                current={enrollment.current_step - 1}
                size="small"
                responsive
                items={STEP_LABELS.map((label) => ({ title: label }))}
              />
              {enrollment.status !== 'completed' && (
                <div className="mt-6 text-center">
                  <Button
                    type="primary"
                    size="large"
                    onClick={() => navigate('/ho-so')}
                    style={{ backgroundColor: '#4f46e5' }}
                  >
                    Tiếp tục hồ sơ →
                  </Button>
                </div>
              )}
            </Card>

            <Card className="shadow-md border-0 rounded-2xl">
              <h2 className="text-lg font-bold text-gray-900 mb-4">Thông tin hồ sơ</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                {[
                  { label: 'Họ tên', value: enrollment.student_full_name },
                  { label: 'Ngoại ngữ', value: enrollment.language },
                  { label: 'Trình độ', value: enrollment.level },
                  { label: 'Cơ sở', value: enrollment.facility },
                  { label: 'Lệ phí', value: enrollment.payment_status === 'success' ? '✓ Đã thanh toán' : '✗ Chưa thanh toán' },
                  { label: 'Chương trình', value: enrollment.program_name },
                  { label: 'Học phí', value: enrollment.tuition_fee ? formatCurrency(enrollment.tuition_fee) : undefined },
                  { label: 'Mã hồ sơ', value: enrollment.document_number },
                ].filter(({ value }) => value).map(({ label, value }) => (
                  <div key={label} className="flex justify-between p-3 bg-gray-50 rounded-xl">
                    <span className="text-gray-500">{label}</span>
                    <span className="font-medium text-gray-800">{value}</span>
                  </div>
                ))}
              </div>
            </Card>

            {examLookup && (
              <Card className="shadow-md border-0 rounded-2xl mt-6">
                <h2 className="text-lg font-bold text-gray-900 mb-4">Tra cứu phòng thi</h2>
                {!examLookup.room_published && (
                  <Alert
                    type="info"
                    showIcon
                    className="mb-4"
                    message="Phòng thi chưa được công bố"
                    description="Bạn đã được thêm vào kỳ thi. Phòng thi và số báo danh sẽ hiển thị sau khi trung tâm công bố."
                  />
                )}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                  {[
                    { label: 'Kỳ thi', value: examLookup.title },
                    { label: 'Ngày thi', value: examLookup.exam_date ? new Date(examLookup.exam_date).toLocaleDateString('vi-VN') : undefined },
                    { label: 'Địa điểm', value: examLookup.location },
                    { label: 'Phòng thi', value: examLookup.room || (examLookup.format === 'online' ? 'Online' : undefined) },
                    { label: 'Mã thi', value: examLookup.exam_code },
                    { label: 'Trạng thái', value: examLookup.status === 'confirmed' ? 'Đã xác nhận' : examLookup.status },
                  ].filter(({ value }) => value).map(({ label, value }) => (
                    <div key={label} className="flex justify-between gap-3 p-3 bg-gray-50 rounded-xl">
                      <span className="text-gray-500">{label}</span>
                      <span className="font-medium text-gray-800 text-right">{value}</span>
                    </div>
                  ))}
                </div>
              </Card>
            )}

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-6">
              <Card className="shadow-md border-0 rounded-2xl">
                <h2 className="text-lg font-bold text-gray-900 mb-4">Lịch phỏng vấn</h2>
                {interviews.length === 0 ? (
                  <p className="text-sm text-gray-400">Chưa có lịch phỏng vấn.</p>
                ) : (
                  <div className="space-y-3">
                    {interviews.slice(0, 3).map((item) => (
                      <div key={item._id} className="p-3 bg-gray-50 rounded-xl">
                        <div className="flex justify-between gap-3">
                          <div>
                            <p className="font-medium text-gray-900">{item.title}</p>
                            <p className="text-xs text-gray-500 mt-1">{new Date(item.scheduled_at).toLocaleString('vi-VN')}</p>
                            <p className="text-xs text-gray-500">{item.location}</p>
                          </div>
                          <Tag color={item.status === 'confirmed' ? 'success' : item.status === 'declined' ? 'error' : 'processing'} className="h-fit">
                            {item.status}
                          </Tag>
                        </div>
                        {item.status === 'pending' && (
                          <div className="flex gap-2 mt-3">
                            <Button size="small" type="primary" onClick={() => handleInterviewResponse(item._id, 'confirmed')} style={{ backgroundColor: '#4f46e5' }}>
                              Xác nhận
                            </Button>
                            <Button size="small" danger onClick={() => handleInterviewResponse(item._id, 'declined')}>
                              Từ chối
                            </Button>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </Card>

              <Card className="shadow-md border-0 rounded-2xl">
                <h2 className="text-lg font-bold text-gray-900 mb-4">Hóa đơn</h2>
                {invoices.length === 0 ? (
                  <p className="text-sm text-gray-400">Chưa có hóa đơn.</p>
                ) : (
                  <div className="space-y-3">
                    {invoices.slice(0, 4).map((item) => (
                      <div key={item._id} className="flex justify-between gap-3 p-3 bg-gray-50 rounded-xl">
                        <div>
                          <p className="font-mono text-xs text-gray-500">{item.invoice_number}</p>
                          <p className="font-medium text-gray-900">{item.description || 'Thanh toán tuyển sinh'}</p>
                          <p className="text-xs text-gray-400">{new Date(item.issued_at).toLocaleDateString('vi-VN')}</p>
                        </div>
                        <div className="text-right">
                          <p className="font-bold text-indigo-600">{formatCurrency(item.amount)}</p>
                          <Tag color={item.status === 'paid' ? 'success' : item.status === 'cancelled' ? 'error' : 'processing'}>
                            {item.status}
                          </Tag>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </Card>
            </div>
          </>
        ) : (
          <Card className="shadow-md border-0 rounded-2xl text-center py-12">
            <FileTextOutlined className="text-5xl text-gray-300 mb-4" />
            <h3 className="text-lg font-semibold text-gray-700 mb-2">Bạn chưa có hồ sơ tuyển sinh</h3>
            <p className="text-gray-500 text-sm mb-6">Bắt đầu đăng ký ngay để trải nghiệm chương trình học tại Trung tâm ngôn ngữ Apex</p>
            <Button type="primary" size="large" onClick={() => navigate('/ho-so')} style={{ backgroundColor: '#4f46e5' }}>
              Bắt đầu đăng ký
            </Button>
          </Card>
        )}
      </div>
    </div>
  );
}
