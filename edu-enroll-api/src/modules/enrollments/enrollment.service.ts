import mongoose from 'mongoose';
import { User } from '../../models/User';
import { EnrollmentForm, IEnrollmentForm } from '../../models/EnrollmentForm';
import { EnrollmentLog } from '../../models/EnrollmentLog';
import { ExamSchedule } from '../../models/ExamSchedule';
import { ExamRegistration } from '../../models/ExamRegistration';
import { ExamScore } from '../../models/ExamScore';
import { TrainingProgram } from '../../models/TrainingProgram';
import { Payment } from '../../models/Payment';
import { Counter } from '../../models/Counter';
import { Invoice } from '../../models/Invoice';
import { notificationService } from '../notifications/notification.service';
import { FIXED_EXAM_DATES } from '../../constants/exam';

const BEGINNER_LEVELS = ['A1', 'N5', 'K1', 'HSK1', 'FR_A1'];

const logAction = async (
  enrollmentId: mongoose.Types.ObjectId,
  changedBy: mongoose.Types.ObjectId,
  action: string,
  field?: string,
  oldVal?: string,
  newVal?: string
) => {
  await EnrollmentLog.create({
    enrollment_id: enrollmentId,
    changed_by: changedBy,
    action,
    field_name: field,
    old_value: oldVal,
    new_value: newVal,
  });
};

const getNextDocNumber = async (): Promise<string> => {
  const counter = await Counter.findOneAndUpdate(
    { counter_key: 'doc_number' },
    { $inc: { current_value: 1 } },
    { new: true, upsert: true }
  );
  const year = new Date().getFullYear();
  return `HS${year}${String(counter!.current_value).padStart(4, '0')}`;
};

const getNextInvoiceNumber = async (): Promise<string> => {
  const counter = await Counter.findOneAndUpdate(
    { counter_key: 'invoice_number' },
    { $inc: { current_value: 1 } },
    { new: true, upsert: true }
  );
  const year = new Date().getFullYear();
  return `INV${year}${String(counter!.current_value).padStart(5, '0')}`;
};

const keepProgressAtLeast = (enrollment: IEnrollmentForm, step: number) => {
  if (enrollment.current_step < step) {
    enrollment.current_step = step;
  }
  if (enrollment.status !== 'completed') {
    enrollment.status = `step_${enrollment.current_step}`;
  }
};

export class EnrollmentService {
  async getMyEnrollment(userId: string): Promise<IEnrollmentForm | null> {
    return EnrollmentForm.findOne({ user_id: userId, is_deleted: false });
  }

  async initEnrollment(userId: string): Promise<IEnrollmentForm> {
    let enrollment = await this.getMyEnrollment(userId);
    if (!enrollment) {
      const user = await User.findById(userId).select('preferred_language');
      enrollment = await EnrollmentForm.create({ user_id: userId, language: user?.preferred_language });
      await logAction(enrollment._id as mongoose.Types.ObjectId, new mongoose.Types.ObjectId(userId), 'INIT');
    }
    return enrollment;
  }

  async signPolicy(userId: string, signatureData: string, ip: string): Promise<void> {
    const enrollment = await this.getMyEnrollment(userId);
    if (!enrollment) throw new Error('Hồ sơ tuyển sinh không tồn tại');
    enrollment.signed_policy = true;
    enrollment.signature_data = signatureData;
    enrollment.signed_at = new Date();
    enrollment.signed_ip = ip;
    keepProgressAtLeast(enrollment, 2);
    await enrollment.save();

    await logAction(enrollment._id as mongoose.Types.ObjectId, new mongoose.Types.ObjectId(userId), 'SIGN_POLICY', 'signed_policy', 'false', 'true');
    await notificationService.create(userId, 'Da ky cam ket', 'Ban da hoan thanh buoc ky cam ket. Vui long tiep tuc thanh toan le phi ho so.', 'success', '/ho-so');
  }

  getPaymentUrl(_userId: string, enrollmentId: string): string {
    return `/api/payments/vnpay?enrollmentId=${enrollmentId}`;
  }

