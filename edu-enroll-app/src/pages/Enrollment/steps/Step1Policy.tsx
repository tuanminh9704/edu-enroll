import { useRef, useState, useEffect } from 'react';
import { Button, Card, Alert, Checkbox } from 'antd';
import { EditOutlined, ClearOutlined } from '@ant-design/icons';
import { enrollmentService } from '../../../services/enrollment.service';
import { useEnrollmentStore } from '../../../store/enrollment.store';

const POLICY_TEXT = `CHÍNH SÁCH HỌC VIÊN - TRUNG TÂM NGÔN NGỮ APEX

1. CAM KẾT HỌC TẬP
   - Học viên cam kết tham gia đầy đủ các buổi học theo lịch đã đăng ký.
   - Trường hợp vắng mặt phải báo trước ít nhất 24 giờ.
   - Học viên có trách nhiệm hoàn thành bài tập và ôn tập đúng hạn.

2. QUY ĐỊNH LỆ PHÍ
   - Lệ phí đăng ký tuyển sinh: 50.000 VNĐ (không hoàn trả).
   - Học phí thanh toán theo thỏa thuận với trung tâm trước khi khai giảng.
   - Hoàn trả học phí theo chính sách từng chương trình.

3. QUY ĐỊNH ỨNG XỬ
   - Tôn trọng giảng viên và các học viên khác.
   - Không sử dụng điện thoại trong giờ học.
   - Giữ gìn cơ sở vật chất của trung tâm.

4. BẢO MẬT THÔNG TIN
   - Thông tin cá nhân được bảo mật theo quy định pháp luật.
   - Trung tâm có quyền sử dụng hình ảnh học viên cho mục đích quảng bá (cần đồng ý riêng).

5. ĐIỀU KHOẢN KHÁC
   - Trung tâm có quyền điều chỉnh lịch học khi cần thiết và thông báo trước 48 giờ.
   - Học viên được phép chuyển lớp tối đa 1 lần trong khóa học.
   - Chứng chỉ được cấp sau khi hoàn thành khóa học và đạt điểm thi đầu ra.`;

export default function Step1Policy() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [hasSignature, setHasSignature] = useState(false);
  const [agreed, setAgreed] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const { setEnrollment } = useEnrollmentStore();

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.strokeStyle = '#1e1b4b';
    ctx.lineWidth = 2;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
  }, []);

  const getPos = (e: React.MouseEvent | React.TouchEvent) => {
    const canvas = canvasRef.current!;
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    if ('touches' in e) {
      return {
        x: (e.touches[0].clientX - rect.left) * scaleX,
        y: (e.touches[0].clientY - rect.top) * scaleY,
      };
    }
    return {
      x: (e.clientX - rect.left) * scaleX,
      y: (e.clientY - rect.top) * scaleY,
    };
  };

  const startDraw = (e: React.MouseEvent | React.TouchEvent) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d')!;
    const pos = getPos(e);
    ctx.beginPath();
    ctx.moveTo(pos.x, pos.y);
    setIsDrawing(true);
  };

  const draw = (e: React.MouseEvent | React.TouchEvent) => {
    if (!isDrawing) return;
    e.preventDefault();
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d')!;
    const pos = getPos(e);
    ctx.lineTo(pos.x, pos.y);
    ctx.stroke();
    setHasSignature(true);
  };

  const stopDraw = () => setIsDrawing(false);

  const clearSignature = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d')!;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    setHasSignature(false);
  };

  const handleSubmit = async () => {
    if (!hasSignature) { setError('Vui lòng ký tên vào ô chữ ký'); return; }
    if (!agreed) { setError('Vui lòng xác nhận đồng ý với chính sách'); return; }
    const canvas = canvasRef.current!;
    const signatureData = canvas.toDataURL('image/png');
    setLoading(true);
    setError('');
    try {
      const updated = await enrollmentService.signPolicy(signatureData);
      setEnrollment(updated);
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } }).response?.data?.message || 'Có lỗi xảy ra';
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="shadow-md border-0 rounded-2xl">
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 bg-indigo-100 rounded-xl flex items-center justify-center">
          <span className="text-indigo-600 font-bold text-lg">1</span>
        </div>
        <div>
          <h2 className="text-lg font-bold text-gray-900">Ký cam kết chính sách</h2>
          <p className="text-gray-500 text-sm">Đọc và ký xác nhận chính sách học viên</p>
        </div>
      </div>

      {error && <Alert message={error} type="error" showIcon className="mb-4" />}

      <div className="bg-gray-50 rounded-xl p-4 mb-6 h-64 overflow-y-auto border border-gray-200">
        <pre className="text-xs text-gray-700 font-sans whitespace-pre-wrap leading-relaxed">{POLICY_TEXT}</pre>
      </div>

      <div className="mb-6">
        <div className="flex items-center justify-between mb-2">
          <label className="text-sm font-medium text-gray-700">Chữ ký của bạn</label>
          <Button size="small" icon={<ClearOutlined />} onClick={clearSignature} type="text">
            Xóa
          </Button>
        </div>
        <div className="border-2 border-dashed border-gray-300 rounded-xl overflow-hidden bg-white relative">
          <canvas
            ref={canvasRef}
            width={600}
            height={150}
            className="w-full cursor-crosshair touch-none"
            onMouseDown={startDraw}
            onMouseMove={draw}
            onMouseUp={stopDraw}
            onMouseLeave={stopDraw}
            onTouchStart={startDraw}
            onTouchMove={draw}
            onTouchEnd={stopDraw}
          />
          {!hasSignature && (
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <div className="text-gray-300 text-sm flex items-center gap-2">
                <EditOutlined />
                <span>Ký tên vào đây</span>
              </div>
            </div>
          )}
        </div>
      </div>

      <Checkbox
        className="mb-4"
        checked={agreed}
        onChange={(e) => setAgreed(e.target.checked)}
      >
        Tôi đã đọc và đồng ý với tất cả các chính sách học viên của Trung tâm ngôn ngữ Apex
      </Checkbox>

      <Button
        type="primary"
        size="large"
        block
        loading={loading}
        onClick={handleSubmit}
        style={{ backgroundColor: '#4f46e5', height: 48, fontWeight: 600 }}
      >
        Xác nhận & Tiếp theo
      </Button>
    </Card>
  );
}
