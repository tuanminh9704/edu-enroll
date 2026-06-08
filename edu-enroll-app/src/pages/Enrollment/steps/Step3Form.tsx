import { useEffect, useRef, useState } from 'react';
import { Button, Card, Input, Select, Divider } from 'antd';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import dayjs from 'dayjs';
import DatePicker from 'antd/es/date-picker';
import { enrollmentService } from '../../../services/enrollment.service';
import { useEnrollmentStore } from '../../../store/enrollment.store';
import { useAuthStore } from '../../../store/auth.store';
import { LANGUAGES, LEVELS, TRAINING_TYPES, SCHEDULES, FACILITIES, BEGINNER_LEVELS } from '../../../constants';

const CCCD_REGEX = /^(\d{9}|\d{12})$/;
const VIETNAM_PHONE_REGEX = /^(0[35789])[0-9]{8}$/;

const optionalText = (max: number, message: string) =>
  z.string().trim().max(max, message).optional().or(z.literal(''));

const optionalParentPhone = z.string().trim()
  .regex(VIETNAM_PHONE_REGEX, 'Số điện thoại phụ huynh phải có 10 chữ số và bắt đầu bằng 03, 05, 07, 08 hoặc 09')
  .optional()
  .or(z.literal(''));

const isUnder18 = (dateText?: string) => {
  if (!dateText) return false;
  const dob = dayjs(dateText);
  if (!dob.isValid()) return false;
  return dayjs().diff(dob, 'year') < 18;
};

const formSchema = z.object({
  language: z.string().min(1, 'Vui lòng chọn ngoại ngữ'),
  level: z.string().min(1, 'Vui lòng chọn trình độ'),
  training_type: z.string().min(1, 'Vui lòng chọn hình thức học'),
  schedule: z.string().min(1, 'Vui lòng chọn lịch học'),
  facility: z.string().min(1, 'Vui lòng chọn cơ sở'),
  student_full_name: z.string().trim()
    .min(2, 'Họ tên học viên phải có ít nhất 2 ký tự')
    .max(100, 'Họ tên học viên không được vượt quá 100 ký tự'),
  student_dob: z.string().min(1, 'Vui lòng chọn ngày sinh')
    .refine((value) => dayjs(value).isValid(), 'Ngày sinh không đúng định dạng')
    .refine((value) => !dayjs(value).isAfter(dayjs(), 'day'), 'Ngày sinh không được lớn hơn ngày hiện tại'),
  student_gender: z.enum(['male', 'female', 'other'], { required_error: 'Vui lòng chọn giới tính' }),
  student_cccd: z.string().trim().regex(CCCD_REGEX, 'CCCD/CMND phải gồm đúng 9 hoặc 12 chữ số'),
  student_address: z.string().trim()
    .min(5, 'Địa chỉ phải có ít nhất 5 ký tự')
    .max(255, 'Địa chỉ không được vượt quá 255 ký tự'),
  student_current_school: optionalText(150, 'Tên trường đang học không được vượt quá 150 ký tự'),
  parent_full_name: optionalText(100, 'Họ tên phụ huynh không được vượt quá 100 ký tự'),
  parent_phone: optionalParentPhone,
  parent_email: z.string().trim().email('Email phụ huynh không đúng định dạng, ví dụ: phuhuynh@example.com').optional().or(z.literal('')),
  notes: optionalText(500, 'Ghi chú không được vượt quá 500 ký tự'),
  preferred_exam_date: z.string().optional(),
}).refine((data) => BEGINNER_LEVELS.includes(data.level) || !!data.preferred_exam_date, {
  message: 'Vui lòng chọn ngày kiểm tra',
  path: ['preferred_exam_date'],
}).superRefine((data, ctx) => {
  if (!isUnder18(data.student_dob)) return;
  if (!data.parent_full_name || data.parent_full_name.trim().length < 2) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ['parent_full_name'],
      message: 'Học viên dưới 18 tuổi phải nhập họ tên phụ huynh, tối thiểu 2 ký tự',
    });
  }
  if (!data.parent_phone) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ['parent_phone'],
      message: 'Học viên dưới 18 tuổi phải nhập số điện thoại phụ huynh',
    });
  }
});

type FormData = z.infer<typeof formSchema>;

interface ApiValidationError {
  field?: string;
  message?: string;
}

const formatSubmitError = (err: unknown) => {
  const response = (err as { response?: { data?: { message?: string; errors?: ApiValidationError[] } } }).response?.data;
  const messages = response?.errors
    ?.map((item) => item.message)
    .filter((message): message is string => Boolean(message));

  if (messages?.length) {
    return `Vui lòng kiểm tra lại hồ sơ: ${Array.from(new Set(messages)).join('; ')}`;
  }

  return response?.message || 'Có lỗi xảy ra';
};

interface ExamDateSchedule {
  _id?: string;
  id?: string;
  title?: string;
  exam_date: string;
  location?: string;
}