  async handlePaymentCallback(enrollmentId: string, success: boolean, paymentRef?: string): Promise<void> {
    if (!success) throw new Error('Thanh toán thất bại');
    const enrollment = await EnrollmentForm.findById(enrollmentId);
    if (!enrollment) throw new Error('Hồ sơ không tồn tại');

    if (enrollment.payment_status === 'success') return;
    const ref = paymentRef || `VNP${Date.now()}`;
    enrollment.payment_status = 'success';
    enrollment.payment_ref = ref;
    enrollment.paid_at = new Date();
    enrollment.current_step = 3;
    enrollment.status = 'step_3';
    await enrollment.save();

    const payment = await Payment.create({ user_id: enrollment.user_id, enrollment_id: enrollment._id, amount: 50000, status: 'success', vnpay_ref: ref });
    const existingInvoice = await Invoice.findOne({ enrollment_id: enrollment._id, status: 'paid', description: 'Lá»‡ phÃ­ há»“ sÆ¡ tuyá»ƒn sinh' });
    if (!existingInvoice) {
      await Invoice.create({
        user_id: enrollment.user_id,
        enrollment_id: enrollment._id,
        payment_id: payment._id,
        invoice_number: await getNextInvoiceNumber(),
        amount: 50000,
        status: 'paid',
        paid_at: new Date(),
        description: 'Lệ phí hồ sơ tuyển sinh',
      });
    }
    await logAction(enrollment._id as mongoose.Types.ObjectId, enrollment.user_id as mongoose.Types.ObjectId, 'PAYMENT_SUCCESS', 'payment_status', 'pending', 'success');
    await notificationService.create(enrollment.user_id.toString(), 'Thanh toán thành công', 'Lệ phí hồ sơ 50.000₫ đã được xác nhận. Vui lòng điền thông tin hồ sơ tuyển sinh.', 'success', '/ho-so');
    await notificationService.createForRoles(['admin', 'super_admin'], 'Hồ sơ đã thanh toán lệ phí', `${enrollment.document_number || 'Hồ sơ mới'} đã thanh toán lệ phí tuyển sinh.`, 'info', '/admin/enrollments');
  }

  async submitForm(userId: string, data: Record<string, unknown>): Promise<void> {
    const enrollment = await this.getMyEnrollment(userId);
    if (!enrollment) throw new Error('Hồ sơ không tồn tại');
    if (enrollment.payment_status !== 'success') throw new Error('Vui lòng thanh toán hồ sơ trước');

    const user = await User.findById(userId).select('preferred_language');
    const language = user?.preferred_language || data.language;
    const examRequired = !BEGINNER_LEVELS.includes(data.level as string);
    if (examRequired && !FIXED_EXAM_DATES.includes(String(data.preferred_exam_date || ''))) {
      throw new Error('Vui lòng chọn ngày kiểm tra trong danh sách cố định');
    }

    Object.assign(enrollment, {
      language,
      level: data.level,
      training_type: data.training_type,
      schedule: data.schedule,
      facility: data.facility,
      student_full_name: data.student_full_name,
      student_dob: data.student_dob,
      student_gender: data.student_gender,
      student_cccd: data.student_cccd,
      student_address: data.student_address,
      student_current_school: data.student_current_school,
      parent_full_name: data.parent_full_name,
      parent_phone: data.parent_phone,
      parent_email: data.parent_email,
      notes: data.notes,
      exam_required: examRequired,
      preferred_exam_date: examRequired ? data.preferred_exam_date : undefined,
    });
    keepProgressAtLeast(enrollment, 4);
    await enrollment.save();
    await logAction(enrollment._id as mongoose.Types.ObjectId, new mongoose.Types.ObjectId(userId), 'FORM_SUBMITTED', 'language', undefined, language as string);
    await notificationService.create(userId, 'Hồ sơ đã được nộp', 'Thông tin hồ sơ tuyển sinh của bạn đã được ghi nhận. Vui lòng tiếp tục các bước tiếp theo.', 'info', '/ho-so');
    await notificationService.createForRoles(['admin', 'super_admin'], 'Hồ sơ đã hoàn thành thông tin', `${enrollment.student_full_name || 'Học viên'} đã nộp thông tin hồ sơ tuyển sinh.`, 'info', '/admin/enrollments');
  }

  async getExamSchedules(language: string) {
    return FIXED_EXAM_DATES.map((date) => ({
      id: date,
      exam_date: date,
      language,
      title: `Ngày kiểm tra ${date.split('-').reverse().join('/')}`,
      location: 'Trung tâm sẽ thông báo sau khi công bố phòng thi',
      format: 'offline',
      max_slots: 0,
      registered_slots: 0,
      status: 'open',
    }));
  }

