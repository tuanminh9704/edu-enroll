import mongoose from 'mongoose';
import { TrainingProgram } from '../models/TrainingProgram';
import { ExamSchedule } from '../models/ExamSchedule';
import { User } from '../models/User';
import { config } from '../configs';
import bcrypt from 'bcryptjs';
import { FIXED_EXAM_DATES } from '../constants/exam';

const PROGRAMS = [
  { language: 'english', name: 'Tiếng Anh A1 - Sơ cấp 1', level_code: 'A1', duration_months: 3, sessions_per_week: 3, tuition_fee: 3600000, description: 'Khoá học tiếng Anh từ con số 0, phù hợp người mới bắt đầu.' },
  { language: 'english', name: 'Tiếng Anh A2 - Sơ cấp 2', level_code: 'A2', duration_months: 3, sessions_per_week: 3, tuition_fee: 3800000, description: 'Nâng cao từ A1, bổ sung ngữ pháp và từ vựng giao tiếp hàng ngày.' },
  { language: 'english', name: 'Tiếng Anh B1 - Trung cấp', level_code: 'B1', duration_months: 4, sessions_per_week: 3, tuition_fee: 4500000, description: 'Giao tiếp tự tin trong môi trường công sở và học thuật.' },
  { language: 'english', name: 'Tiếng Anh B2 - Trung cao', level_code: 'B2', duration_months: 4, sessions_per_week: 4, tuition_fee: 5200000, description: 'Thành thạo đọc hiểu và viết luận học thuật.' },
  { language: 'english', name: 'Luyện thi IELTS', level_code: 'IELTS', duration_months: 5, sessions_per_week: 4, tuition_fee: 7500000, description: 'Chiến lược và kỹ năng làm bài thi IELTS mục tiêu 6.0-8.0.' },
  { language: 'english', name: 'Luyện thi TOEIC', level_code: 'TOEIC', duration_months: 3, sessions_per_week: 3, tuition_fee: 5500000, description: 'Ôn thi TOEIC mục tiêu 600-900 điểm.' },
  { language: 'japanese', name: 'Tiếng Nhật N5 - Sơ cấp', level_code: 'N5', duration_months: 3, sessions_per_week: 3, tuition_fee: 4200000, description: 'Học bảng chữ cái và hội thoại cơ bản.' },
  { language: 'japanese', name: 'Tiếng Nhật N4', level_code: 'N4', duration_months: 4, sessions_per_week: 3, tuition_fee: 4600000, description: 'Mở rộng vốn từ và cấu trúc câu phức.' },
  { language: 'japanese', name: 'Tiếng Nhật N3 - Trung cấp', level_code: 'N3', duration_months: 5, sessions_per_week: 4, tuition_fee: 5800000, description: 'Đọc hiểu văn bản và nghe hiểu hội thoại phức tạp.' },
  { language: 'japanese', name: 'Tiếng Nhật N2 - Trung cao', level_code: 'N2', duration_months: 6, sessions_per_week: 4, tuition_fee: 6500000, description: 'Nắm vững cấu trúc ngữ pháp nâng cao, sẵn sàng làm việc tại Nhật.' },
  { language: 'korean', name: 'Tiếng Hàn Sơ cấp 1', level_code: 'K1', duration_months: 3, sessions_per_week: 3, tuition_fee: 3900000, description: 'Học Hangul và hội thoại cơ bản.' },
  { language: 'korean', name: 'Tiếng Hàn Sơ cấp 2', level_code: 'K2', duration_months: 3, sessions_per_week: 3, tuition_fee: 4100000, description: 'Nâng cao giao tiếp và từ vựng sinh hoạt hàng ngày.' },
  { language: 'korean', name: 'Tiếng Hàn Trung cấp', level_code: 'K3', duration_months: 5, sessions_per_week: 4, tuition_fee: 5500000, description: 'Đọc hiểu và viết luận tiếng Hàn.' },
  { language: 'chinese', name: 'Tiếng Trung HSK 1-2', level_code: 'HSK1', duration_months: 4, sessions_per_week: 3, tuition_fee: 4300000, description: 'Pinyin, hán tự cơ bản và hội thoại giao tiếp.' },
  { language: 'chinese', name: 'Tiếng Trung HSK 3-4', level_code: 'HSK3', duration_months: 5, sessions_per_week: 4, tuition_fee: 5600000, description: 'Ngữ pháp trung cấp, đọc hiểu văn bản.' },
  { language: 'french', name: 'Tiếng Pháp A1 - Débutant', level_code: 'FR_A1', duration_months: 3, sessions_per_week: 3, tuition_fee: 4000000, description: 'Phát âm và giao tiếp cơ bản tiếng Pháp.' },
  { language: 'french', name: 'Tiếng Pháp A2', level_code: 'FR_A2', duration_months: 4, sessions_per_week: 3, tuition_fee: 4400000, description: 'Mở rộng từ vựng, luyện nghe và nói cơ bản.' },
  { language: 'french', name: 'Tiếng Pháp B1 - DELF', level_code: 'FR_B1', duration_months: 5, sessions_per_week: 4, tuition_fee: 5800000, description: 'Luyện thi DELF B1 chuẩn châu Âu.' },
];

