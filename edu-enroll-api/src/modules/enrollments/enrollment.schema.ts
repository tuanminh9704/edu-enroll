import { z } from 'zod';

const LANGUAGE_VALUES = ['english', 'japanese', 'korean', 'chinese', 'french'] as const;
const TRAINING_TYPE_VALUES = ['regular', 'intensive', 'weekend'] as const;
const SCHEDULE_VALUES = ['morning', 'noon', 'afternoon', 'evening'] as const;
const GENDER_VALUES = ['male', 'female', 'other'] as const;
const VIETNAM_PHONE_REGEX = /^(0[35789])[0-9]{8}$/;
const CCCD_REGEX = /^(\d{9}|\d{12})$/;

const optionalText = (max = 255, message = `Nội dung không được vượt quá ${max} ký tự`) =>
  z.string().trim().max(max, message).optional().or(z.literal(''));

const optionalEmail = z.string().trim()
  .email('Email phụ huynh không đúng định dạng, ví dụ: phuhuynh@example.com')
  .optional()
  .or(z.literal(''));

const optionalParentPhone = z.string().trim()
  .regex(VIETNAM_PHONE_REGEX, 'Số điện thoại phụ huynh phải có 10 chữ số và bắt đầu bằng 03, 05, 07, 08 hoặc 09')
  .optional()
  .or(z.literal(''));

const isUnder18 = (dateText?: string) => {
  if (!dateText) return false;
  const dob = new Date(dateText);
  if (Number.isNaN(dob.getTime())) return false;
  const now = new Date();
  let age = now.getFullYear() - dob.getFullYear();
  const monthDiff = now.getMonth() - dob.getMonth();
  if (monthDiff < 0 || (monthDiff === 0 && now.getDate() < dob.getDate())) age -= 1;
  return age < 18;
};

export const signPolicySchema = z.object({
  signature_data: z.string().min(1, 'Vui lòng ký tên trước khi tiếp tục'),
});

export const studentFormSchema = z.object({
  language: z.enum(LANGUAGE_VALUES, {
    required_error: 'Vui lòng chọn ngoại ngữ',
    invalid_type_error: 'Ngoại ngữ không hợp lệ',
  }),
  level: z.string().trim().min(1, 'Vui lòng chọn trình độ'),
  training_type: z.enum(TRAINING_TYPE_VALUES, {
    required_error: 'Vui lòng chọn hình thức học',
    invalid_type_error: 'Hình thức học không hợp lệ',
  }),
  schedule: z.enum(SCHEDULE_VALUES, {
    required_error: 'Vui lòng chọn lịch học',
    invalid_type_error: 'Lịch học không hợp lệ',
  }),
  facility: z.string().trim().min(1, 'Vui lòng chọn cơ sở học'),
  student_full_name: z.string().trim()
    .min(2, 'Họ tên học viên phải có ít nhất 2 ký tự')
    .max(100, 'Họ tên học viên không được vượt quá 100 ký tự'),
  student_dob: z.string().trim()
    .min(1, 'Vui lòng chọn ngày sinh')
    .refine((value) => !Number.isNaN(new Date(value).getTime()), 'Ngày sinh không đúng định dạng')
    .refine((value) => new Date(value) <= new Date(), 'Ngày sinh không được lớn hơn ngày hiện tại'),
  student_gender: z.enum(GENDER_VALUES, {
    required_error: 'Vui lòng chọn giới tính',
    invalid_type_error: 'Giới tính không hợp lệ',
  }),
  student_cccd: z.string().trim()
    .regex(CCCD_REGEX, 'CCCD/CMND phải gồm đúng 9 hoặc 12 chữ số'),
  student_address: z.string().trim()
    .min(5, 'Địa chỉ phải có ít nhất 5 ký tự')
    .max(255, 'Địa chỉ không được vượt quá 255 ký tự'),
  student_current_school: optionalText(150, 'Tên trường đang học không được vượt quá 150 ký tự'),
  parent_full_name: optionalText(100, 'Họ tên phụ huynh không được vượt quá 100 ký tự'),
  parent_phone: optionalParentPhone,
  parent_email: optionalEmail,
  notes: optionalText(500, 'Ghi chú không được vượt quá 500 ký tự'),
  preferred_exam_date: z.string().trim().optional().or(z.literal('')),
}).superRefine((data, ctx) => {
  if (isUnder18(data.student_dob)) {
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
  }
});

export const selectProgramSchema = z.object({
  program_id: z.string().min(1, 'Vui lòng chọn hệ đào tạo'),
});

export const registerExamSchema = z.object({
  schedule_id: z.string().min(1, 'Vui lòng chọn lịch thi'),
});

export const submitOriginalDocsSchema = z.object({
  appointment_date: z.string().min(1, 'Vui lòng chọn ngày đến nộp hồ sơ'),
  buy_books: z.boolean().default(false),
  notes: z.string().optional(),
});

export type StudentFormInput = z.infer<typeof studentFormSchema>;
export type SubmitDocsInput = z.infer<typeof submitOriginalDocsSchema>;