  async registerExam(userId: string, scheduleId: string): Promise<void> {
    const enrollment = await this.getMyEnrollment(userId);
    if (!enrollment) throw new Error('Hồ sơ không tồn tại');
    if (!enrollment.exam_required) throw new Error('Cấp độ này không yêu cầu kiểm tra đầu vào');

    const schedule = await ExamSchedule.findOne({ _id: scheduleId, status: 'open' });
    if (!schedule) throw new Error('Lịch thi không tồn tại hoặc đã đóng');
    if (schedule.registered_slots >= schedule.max_slots) throw new Error('Lịch thi này đã đầy');

    const existing = await ExamRegistration.findOne({ user_id: userId, enrollment_id: enrollment._id }).sort({ created_at: -1 });
    if (existing) {
      const existingScore = await ExamScore.findOne({ registration_id: existing._id });
      if (existingScore) throw new Error('Đã có kết quả thi, không thể đổi ca thi');

      if (existing.schedule_id.toString() !== scheduleId) {
        await ExamSchedule.updateOne({ _id: existing.schedule_id }, { $inc: { registered_slots: -1 } });
        await ExamSchedule.updateOne({ _id: scheduleId }, { $inc: { registered_slots: 1 } });
        existing.schedule_id = new mongoose.Types.ObjectId(scheduleId);
        existing.exam_code = `${(schedule.language || 'XX').toUpperCase().substring(0, 2)}${Date.now().toString().slice(-6)}`;
        await existing.save();
      }

      enrollment.exam_schedule_id = new mongoose.Types.ObjectId(scheduleId);
      enrollment.exam_confirmed = true;
      await enrollment.save();
      await logAction(enrollment._id as mongoose.Types.ObjectId, new mongoose.Types.ObjectId(userId), 'EXAM_UPDATED', 'exam_schedule_id', undefined, scheduleId);
      return;
    }

    const lang = (schedule.language || 'XX').toUpperCase().substring(0, 2);
    const examCode = `${lang}${Date.now().toString().slice(-6)}`;

    await ExamSchedule.updateOne({ _id: scheduleId }, { $inc: { registered_slots: 1 } });
    await ExamRegistration.create({ user_id: userId, enrollment_id: enrollment._id, schedule_id: scheduleId, exam_code: examCode });

    enrollment.exam_schedule_id = new mongoose.Types.ObjectId(scheduleId);
    enrollment.exam_confirmed = true;
    await enrollment.save();

    await logAction(enrollment._id as mongoose.Types.ObjectId, new mongoose.Types.ObjectId(userId), 'EXAM_REGISTERED', 'exam_schedule_id', undefined, scheduleId);
    await notificationService.create(userId, 'Đăng ký thi thành công', `Bạn đã đăng ký kỳ thi với mã số ${examCode}. Vui lòng có mặt đúng giờ.`, 'success', '/ho-so');
    await notificationService.createForRoles(['admin', 'super_admin'], 'Học viên đã đăng ký lịch thi', `${enrollment.student_full_name || 'Học viên'} đã đăng ký lịch thi ${schedule.exam_date.toLocaleDateString('vi-VN')}.`, 'info', '/admin/exam-schedules');
  }

  async skipExam(userId: string): Promise<void> {
    const enrollment = await this.getMyEnrollment(userId);
    if (!enrollment) throw new Error('Hồ sơ không tồn tại');
    if (enrollment.exam_required) throw new Error('Cấp độ này yêu cầu kiểm tra đầu vào');

    keepProgressAtLeast(enrollment, 5);
    await enrollment.save();
    await logAction(enrollment._id as mongoose.Types.ObjectId, new mongoose.Types.ObjectId(userId), 'EXAM_SKIPPED');
    await notificationService.create(userId, 'Da bo qua buoc kiem tra', 'Cap do ban chon khong yeu cau kiem tra dau vao. Vui long tiep tuc chon chuong trinh hoc.', 'success', '/ho-so');
  }

  async getExamResult(userId: string) {
    const reg = await ExamRegistration.findOne({ user_id: userId }).sort({ created_at: -1 }).populate('schedule_id').populate('room_id');
    if (!reg) return null;
    const score = await ExamScore.findOne({ registration_id: reg._id });
    const schedule = reg.schedule_id as unknown as { title?: string; language?: string; exam_date?: Date; location?: string; room?: string; format?: string; rooms_published?: boolean };
    const room = reg.room_id as unknown as { name?: string; location?: string } | undefined;
    const roomsPublished = Boolean(schedule?.rooms_published);
    return {
      ...reg.toObject(),
      score: score?.score,
      level_passed: score?.level_passed,
      pass_status: score?.pass_status,
      pass_threshold: score?.pass_threshold,
      score_status: score?.status,
      title: schedule?.title,
      language: schedule?.language,
      exam_date: schedule?.exam_date,
      location: roomsPublished ? (room?.location || schedule?.location) : undefined,
      room: roomsPublished ? (room?.name || schedule?.room) : undefined,
      exam_code: roomsPublished ? reg.exam_code : undefined,
      room_published: roomsPublished,
      format: schedule?.format,
    };
  }

