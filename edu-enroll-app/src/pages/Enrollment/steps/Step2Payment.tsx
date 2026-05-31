import { useState } from 'react';
import { Button, Card, Alert, Tag } from 'antd';
import { CreditCardOutlined, SafetyOutlined, CheckCircleOutlined } from '@ant-design/icons';
import { enrollmentService } from '../../../services/enrollment.service';
import { useEnrollmentStore } from '../../../store/enrollment.store';

export default function Step2Payment() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const { enrollment, setEnrollment } = useEnrollmentStore();

  const isPaid = enrollment?.payment_status === 'success';

  const handlePayment = async () => {
    setLoading(true);
    setError('');
    try {
      const { url } = await enrollmentService.getPaymentUrl();
      window.location.href = url;
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } }).response?.data?.message || 'Không thể tạo thanh toán';
      setError(msg);
      setLoading(false);
    }
  };

  const handleRefresh = async () => {
    setLoading(true);
    try {
      const data = await enrollmentService.getEnrollment();
      setEnrollment(data);
    } catch {
      setError('Không thể cập nhật trạng thái');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="shadow-md border-0 rounded-2xl">
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 bg-indigo-100 rounded-xl flex items-center justify-center">
          <span className="text-indigo-600 font-bold text-lg">2</span>
        </div>
        <div>
          <h2 className="text-lg font-bold text-gray-900">Thanh toán lệ phí</h2>
          <p className="text-gray-500 text-sm">Lệ phí xét tuyển qua VNPay</p>
        </div>
      </div>

      {error && <Alert message={error} type="error" showIcon className="mb-4" />}

      {isPaid ? (
        <div className="text-center py-8">
          <CheckCircleOutlined className="text-5xl text-green-500 mb-3" />
          <h3 className="text-lg font-semibold text-gray-900 mb-1">Đã thanh toán thành công!</h3>
          <p className="text-gray-500 text-sm mb-6">Lệ phí đã được xác nhận. Tiếp tục điền hồ sơ.</p>
          <Button
            type="primary"
            size="large"
            onClick={handleRefresh}
            loading={loading}
            style={{ backgroundColor: '#4f46e5' }}
          >
            Tiếp tục →
          </Button>
        </div>
      ) : (
        <>
          <div className="bg-linear-to-r from-indigo-50 to-blue-50 rounded-xl p-6 mb-6">
            <div className="flex items-center justify-between mb-4">
              <span className="text-gray-700 font-medium">Lệ phí xét tuyển</span>
              <span className="text-2xl font-bold text-indigo-600">50.000 ₫</span>
            </div>
            <div className="space-y-2 text-sm text-gray-600">
              <div className="flex items-center gap-2">
                <CheckCircleOutlined className="text-green-500" />
                <span>Lệ phí một lần duy nhất, không hoàn trả</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircleOutlined className="text-green-500" />
                <span>Xác nhận ngay lập tức qua VNPay</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircleOutlined className="text-green-500" />
                <span>Hỗ trợ ATM, thẻ quốc tế, ví điện tử</span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2 mb-6">
            <SafetyOutlined className="text-green-500" />
            <span className="text-sm text-gray-500">Thanh toán bảo mật qua cổng VNPay</span>
            <Tag color="green" className="ml-auto">Sandbox</Tag>
          </div>

          <Button
            type="primary"
            size="large"
            block
            icon={<CreditCardOutlined />}
            loading={loading}
            onClick={handlePayment}
            style={{ backgroundColor: '#4f46e5', height: 48, fontWeight: 600 }}
          >
            Thanh toán qua VNPay
          </Button>

          <p className="text-center text-gray-400 text-xs mt-3">
            Bạn sẽ được chuyển sang trang thanh toán VNPay an toàn
          </p>
        </>
      )}
    </Card>
  );
}