export default function Step3Form() {
  const { enrollment, setEnrollment, setError: setStoreError } = useEnrollmentStore();
  const { user } = useAuthStore();

  const { control, handleSubmit, watch, setValue, formState: { errors, isSubmitting } } = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      language: enrollment?.language || user?.preferred_language || '',
      level: enrollment?.level || '',
      training_type: enrollment?.training_type || '',
      schedule: enrollment?.schedule || '',
      facility: enrollment?.facility || '',
      student_full_name: enrollment?.student_full_name || '',
      student_dob: enrollment?.student_dob || '',
      student_gender: (enrollment?.student_gender as 'male' | 'female' | 'other') || undefined,
      student_cccd: enrollment?.student_cccd || '',
      student_address: enrollment?.student_address || '',
      student_current_school: enrollment?.student_current_school || '',
      parent_full_name: enrollment?.parent_full_name || '',
      parent_phone: enrollment?.parent_phone || '',
      parent_email: enrollment?.parent_email || '',
      notes: enrollment?.notes || '',
      preferred_exam_date: enrollment?.preferred_exam_date || '',
    },
  });

  const selectedLanguage = watch('language');
  const selectedLevel = watch('level');
  const examRequired = selectedLevel ? !BEGINNER_LEVELS.includes(selectedLevel) : false;
  const previousLanguage = useRef(selectedLanguage);
  const [examSchedules, setExamSchedules] = useState<ExamDateSchedule[]>([]);
  const [loadingExamSchedules, setLoadingExamSchedules] = useState(false);

  useEffect(() => {
    if (user?.preferred_language && !selectedLanguage) {
      setValue('language', user.preferred_language);
    }
  }, [selectedLanguage, setValue, user?.preferred_language]);

  useEffect(() => {
    if (previousLanguage.current !== selectedLanguage) {
      setValue('level', '');
      setValue('preferred_exam_date', '');
      previousLanguage.current = selectedLanguage;
    }
  }, [selectedLanguage, setValue]);

  useEffect(() => {
    if (!selectedLanguage || !examRequired) {
      setExamSchedules([]);
      if (!examRequired) setValue('preferred_exam_date', '');
      return;
    }

    let active = true;
    setLoadingExamSchedules(true);
    enrollmentService.getExamSchedules(selectedLanguage)
      .then((list) => {
        if (active) setExamSchedules(list as ExamDateSchedule[]);
      })
      .catch(() => {
        if (active) setExamSchedules([]);
      })
      .finally(() => {
        if (active) setLoadingExamSchedules(false);
      });

    return () => { active = false; };
  }, [examRequired, selectedLanguage, setValue]);

  const onSubmit = async (data: FormData) => {
    setStoreError('');
    try {
      const updated = await enrollmentService.submitForm(data as Record<string, unknown>);
      setEnrollment(updated);
    } catch (err: unknown) {
      setStoreError(formatSubmitError(err));
    }
  };

  const Field = ({ label, error, children }: { label: string; error?: string; children: React.ReactNode }) => (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1">{label}</label>
      {children}
      {error && <p className="text-red-500 text-xs mt-1">{error}</p>}
    </div>
  );

  const levelOptions = LEVELS[selectedLanguage] || [];
  const examDateOptions = Array.from(
    new Map(examSchedules.map((schedule) => [dayjs(schedule.exam_date).format('YYYY-MM-DD'), schedule])).entries()
  ).map(([date, schedule]) => ({
    value: date,
    label: `${dayjs(date).format('DD/MM/YYYY')}${schedule.title ? ` - ${schedule.title}` : ''}${schedule.location ? ` - ${schedule.location}` : ''}`,
  }));

  return (
    <Card className="shadow-md border-0 rounded-2xl">
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 bg-indigo-100 rounded-xl flex items-center justify-center">
          <span className="text-indigo-600 font-bold text-lg">3</span>
        </div>
        <div>
          <h2 className="text-lg font-bold text-gray-900">Điền thông tin hồ sơ</h2>
          <p className="text-gray-500 text-sm">Thông tin học viên và nguyện vọng học</p>
        </div>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <Divider orientation="left" className="text-sm text-gray-600 font-semibold">Nguyện vọng học</Divider>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Field label="Ngoại ngữ *" error={errors.language?.message}>
            <Controller name="language" control={control} render={({ field }) => (
              <Select
                {...field}
                className="w-full"
                size="large"
                placeholder="Chọn ngoại ngữ"
                disabled={!!user?.preferred_language}
                status={errors.language ? 'error' : ''}
                options={LANGUAGES.map(l => ({ value: l.value, label: l.label }))}
              />
            )} />
          </Field>

          <Field label="Trình độ *" error={errors.level?.message}>
            <Controller name="level" control={control} render={({ field }) => (
              <Select {...field} className="w-full" size="large" placeholder="Chọn trình độ" disabled={!selectedLanguage} status={errors.level ? 'error' : ''}
                options={levelOptions.map(l => ({ value: l.value, label: l.label }))}
              />
            )} />
          </Field>

          {examRequired && (
            <Field label="Ngày kiểm tra *" error={errors.preferred_exam_date?.message}>
              <Controller name="preferred_exam_date" control={control} render={({ field }) => (
                <Select
                  {...field}
                  className="w-full"
                  size="large"
                  placeholder="Chọn ngày kiểm tra"
                  status={errors.preferred_exam_date ? 'error' : ''}
                  loading={loadingExamSchedules}
                  disabled={!selectedLanguage || loadingExamSchedules}
                  options={examDateOptions}
                  notFoundContent={loadingExamSchedules ? 'Dang tai...' : 'Chua co lich thi phu hop'}
                />
              )} />
            </Field>
          )}

          <Field label="Hình thức học *" error={errors.training_type?.message}>
            <Controller name="training_type" control={control} render={({ field }) => (
              <Select {...field} className="w-full" size="large" placeholder="Chọn hình thức" status={errors.training_type ? 'error' : ''}
                options={TRAINING_TYPES.map(t => ({ value: t.value, label: t.label }))}
              />
            )} />
          </Field>

          <Field label="Lịch học *" error={errors.schedule?.message}>
            <Controller name="schedule" control={control} render={({ field }) => (
              <Select {...field} className="w-full" size="large" placeholder="Chọn ca học" status={errors.schedule ? 'error' : ''}
                options={SCHEDULES.map(s => ({ value: s.value, label: s.label }))}
              />
            )} />
          </Field>
        </div>

        <Field label="Cơ sở học *" error={errors.facility?.message}>
          <Controller name="facility" control={control} render={({ field }) => (
            <Select {...field} className="w-full" size="large" placeholder="Chọn cơ sở" status={errors.facility ? 'error' : ''}
              options={FACILITIES.map(f => ({ value: f.value, label: f.label }))}
            />
          )} />
        </Field>

        <Divider orientation="left" className="text-sm text-gray-600 font-semibold">Thông tin cá nhân</Divider>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Field label="Họ và tên *" error={errors.student_full_name?.message}>
            <Controller name="student_full_name" control={control} render={({ field }) => (
              <Input {...field} placeholder="Nguyễn Văn A" size="large" status={errors.student_full_name ? 'error' : ''} />
            )} />
          </Field>

          <Field label="Ngày sinh *" error={errors.student_dob?.message}>
            <Controller name="student_dob" control={control} render={({ field }) => (
              <DatePicker
                className="w-full"
                size="large"
                format="DD/MM/YYYY"
                placeholder="DD/MM/YYYY"
                status={errors.student_dob ? 'error' : ''}
                value={field.value ? dayjs(field.value) : null}
                onChange={(date) => field.onChange(date ? date.format('YYYY-MM-DD') : '')}
              />
            )} />
          </Field>

          <Field label="Giới tính *" error={errors.student_gender?.message}>
            <Controller name="student_gender" control={control} render={({ field }) => (
              <Select {...field} className="w-full" size="large" placeholder="Chọn giới tính" status={errors.student_gender ? 'error' : ''}
                options={[{ value: 'male', label: 'Nam' }, { value: 'female', label: 'Nữ' }, { value: 'other', label: 'Khác' }]}
              />
            )} />
          </Field>

          <Field label="CCCD/CMND *" error={errors.student_cccd?.message}>
            <Controller name="student_cccd" control={control} render={({ field }) => (
              <Input {...field} placeholder="012345678901" size="large" status={errors.student_cccd ? 'error' : ''} />
            )} />
          </Field>
        </div>

        <Field label="Địa chỉ *" error={errors.student_address?.message}>
          <Controller name="student_address" control={control} render={({ field }) => (
            <Input {...field} placeholder="Số nhà, đường, phường/xã, quận/huyện, tỉnh/thành phố" size="large" status={errors.student_address ? 'error' : ''} />
          )} />
        </Field>

        <Field label="Trường đang theo học (nếu có)" error={errors.student_current_school?.message}>
          <Controller name="student_current_school" control={control} render={({ field }) => (
            <Input {...field} placeholder="Tên trường..." size="large" />
          )} />
        </Field>

        <Divider orientation="left" className="text-sm text-gray-600 font-semibold">Thông tin phụ huynh (nếu dưới 18 tuổi)</Divider>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Field label="Họ tên phụ huynh" error={errors.parent_full_name?.message}>
            <Controller name="parent_full_name" control={control} render={({ field }) => (
              <Input {...field} placeholder="Tên phụ huynh" size="large" />
            )} />
          </Field>

          <Field label="Điện thoại phụ huynh" error={errors.parent_phone?.message}>
            <Controller name="parent_phone" control={control} render={({ field }) => (
              <Input {...field} placeholder="0901234567" size="large" />
            )} />
          </Field>
        </div>

        <Field label="Ghi chú thêm" error={errors.notes?.message}>
          <Controller name="notes" control={control} render={({ field }) => (
            <Input.TextArea {...field} rows={2} placeholder="Ví dụ: Tôi muốn đạt IELTS 6.5 để du học..." size="large" />
          )} />
        </Field>

        <Button
          htmlType="submit"
          type="primary"
          size="large"
          block
          loading={isSubmitting}
          style={{ backgroundColor: '#4f46e5', height: 48, fontWeight: 600 }}
        >
          Lưu & Tiếp theo
        </Button>
      </form>
    </Card>
  );
}
