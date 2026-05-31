export const LANGUAGES = [
  { value: 'english', label: 'Tiếng Anh' },
  { value: 'japanese', label: 'Tiếng Nhật' },
  { value: 'korean', label: 'Tiếng Hàn' },
  { value: 'chinese', label: 'Tiếng Trung' },
  { value: 'french', label: 'Tiếng Pháp' },
];

export const LEVELS: Record<string, { value: string; label: string }[]> = {
  english: [
    { value: 'A1', label: 'A1 - Sơ cấp 1 (Người mới bắt đầu)' },
    { value: 'A2', label: 'A2 - Sơ cấp 2' },
    { value: 'B1', label: 'B1 - Trung cấp 1' },
    { value: 'B2', label: 'B2 - Trung cấp 2' },
    { value: 'C1', label: 'C1 - Nâng cao' },
    { value: 'IELTS', label: 'Luyện thi IELTS' },
    { value: 'TOEIC', label: 'Luyện thi TOEIC' },
  ],
  japanese: [
    { value: 'N5', label: 'N5 - Sơ cấp (Người mới bắt đầu)' },
    { value: 'N4', label: 'N4 - Sơ trung cấp' },
    { value: 'N3', label: 'N3 - Trung cấp' },
    { value: 'N2', label: 'N2 - Trung cao cấp' },
    { value: 'N1', label: 'N1 - Nâng cao' },
  ],
  korean: [
    { value: 'K1', label: 'Sơ cấp 1 (Người mới bắt đầu)' },
    { value: 'K2', label: 'Sơ cấp 2' },
    { value: 'K3', label: 'Trung cấp' },
    { value: 'TOPIK', label: 'Luyện thi TOPIK' },
  ],
  chinese: [
    { value: 'HSK1', label: 'HSK 1-2 - Sơ cấp (Người mới bắt đầu)' },
    { value: 'HSK3', label: 'HSK 3-4 - Trung cấp' },
    { value: 'HSK5', label: 'HSK 5-6 - Nâng cao' },
  ],
  french: [
    { value: 'FR_A1', label: 'A1 - Sơ cấp (Người mới bắt đầu)' },
    { value: 'FR_A2', label: 'A2 - Tiền trung cấp' },
    { value: 'FR_B1', label: 'B1 - Trung cấp' },
    { value: 'FR_B2', label: 'B2 - Trung cao cấp' },
  ],
};

export const TRAINING_TYPES = [
  { value: 'regular', label: 'Chính quy (3 buổi/tuần)' },
  { value: 'intensive', label: 'Cường độ cao (5 buổi/tuần)' },
  { value: 'weekend', label: 'Cuối tuần (Thứ 7 & CN)' },
];

export const SCHEDULES = [
  { value: 'morning', label: 'Buổi sáng (7:30 - 9:30)' },
  { value: 'noon', label: 'Buổi trưa (11:30 - 13:30)' },
  { value: 'afternoon', label: 'Buổi chiều (15:00 - 17:00)' },
  { value: 'evening', label: 'Buổi tối (18:00 - 20:00)' },
];

export const FACILITIES = [
  { value: 'hanoi_center', label: 'Cơ sở Hà Nội - 123 Phố Huế, Hai Bà Trưng' },
  { value: 'hanoi_west', label: 'Cơ sở Hà Nội Tây - 456 Xuân Thủy, Cầu Giấy' },
  { value: 'hcm_center', label: 'Cơ sở TP.HCM - 789 Nguyễn Huệ, Q.1' },
  { value: 'online', label: 'Học trực tuyến (Online via Zoom)' },
];

export const BEGINNER_LEVELS = ['A1', 'N5', 'K1', 'HSK1', 'FR_A1'];

export const FIXED_EXAM_DATES = [
  '2026-06-15',
  '2026-07-15',
  '2026-08-15',
  '2026-09-15',
  '2026-10-15',
  '2026-11-15',
];

export const STEP_LABELS = [
  'Ký cam kết',
  'Lệ phí',
  'Điền hồ sơ',
  'Kiểm tra năng lực',
  'Chọn chương trình',
  'Nộp bản gốc',
];

export const STATUS_LABELS: Record<string, string> = {
  step_1: 'Bước 1: Ký chính sách',
  step_2: 'Bước 2: Thanh toán',
  step_3: 'Bước 3: Điền hồ sơ',
  step_4: 'Bước 4: Kiểm tra năng lực',
  step_5: 'Bước 5: Chọn chương trình',
  step_6: 'Bước 6: Nộp bản gốc',
  completed: 'Hoàn tất',
  cancelled: 'Đã hủy',
  pending: 'Chờ xử lý',
  in_progress: 'Đang xử lý',
  waiting_docs: 'Chờ tài liệu',
  rejected: 'Từ chối',
};

export const formatCurrency = (amount: number): string => {
  return amount.toLocaleString('vi-VN') + ' ₫';
};
