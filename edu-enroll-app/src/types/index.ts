export interface User {
  id: string;
  email: string;
  phone?: string;
  full_name?: string;
  preferred_language?: string;
  role: 'student' | 'staff' | 'admin' | 'super_admin';
  is_active?: boolean;
  created_at: string;
}

export interface EnrollmentForm {
  id: string;
  user_id: string;
  current_step: number;
  status: string;
  // Course preferences
  language?: string;
  level?: string;
  training_type?: string;
  schedule?: string;
  facility?: string;
  // Policy
  signed_policy?: number;
  signature_data?: string;
  // Payment
  payment_status: 'pending' | 'success' | 'failed' | 'expired';
  payment_amount?: number;
  paid_at?: string;
  // Student info (step 3)
  student_full_name?: string;
  student_dob?: string;
  student_gender?: string;
  student_cccd?: string;
  student_address?: string;
  student_current_school?: string;
  // Parent info
  parent_full_name?: string;
  parent_phone?: string;
  parent_email?: string;
  // Exam
  exam_required?: number;
  exam_confirmed?: number;
  preferred_exam_date?: string;
  exam_schedule_id?: string;
  exam_score?: number;
  exam_level_passed?: string;
  exam_pass_status?: 'passed' | 'failed';
  exam_pass_threshold?: number;
  exam_scored_at?: string;
  // Program
  program_id?: string;
  program_name?: string;
  tuition_fee?: number;
  // Final submission
  appointment_date?: string;
  buy_books?: number;
  document_number?: string;
  documents_submitted?: number;
  notes?: string;
  // Admin
  staff_notes?: string;
  // Timestamps
  created_at: string;
  updated_at?: string;
}

export interface ExamSchedule {
  _id?: string;
  id: string;
  title?: string;
  language: string;
  exam_date: string;
  location: string;
  room?: string;
  format: 'offline' | 'online';
  max_slots: number;
  registered_slots: number;
  status: 'open' | 'closed' | 'cancelled';
}

export interface ExamResult {
  id: string;
  schedule_id: string;
  exam_code: string;
  status: string;
  score?: number;
  level_passed?: string;
  pass_status?: 'passed' | 'failed';
  pass_threshold?: number;
  score_status?: string;
  title?: string;
  language?: string;
  exam_date?: string;
  location?: string;
  room?: string;
  room_published?: boolean;
  format?: 'offline' | 'online';
}

export interface TrainingProgram {
  id: string;
  language: string;
  name: string;
  level: string;
  level_code?: string;
  duration_months: number;
  sessions_per_week: number;
  session_hours: number;
  tuition_fee: number;
  description?: string;
  min_score?: number;
}

export interface Notification {
  id: string;
  title: string;
  message: string;
  type: 'info' | 'success' | 'warning' | 'error';
  link?: string;
  is_read: boolean;
  created_at: string;
}

export interface Interview {
  _id: string;
  title: string;
  scheduled_at: string;
  location: string;
  format: 'online' | 'offline';
  status: 'pending' | 'confirmed' | 'declined' | 'completed' | 'cancelled';
  notes?: string;
}

export interface Invoice {
  _id: string;
  invoice_number: string;
  amount: number;
  status: 'draft' | 'issued' | 'paid' | 'cancelled';
  issued_at: string;
  paid_at?: string;
  description?: string;
}

export interface Banner {
  _id: string;
  title: string;
  subtitle?: string;
  image_url?: string;
  link_url?: string;
  position: string;
  is_active: boolean;
  sort_order: number;
}

export interface NewsItem {
  _id: string;
  title: string;
  slug: string;
  summary?: string;
  content?: string;
  category: string;
  status: 'draft' | 'published' | 'archived';
  published_at?: string;
  created_at: string;
}

export interface ApiResponse<T = unknown> {
  success: boolean;
  message: string;
  data: T;
}
