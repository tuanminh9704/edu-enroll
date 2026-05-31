import { useState } from 'react';
import { Button, Card, Checkbox, Input } from 'antd';
import { CheckCircleOutlined, FileTextOutlined } from '@ant-design/icons';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import dayjs from 'dayjs';
import DatePicker from 'antd/es/date-picker';
import { enrollmentService } from '../../../services/enrollment.service';
import { useEnrollmentStore } from '../../../store/enrollment.store';

const docsSchema = z.object({
  appointment_date: z.string().min(1, 'Vui lòng chọn ngày hẹn nộp hồ sơ'),
  buy_books: z.boolean(),
  notes: z.string().optional(),
});

type DocsData = z.infer<typeof docsSchema>;

export default function Step6Original() {
  const { enrollment, setEnrollment, setError: setStoreError } = useEnrollmentStore();
  const [docNumber, setDocNumber] = useState<string | null>(enrollment?.document_number || null);

  const { control, handleSubmit, formState: { errors, isSubmitting } } = useForm<DocsData>({
    resolver: zodResolver(docsSchema),
    defaultValues: {
      appointment_date: enrollment?.appointment_date || '',
      buy_books: !!enrollment?.buy_books,
      notes: enrollment?.notes || '',
    },
  });

  const onSubmit = async (data: DocsData) => {
    setStoreError('');
    try {
      const result = await enrollmentService.submitOriginalDocs(data as Record<string, unknown>);
      setDocNumber(result.documentNumber);
      const updated = await enrollmentService.getEnrollment();
      setEnrollment(updated);
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } }).response?.data?.message || 'Có lỗi xảy ra';
      setStoreError(msg);
    }
  };

  const completed = enrollment?.status === 'completed' || !!docNumber || !!enrollment?.document_number;
  const displayDocNumber = docNumber || enrollment?.document_number;

  return (
    <Card className="shadow-md border-0 rounded-2xl">
      {completed && (
        <div className="mb-6 rounded-xl border border-green-200 bg-green-50 p-4 text-center">
          <CheckCircleOutlined className="mb-2 text-3xl text-green-500" />
          <h2 className="text-lg font-bold text-gray-900">Hồ sơ đã hoàn tất</h2>
          <p className="text-sm text-gray-500">Bạn vẫn có thể cập nhật lịch hẹn nộp hồ sơ bản gốc.</p>
          {displayDocNumber && (
            <p className="mt-2 text-sm font-semibold text-indigo-600">Mã hồ sơ: {displayDocNumber}</p>
          )}
        </div>
      )}

      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 bg-indigo-100 rounded-xl flex items-center justify-center">
          <span className="text-indigo-600 font-bold text-lg">6</span>
        </div>
        <div>
          <h2 className="text-lg font-bold text-gray-900">Nộp hồ sơ bản gốc</h2>
          <p className="text-gray-500 text-sm">Hẹn lịch nộp hồ sơ trực tiếp tại trung tâm</p>
        </div>
      </div>

      <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 mb-6">
        <div className="flex items-start gap-2">
          <FileTextOutlined className="text-amber-600 mt-0.5" />
          <div className="text-sm text-amber-800">
            <p className="font-semibold mb-1">Lưu ý quan trọng</p>
            <p>Mang theo: CCCD/CMND bản gốc và bản sao, sổ hộ khẩu, 2 ảnh thẻ 3x4. Giờ làm việc: 8h-17h, Thứ 2 - Thứ 7.</p>
          </div>
        </div>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Ngày hẹn nộp hồ sơ *</label>
          <Controller
            name="appointment_date"
            control={control}
            render={({ field }) => (
              <DatePicker
                className="w-full"
                size="large"
                format="DD/MM/YYYY"
                placeholder="Chọn ngày hẹn"
                status={errors.appointment_date ? 'error' : ''}
                disabledDate={(d) => d && d < dayjs().startOf('day')}
                value={field.value ? dayjs(field.value) : null}
                onChange={(date) => field.onChange(date ? date.format('YYYY-MM-DD') : '')}
              />
            )}
          />
          {errors.appointment_date && <p className="text-red-500 text-xs mt-1">{errors.appointment_date.message}</p>}
        </div>

        <Controller
          name="buy_books"
          control={control}
          render={({ field }) => (
            <Checkbox checked={!!field.value} onChange={(e) => field.onChange(e.target.checked)}>
              Tôi muốn mua sách giáo trình tại trung tâm
            </Checkbox>
          )}
        />

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Ghi chú</label>
          <Controller
            name="notes"
            control={control}
            render={({ field }) => (
              <Input.TextArea {...field} rows={3} placeholder="Ví dụ: Đã liên hệ nhân viên Nguyễn A, sẽ đến vào buổi sáng..." />
            )}
          />
        </div>

        <Button
          htmlType="submit"
          type="primary"
          size="large"
          block
          loading={isSubmitting}
          style={{ backgroundColor: '#4f46e5', height: 48, fontWeight: 600 }}
        >
          {completed ? 'Cập nhật lịch hẹn' : 'Xác nhận hẹn nộp hồ sơ'}
        </Button>
      </form>
    </Card>
  );
}