  async advanceToStep5(userId: string): Promise<void> {
    const enrollment = await this.getMyEnrollment(userId);
    if (!enrollment) throw new Error('Hồ sơ không tồn tại');
    if (enrollment.exam_required) {
      if (enrollment.exam_score === undefined || !enrollment.exam_pass_status) {
        throw new Error('Vui lòng chờ kết quả thi trước khi chọn chương trình');
      }
      if (enrollment.exam_pass_status !== 'passed') {
        throw new Error('Kết quả thi chưa đạt ngưỡng để chọn chương trình đào tạo');
      }
    }
    keepProgressAtLeast(enrollment, 5);
    await enrollment.save();
    await notificationService.create(userId, 'Du dieu kien chon chuong trinh', 'Ban da hoan thanh buoc kiem tra dau vao. Vui long chon chuong trinh nhap hoc phu hop.', 'success', '/ho-so');
  }

  async getAvailablePrograms(userId: string) {
    const enrollment = await this.getMyEnrollment(userId);
    if (!enrollment) throw new Error('Hồ sơ không tồn tại');

    if (!enrollment.exam_required) {
      return TrainingProgram.find({ language: enrollment.language, level_code: { $in: BEGINNER_LEVELS }, is_active: true });
    }

    const reg = await ExamRegistration.findOne({ user_id: userId }).sort({ created_at: -1 });
    if (reg) {
      const score = await ExamScore.findOne({ registration_id: reg._id, status: 'scored' });
      if (score) {
        if (score.pass_status !== 'passed') return [];
        return TrainingProgram.find({
          language: enrollment.language,
          is_active: true,
          min_score: { $lte: score.score },
        }).sort({ min_score: -1, level_code: 1 });
      }
    }
    return [];
  }

  async selectProgram(userId: string, programId: string): Promise<void> {
    const enrollment = await this.getMyEnrollment(userId);
    if (!enrollment) throw new Error('Hồ sơ không tồn tại');
    if (enrollment.exam_required && enrollment.exam_pass_status !== 'passed') {
      throw new Error('Bạn chưa đủ điều kiện chọn chương trình đào tạo');
    }

    const program = await TrainingProgram.findById(programId);
    if (!program) throw new Error('Hệ đào tạo không tồn tại');
    if (program.language !== enrollment.language) {
      throw new Error('Chương trình không khớp ngôn ngữ đã đăng ký');
    }
    if (!enrollment.exam_required && !BEGINNER_LEVELS.includes(program.level_code)) {
      throw new Error('Chương trình này yêu cầu kiểm tra năng lực đầu vào');
    }
    if (enrollment.exam_required && (enrollment.exam_score ?? -1) < program.min_score) {
      throw new Error('Điểm thi chưa đủ điều kiện chọn chương trình này');
    }

    enrollment.program_id = new mongoose.Types.ObjectId(programId);
    enrollment.program_name = program.name;
    enrollment.tuition_fee = program.tuition_fee;
    keepProgressAtLeast(enrollment, 6);
    await enrollment.save();

    await logAction(enrollment._id as mongoose.Types.ObjectId, new mongoose.Types.ObjectId(userId), 'PROGRAM_SELECTED', 'program_id', undefined, programId);
    await notificationService.create(userId, 'Chương trình đã được chọn', `Bạn đã chọn chương trình "${program.name}". Vui lòng tiếp tục nộp hồ sơ gốc.`, 'success', '/ho-so');
    await notificationService.createForRoles(['admin', 'super_admin'], 'Học viên đã chọn chương trình', `${enrollment.student_full_name || 'Học viên'} đã chọn "${program.name}".`, 'info', '/admin/enrollments');
  }

  async submitOriginalDocs(userId: string, data: { appointment_date: string; buy_books: boolean; notes?: string }): Promise<{ documentNumber: string }> {
    const enrollment = await this.getMyEnrollment(userId);
    if (!enrollment) throw new Error('Hồ sơ không tồn tại');

    const docNumber = enrollment.document_number || await getNextDocNumber();
    enrollment.appointment_date = data.appointment_date;
    enrollment.buy_books = data.buy_books;
    enrollment.notes = data.notes;
    enrollment.document_number = docNumber;
    enrollment.documents_submitted = true;
    enrollment.status = 'completed';
    await enrollment.save();

    await logAction(enrollment._id as mongoose.Types.ObjectId, new mongoose.Types.ObjectId(userId), 'DOCS_SUBMITTED', 'document_number', undefined, docNumber);
    await notificationService.create(userId, 'Hồ sơ hoàn tất', `Chúc mừng! Mã hồ sơ của bạn là ${docNumber}. Vui lòng mang hồ sơ gốc theo lịch hẹn.`, 'success', '/ho-so');
    await notificationService.createForRoles(['admin', 'super_admin'], 'Hồ sơ tuyển sinh hoàn tất', `${enrollment.student_full_name || docNumber} đã hoàn tất hồ sơ.`, 'success', '/admin/enrollments');
    return { documentNumber: docNumber };
  }
}

export const enrollmentService = new EnrollmentService();
