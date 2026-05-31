import { z } from 'zod';

export const signPolicySchema = z.object({
  signature_data: z.string().min(1, 'Vui lòng ký tên trước khi tiếp tục'),
});

export const studentFormSchema = z.object({
  language: z.enum(['english', 'japanese', 'korean', 'chinese', 'french'], { required_error: 'Vui lòng chọn ngôn ngữ' }),
  level: z.string().min(1, 'Vui lòng chọn trình độ'),
  training_type: z.enum(['regular', 'intensive', 'weekend'], { required_error: 'Vui lòng chọn hình thức đào tạo' }),
  schedule: z.enum(['morning', 'noon', 'afternoon', 'evening'], { required_error: 'Vui lòng chọn ca học' }),
  facility: z.string().min(1, 'Vui lòng chọn cơ sở học'),
  student_full_name: z.string().min(2, 'Họ tên học sinh tối thiểu 2 ký tự'),
  student_dob: z.string().min(1, 'Vui lòng nhập ngày sinh'),
  student_gender: z.enum(['male', 'female', 'other'], { required_error: 'Vui lòng chọn giới tính' }),
  student_cccd: z.string().min(9, 'CCCD/CMND không hợp lệ').max(12),
  student_address: z.string().min(5, 'Vui lòng nhập địa chỉ'),
  student_current_school: z.string().optional(),
  parent_full_name: z.string().min(2, 'Họ tên phụ huynh tối thiểu 2 ký tự'),
  parent_phone: z.string().regex(/^(0[3|5|7|8|9])+([0-9]{8})$/, 'Số điện thoại phụ huynh không hợp lệ'),
  parent_email: z.string().email().optional().or(z.literal('')),
  notes: z.string().optional(),
  preferred_exam_date: z.string().optional(),
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