const fixedDate = (index: number) => new Date(`${FIXED_EXAM_DATES[index]}T00:00:00.000`);

const EXAM_SCHEDULES = [
  { title: 'Khảo sát năng lực Tiếng Anh - 15/06/2026', language: 'english', exam_date: fixedDate(0), location: 'Cơ sở Hà Nội', format: 'offline', max_slots: 50, registered_slots: 0, status: 'open' },
  { title: 'Khảo sát năng lực Tiếng Anh - 15/07/2026', language: 'english', exam_date: fixedDate(1), location: 'Cơ sở TP.HCM', format: 'offline', max_slots: 40, registered_slots: 0, status: 'open' },
  { title: 'Khảo sát năng lực Tiếng Nhật - 15/06/2026', language: 'japanese', exam_date: fixedDate(0), location: 'Cơ sở Hà Nội', format: 'offline', max_slots: 30, registered_slots: 0, status: 'open' },
  { title: 'Khảo sát năng lực Tiếng Hàn - 15/06/2026', language: 'korean', exam_date: fixedDate(0), location: 'Online (Zoom)', format: 'online', max_slots: 60, registered_slots: 0, status: 'open' },
  { title: 'Khảo sát năng lực Tiếng Trung - 15/07/2026', language: 'chinese', exam_date: fixedDate(1), location: 'Cơ sở Hà Nội', format: 'offline', max_slots: 35, registered_slots: 0, status: 'open' },
  { title: 'Khảo sát năng lực Tiếng Pháp - 15/07/2026', language: 'french', exam_date: fixedDate(1), location: 'Online (Zoom)', format: 'online', max_slots: 25, registered_slots: 0, status: 'open' },
];

export const seedData = async () => {
  const [programCount, scheduleCount] = await Promise.all([
    TrainingProgram.countDocuments(),
    ExamSchedule.countDocuments(),
  ]);

  if (programCount === 0) {
    await TrainingProgram.insertMany(PROGRAMS.map(p => ({ ...p, is_active: true })));
    console.log(`Seeded ${PROGRAMS.length} training programs`);
  }

  if (scheduleCount === 0) {
    await ExamSchedule.insertMany(EXAM_SCHEDULES);
    console.log(`Seeded ${EXAM_SCHEDULES.length} exam schedules`);
  }
};

export const seedAdmin = async () => {
  const adminEmail = 'admin@apex-language.vn';
  const existing = await User.findOne({ email: adminEmail });
  if (!existing) {
    const password_hash = await bcrypt.hash('Admin@1234', 12);
    await User.create({
      email: adminEmail,
      password_hash,
      full_name: 'Super Admin',
      phone: '0900000001',
      role: 'super_admin',
      is_active: true,
    });
    console.log('Seeded super_admin: admin@apex-language.vn / Admin@1234');
  }
};

if (require.main === module) {
  mongoose.connect(config.mongodbUri)
    .then(async () => {
      await seedData();
      await seedAdmin();
      console.log('Seed completed');
      process.exit(0);
    })
    .catch((err) => { console.error(err); process.exit(1); });
}
