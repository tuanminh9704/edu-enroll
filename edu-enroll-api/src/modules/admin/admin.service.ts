import { User } from '../../models/User';
import { EnrollmentForm } from '../../models/EnrollmentForm';
import { ExamSchedule } from '../../models/ExamSchedule';
import { ExamRoom } from '../../models/ExamRoom';
import { ExamScore } from '../../models/ExamScore';
import { ExamRegistration } from '../../models/ExamRegistration';
import { TrainingProgram } from '../../models/TrainingProgram';
import { Payment } from '../../models/Payment';
import { EnrollmentLog } from '../../models/EnrollmentLog';
import { Interview } from '../../models/Interview';
import { Invoice } from '../../models/Invoice';
import { Banner } from '../../models/Banner';
import { News } from '../../models/News';
import { SystemConfig } from '../../models/SystemConfig';
import { notificationService } from '../notifications/notification.service';
import mongoose from 'mongoose';
import { calculateExamResult } from '../../utils/examResult';
import { hashPassword } from '../../utils/hash';
import { parseBoolean, parseCsv, parseNumber, toCsv } from '../../utils/csv';
import { FIXED_EXAM_DATES, isFixedExamDate, toExamDateKey } from '../../constants/exam';

const EXAM_DATE_TIME_ZONE = 'Asia/Ho_Chi_Minh';

const formatDateKey = (date: Date, timeZone = EXAM_DATE_TIME_ZONE): string => {
  try {
    const parts = new Intl.DateTimeFormat('en-CA', {
      timeZone,
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    }).formatToParts(date);
    const value = (type: string) => parts.find((part) => part.type === type)?.value;
    const year = value('year');
    const month = value('month');
    const day = value('day');
    if (year && month && day) return `${year}-${month}-${day}`;
  } catch {
    // Fall through to the local-date formatter below.
  }

  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

const formatUtcDateKey = (date: Date): string => {
  const year = date.getUTCFullYear();
  const month = String(date.getUTCMonth() + 1).padStart(2, '0');
  const day = String(date.getUTCDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

const getExamDateKeys = (date: Date): string[] => Array.from(new Set([
  formatDateKey(date),
  formatUtcDateKey(date),
]));

const createExamCode = (language: string, index = 0): string => {
  const prefix = (language || 'XX').toUpperCase().substring(0, 2);
  const suffix = `${Date.now().toString().slice(-6)}${String(index).padStart(2, '0')}`;
  return `${prefix}${suffix}`;
};

const createSeatNumber = (language: string, examDate: Date, index: number): string => {
  const prefix = (language || 'XX').toUpperCase().substring(0, 2);
  const dateKey = toExamDateKey(examDate).replace(/-/g, '');
  return `${prefix}${dateKey}${String(index).padStart(3, '0')}`;
};

const createTemporaryExamCode = (language: string, index = 0): string => {
  const prefix = (language || 'XX').toUpperCase().substring(0, 2);
  return `TMP${prefix}${Date.now().toString().slice(-6)}${String(index).padStart(2, '0')}`;
};

const getImportRows = (file?: Express.Multer.File): Record<string, string>[] => {
  if (!file) throw new Error('Vui lòng chọn file CSV');
  return parseCsv(file.buffer.toString('utf8'));
};

const getStringValue = (value: unknown): string | undefined => {
  const text = String(value ?? '').trim();
  return text || undefined;
};

export class AdminService {
  private async releaseRoom(roomId?: mongoose.Types.ObjectId | string) {
    if (!roomId) return;
    await ExamRoom.updateOne({ _id: roomId, assigned_count: { $gt: 0 } }, { $inc: { assigned_count: -1 } });
  }

  private async assignRoomToRegistration(registration: any, scheduleId: string) {
    if (registration.room_id) {
      return ExamRoom.findById(registration.room_id);
    }

    const room = await ExamRoom.findOneAndUpdate(
      {
        schedule_id: new mongoose.Types.ObjectId(scheduleId),
        $expr: { $lt: ['$assigned_count', '$capacity'] },
      },
      { $inc: { assigned_count: 1 } },
      { sort: { created_at: 1 }, new: true }
    );

    if (!room) return null;
    registration.room_id = room._id;
    await registration.save();
    return room;
  }

  private describeRoom(room: { name?: string; location?: string } | null) {
    if (!room) return '';
    return ` tai phong ${room.name}${room.location ? ` (${room.location})` : ''}`;
  }

  async getStats() {
    const [totalUsers, totalEnrollments, completedEnrollments, pendingEnrollments, revenue] = await Promise.all([
      User.countDocuments({ role: 'student' }),
      EnrollmentForm.countDocuments({ is_deleted: false }),
      EnrollmentForm.countDocuments({ status: 'completed', is_deleted: false }),
      EnrollmentForm.countDocuments({ status: { $nin: ['completed', 'cancelled'] }, is_deleted: false }),
      Payment.aggregate([{ $match: { status: 'success' } }, { $group: { _id: null, total: { $sum: '$amount' } } }]),
    ]);
    return {
      totalUsers,
      totalEnrollments,
      completedEnrollments,
      pendingEnrollments,
      totalRevenue: revenue[0]?.total ?? 0,
    };
  }

  async getUsers({ page = 1, limit = 10, search = '' } = {}) {
    const filter = search
      ? { $or: [{ email: { $regex: search, $options: 'i' } }, { full_name: { $regex: search, $options: 'i' } }, { phone: { $regex: search, $options: 'i' } }] }
      : {};
    const [data, total] = await Promise.all([
      User.find(filter).select('-password_hash').skip((page - 1) * limit).limit(limit).sort({ created_at: -1 }),
      User.countDocuments(filter),
    ]);
    return { data, total, page, limit };
  }

  async getEnrollments({ page = 1, limit = 10, search = '', status = '' } = {}) {
    const filter: Record<string, unknown> = { is_deleted: false };
    if (status) filter.status = status;
    if (search) {
      filter.$or = [
        { student_full_name: { $regex: search, $options: 'i' } },
        { document_number: { $regex: search, $options: 'i' } },
      ];
    }
    const [data, total] = await Promise.all([
      EnrollmentForm.find(filter).skip((page - 1) * limit).limit(limit).sort({ created_at: -1 }),
      EnrollmentForm.countDocuments(filter),
    ]);
    return { data, total, page, limit };
  }

  async updateEnrollmentStatus(id: string, status: string, staffNotes?: string, adminId?: string) {
    const enrollment = await EnrollmentForm.findById(id);
    if (!enrollment) throw new Error('Hồ sơ không tồn tại');

    const oldStatus = enrollment.status;
    enrollment.status = status;
    if (staffNotes !== undefined) enrollment.staff_notes = staffNotes;
    await enrollment.save();

    if (adminId) {
      await EnrollmentLog.create({
        enrollment_id: enrollment._id,
        changed_by: new mongoose.Types.ObjectId(adminId),
        action: 'STATUS_CHANGED',
        field_name: 'status',
        old_value: oldStatus,
        new_value: status,
      });
    }

    const STATUS_MSG: Record<string, string> = {
      cancelled: 'Hồ sơ của bạn đã bị hủy.',
      rejected: 'Hồ sơ của bạn đã bị từ chối.',
      completed: 'Chúc mừng! Hồ sơ tuyển sinh của bạn đã hoàn tất.',
    };
    const msgText = STATUS_MSG[status];
    if (msgText) {
      await notificationService.create(
        enrollment.user_id.toString(), 'Cập nhật trạng thái hồ sơ', msgText,
        status === 'completed' ? 'success' : 'warning', '/ho-so'
      );
    }
  }

  async getEnrollmentLogs(enrollmentId: string) {
    return EnrollmentLog.find({ enrollment_id: new mongoose.Types.ObjectId(enrollmentId) })
      .populate('changed_by', 'email full_name role')
      .sort({ created_at: -1 })
      .lean();
  }

  async broadcastNotification(title: string, messageText: string, type: 'info' | 'success' | 'warning' | 'error', link?: string, role?: string) {
    const filter: Record<string, unknown> = { is_active: true };
    if (role) filter.role = role;
    const users = await User.find(filter).select('_id').lean();
    await Promise.all(users.map((u) => notificationService.create(u._id.toString(), title, messageText, type, link)));
    return { sent: users.length };
  }

  async getRechecks({ page = 1, limit = 20, status = '' } = {}) {
    const { RecheckRequest } = await import('../../models/RecheckRequest');
    const filter: Record<string, unknown> = {};
    if (status) filter.status = status;
    const [data, total] = await Promise.all([
      RecheckRequest.find(filter)
        .populate('user_id', 'email full_name')
        .sort({ created_at: -1 })
        .skip((page - 1) * limit)
        .limit(limit)
        .lean(),
      RecheckRequest.countDocuments(filter),
    ]);
    return { data, total, page, limit };
  }

  async resolveRecheck(id: string, status: 'reviewing' | 'resolved' | 'rejected', adminNote: string, adminId: string) {
    const { RecheckRequest } = await import('../../models/RecheckRequest');
    const recheck = await RecheckRequest.findById(id);
    if (!recheck) throw new Error('Yêu cầu phúc khảo không tồn tại');
    recheck.status = status;
    recheck.admin_note = adminNote;
    if (status === 'resolved' || status === 'rejected') {
      recheck.resolved_by = new mongoose.Types.ObjectId(adminId);
      recheck.resolved_at = new Date();
    }
    await recheck.save();
    const msg = status === 'resolved'
      ? 'Yêu cầu phúc khảo của bạn đã được xử lý. Vui lòng kiểm tra kết quả.'
      : status === 'rejected'
        ? 'Yêu cầu phúc khảo của bạn đã bị từ chối.'
        : 'Yêu cầu phúc khảo của bạn đang được xem xét.';
    await notificationService.create(recheck.user_id.toString(), 'Cập nhật phúc khảo', msg,
      status === 'resolved' ? 'success' : status === 'rejected' ? 'error' : 'info', '/ho-so');
    return recheck;
  }

  async getExamSchedules() {
    return ExamSchedule.find().sort({ exam_date: -1 });
  }

  async createExamSchedule(data: Record<string, unknown>) {
    const examDateKey = String(data.exam_date || '').slice(0, 10);
    if (!isFixedExamDate(examDateKey)) {
      throw new Error(`Ngay thi phai nam trong danh sach co dinh: ${FIXED_EXAM_DATES.join(', ')}`);
    }
    const examDate = new Date(`${examDateKey}T00:00:00.000`);
    return ExamSchedule.create({
      ...data,
      exam_date: examDate,
      rooms_published: false,
    });
  }

  async getExamRooms(scheduleId: string) {
    return ExamRoom.find({ schedule_id: new mongoose.Types.ObjectId(scheduleId) }).sort({ created_at: 1 });
  }

  async createExamRoom(scheduleId: string, data: Record<string, unknown>) {
    const schedule = await ExamSchedule.findById(scheduleId);
    if (!schedule) throw new Error('Lich thi khong ton tai');

    const name = String(data.name || '').trim();
    const capacity = Number(data.capacity);
    if (!name) throw new Error('Ten phong thi la bat buoc');
    if (!Number.isFinite(capacity) || capacity < 1) throw new Error('Suc chua phong thi khong hop le');

    return ExamRoom.create({
      schedule_id: schedule._id,
      name,
      capacity,
      location: String(data.location || schedule.location || '').trim() || undefined,
    });
  }

  async autoAssignExamRooms(scheduleId: string) {
    const schedule = await ExamSchedule.findById(scheduleId);
    if (!schedule) throw new Error('Lich thi khong ton tai');

    const rooms = await ExamRoom.find({ schedule_id: new mongoose.Types.ObjectId(scheduleId) }).sort({ created_at: 1 });
    if (rooms.length === 0) throw new Error('Can tao phong thi truoc khi xep phong tu dong');

    await ExamRoom.updateMany({ schedule_id: new mongoose.Types.ObjectId(scheduleId) }, { assigned_count: 0 });

    const registrations = await ExamRegistration.find({
      schedule_id: new mongoose.Types.ObjectId(scheduleId),
      status: 'confirmed',
    }).sort({ created_at: 1 });

    let assigned = 0;
    let skipped = 0;
    let roomIndex = 0;
    for (const [index, registration] of registrations.entries()) {
      while (roomIndex < rooms.length && rooms[roomIndex].assigned_count >= rooms[roomIndex].capacity) {
        roomIndex += 1;
      }
      const room = rooms[roomIndex];
      if (!room) {
        registration.room_id = undefined;
        await registration.save();
        skipped += 1;
        continue;
      }

      room.assigned_count += 1;
      await room.save();
      registration.room_id = room._id as mongoose.Types.ObjectId;
      registration.exam_code = createSeatNumber(schedule.language, schedule.exam_date, index + 1);
      await registration.save();
      assigned += 1;
    }

    return { schedule_id: scheduleId, matched: registrations.length, assigned, skipped, full: skipped > 0 };
  }

  async publishExamRooms(scheduleId?: string) {
    const filter = scheduleId ? { _id: new mongoose.Types.ObjectId(scheduleId) } : {};
    const result = await ExamSchedule.updateMany(filter, { rooms_published: true });
    await SystemConfig.findOneAndUpdate(
      { key: 'exam_rooms_published' },
      {
        value: 'true',
        group: 'exam',
        description: 'Cho phép học sinh tra cứu phòng thi và số báo danh',
      },
      { upsert: true, new: true }
    );
    return { published: result.modifiedCount ?? 0 };
  }

  async generateExamBagsAndAnonymousCodes(scheduleId: string) {
    const schedule = await ExamSchedule.findById(scheduleId);
    if (!schedule) throw new Error('Lich thi khong ton tai');

    const registrations = await ExamRegistration.find({
      schedule_id: new mongoose.Types.ObjectId(scheduleId),
      status: 'confirmed',
      room_id: { $exists: true, $ne: null },
    })
      .populate('room_id', 'name')
      .sort({ room_id: 1, exam_code: 1, created_at: 1 });

    if (registrations.length === 0) throw new Error('Can xep phong truoc khi danh so tui va ma phach');

    const prefix = (schedule.language || 'XX').toUpperCase().substring(0, 2);
    const dateKey = toExamDateKey(schedule.exam_date).replace(/-/g, '');
    let generated = 0;
    const roomCounters = new Map<string, number>();

    for (const registration of registrations) {
      const roomId = registration.room_id?.toString() || 'NO_ROOM';
      const next = (roomCounters.get(roomId) || 0) + 1;
      roomCounters.set(roomId, next);
      const roomIndex = Array.from(roomCounters.keys()).indexOf(roomId) + 1;
      registration.bag_number = `${prefix}-${dateKey}-P${String(roomIndex).padStart(2, '0')}`;
      registration.anonymous_code = `${prefix}${dateKey}${String(roomIndex).padStart(2, '0')}${String(next).padStart(3, '0')}`;
      await registration.save();
      generated += 1;
    }

    return { matched: registrations.length, generated };
  }

  async enterExamScore(registrationId: string, score: number, levelPassed?: string, adminId?: string, passThreshold = 50) {
    const numericScore = Number(score);
    if (!Number.isFinite(numericScore) || numericScore < 0 || numericScore > 100) {
      throw new Error('Điểm thi phải nằm trong khoảng 0 - 100');
    }

    const reg = await ExamRegistration.findById(registrationId).populate('schedule_id', 'language');
    if (!reg) throw new Error('Đăng ký thi không tồn tại');
    if (reg.status !== 'confirmed') throw new Error('Chỉ có thể nhập điểm cho thí sinh đã xác nhận thi');

    const enrollment = await EnrollmentForm.findById(reg.enrollment_id);
    if (!enrollment) throw new Error('Hồ sơ không tồn tại');
    const existingScore = await ExamScore.findOne({ registration_id: reg._id });
    const scheduleLanguage = typeof reg.schedule_id === 'object' && 'language' in reg.schedule_id
      ? String((reg.schedule_id as unknown as { language?: string }).language || '')
      : '';
    const result = calculateExamResult(numericScore, enrollment.language || scheduleLanguage, levelPassed, Number(passThreshold));

    await ExamScore.findOneAndUpdate(
      { registration_id: reg._id },
      {
        score: numericScore,
        level_passed: result.level_passed,
        pass_status: result.pass_status,
        pass_threshold: result.pass_threshold,
        status: 'scored',
      },
      { upsert: true, new: true }
    );

    const enrollmentUpdate: Record<string, unknown> = {
      exam_score: numericScore,
      exam_level_passed: result.level_passed,
      exam_pass_status: result.pass_status,
      exam_pass_threshold: result.pass_threshold,
      exam_scored_at: new Date(),
    };

    if (result.pass_status === 'passed' && enrollment.current_step < 5) {
      enrollmentUpdate.current_step = 5;
      enrollmentUpdate.status = 'step_5';
    }

    await EnrollmentForm.findByIdAndUpdate(reg.enrollment_id, enrollmentUpdate);

    if (adminId) {
      await EnrollmentLog.create({
        enrollment_id: reg.enrollment_id,
        changed_by: new mongoose.Types.ObjectId(adminId),
        action: existingScore ? 'EXAM_SCORE_UPDATED' : 'EXAM_SCORE_ENTERED',
        field_name: 'exam_score',
        old_value: existingScore ? `${existingScore.score}/${existingScore.level_passed}/${existingScore.pass_status || 'passed'}` : undefined,
        new_value: `${numericScore}/${result.level_passed}/${result.pass_status}`,
      });
    }

    const passedText = result.pass_status === 'passed' ? 'Đỗ' : 'Trượt';
    await notificationService.create(
      reg.user_id.toString(), 'Kết quả khảo sát năng lực',
      `Điểm của bạn: ${numericScore}/100 — ${passedText} (ngưỡng ${result.pass_threshold}) — Level: ${result.level_passed}.`,
      result.pass_status === 'passed' ? 'success' : 'warning', '/ho-so'
    );
  }

  async saveExamScoreDraft(registrationId: string, data: Record<string, unknown>, adminId?: string) {
    const numericScore = Number(data.score);
    if (!Number.isFinite(numericScore) || numericScore < 0 || numericScore > 100) {
      throw new Error('Điểm thi phải nằm trong khoảng 0 - 100');
    }

    const reg = await ExamRegistration.findById(registrationId).populate('schedule_id', 'language');
    if (!reg) throw new Error('Đăng ký thi không tồn tại');
    if (reg.status !== 'confirmed') throw new Error('Chỉ có thể nhập điểm cho thí sinh đã xác nhận thi');

    const enrollment = await EnrollmentForm.findById(reg.enrollment_id);
    if (!enrollment) throw new Error('Hồ sơ không tồn tại');
    const scheduleLanguage = typeof reg.schedule_id === 'object' && 'language' in reg.schedule_id
      ? String((reg.schedule_id as unknown as { language?: string }).language || '')
      : '';
    const result = calculateExamResult(numericScore, enrollment.language || scheduleLanguage, getStringValue(data.level_passed), Number(data.pass_threshold || 50));

    reg.bag_number = getStringValue(data.bag_number);
    reg.anonymous_code = getStringValue(data.anonymous_code);
    await reg.save();

    const existingScore = await ExamScore.findOne({ registration_id: reg._id });
    await ExamScore.findOneAndUpdate(
      { registration_id: reg._id },
      {
        score: numericScore,
        level_passed: result.level_passed,
        pass_status: result.pass_status,
        pass_threshold: result.pass_threshold,
        status: 'pending',
      },
      { upsert: true, new: true }
    );

    if (adminId) {
      await EnrollmentLog.create({
        enrollment_id: reg.enrollment_id,
        changed_by: new mongoose.Types.ObjectId(adminId),
        action: existingScore ? 'EXAM_SCORE_DRAFT_UPDATED' : 'EXAM_SCORE_DRAFT_ENTERED',
        field_name: 'exam_score',
        old_value: existingScore ? `${existingScore.score}/${existingScore.level_passed}/${existingScore.status}` : undefined,
        new_value: `${numericScore}/${result.level_passed}/pending`,
      });
    }
  }

  async syncExamScore(registrationId: string, adminId?: string) {
    const reg = await ExamRegistration.findById(registrationId);
    if (!reg) throw new Error('Đăng ký thi không tồn tại');
    const score = await ExamScore.findOne({ registration_id: reg._id });
    if (!score) throw new Error('Chưa có điểm để đồng bộ');
    const enrollment = await EnrollmentForm.findById(reg.enrollment_id);
    if (!enrollment) throw new Error('Hồ sơ không tồn tại');

    const enrollmentUpdate: Record<string, unknown> = {
      exam_score: score.score,
      exam_level_passed: score.level_passed,
      exam_pass_status: score.pass_status,
      exam_pass_threshold: score.pass_threshold,
      exam_scored_at: new Date(),
    };

    if (score.pass_status === 'passed' && enrollment.current_step < 5) {
      enrollmentUpdate.current_step = 5;
      enrollmentUpdate.status = 'step_5';
    }

    await EnrollmentForm.findByIdAndUpdate(reg.enrollment_id, enrollmentUpdate);
    score.status = 'scored';
    await score.save();

    if (adminId) {
      await EnrollmentLog.create({
        enrollment_id: reg.enrollment_id,
        changed_by: new mongoose.Types.ObjectId(adminId),
        action: 'EXAM_SCORE_SYNCED',
        field_name: 'exam_score',
        new_value: `${score.score}/${score.level_passed}/${score.pass_status}`,
      });
    }

    const passedText = score.pass_status === 'passed' ? 'Đỗ' : 'Trượt';
    await notificationService.create(
      reg.user_id.toString(), 'Kết quả khảo sát năng lực',
      `Điểm của bạn: ${score.score}/100 — ${passedText} (ngưỡng ${score.pass_threshold}) — Level: ${score.level_passed}.`,
      score.pass_status === 'passed' ? 'success' : 'warning', '/ho-so'
    );
  }

  async syncExamScoresBySchedule(scheduleId: string, adminId?: string, passThreshold?: number) {
    const schedule = await ExamSchedule.findById(scheduleId);
    if (!schedule) throw new Error('Lich thi khong ton tai');
    const threshold = Number(passThreshold);
    const shouldApplyThreshold = Number.isFinite(threshold) && threshold >= 0 && threshold <= 100;
    const registrations = await ExamRegistration.find({ schedule_id: new mongoose.Types.ObjectId(scheduleId) }).select('_id enrollment_id').lean();
    let synced = 0;
    let skipped = 0;

    for (const registration of registrations) {
      const score = await ExamScore.findOne({ registration_id: registration._id });
      if (!score || score.status === 'scored') {
        skipped += 1;
        continue;
      }
      if (shouldApplyThreshold) {
        const enrollment = await EnrollmentForm.findById(registration.enrollment_id).select('language').lean();
        const result = calculateExamResult(score.score, enrollment?.language || schedule.language, score.level_passed, threshold);
        score.level_passed = result.level_passed;
        score.pass_status = result.pass_status;
        score.pass_threshold = result.pass_threshold;
        await score.save();
      }
      await this.syncExamScore(registration._id.toString(), adminId);
      synced += 1;
    }

    return { matched: registrations.length, synced, skipped };
  }

  async getPrograms() {
    return TrainingProgram.find({ is_active: true }).sort({ language: 1, level_code: 1 });
  }

  async createProgram(data: Record<string, unknown>) {
    return TrainingProgram.create(data);
  }

  async updateProgram(id: string, data: Record<string, unknown>) {
    const program = await TrainingProgram.findByIdAndUpdate(id, data, { new: true });
    if (!program) throw new Error('Hệ đào tạo không tồn tại');
    return program;
  }

  async deleteProgram(id: string) {
    await TrainingProgram.findByIdAndUpdate(id, { is_active: false });
  }

  async toggleUserActive(id: string) {
    const user = await User.findById(id);
    if (!user) throw new Error('Người dùng không tồn tại');
    user.is_active = !user.is_active;
    await user.save();
    return { is_active: user.is_active };
  }

  async changeUserRole(id: string, role: string) {
    const allowed = ['student', 'staff', 'admin'];
    if (!allowed.includes(role)) throw new Error('Vai trò không hợp lệ');
    const user = await User.findByIdAndUpdate(id, { role }, { new: true });
    if (!user) throw new Error('Người dùng không tồn tại');
    return user;
  }

  async exportEnrollments() {
    const enrollments = await EnrollmentForm.find({ is_deleted: false }).lean();
    const headers = ['document_number', 'student_full_name', 'student_dob', 'student_gender', 'student_cccd',
      'student_address', 'language', 'level', 'training_type', 'schedule', 'facility', 'payment_status',
      'status', 'program_name', 'tuition_fee', 'exam_required', 'appointment_date', 'created_at'];
    const rows = [headers.join(',')];
    for (const e of enrollments) {
      const row = headers.map((h) => {
        const v = (e as unknown as Record<string, unknown>)[h];
        if (v instanceof Date) return v.toLocaleDateString('vi-VN');
        if (typeof v === 'boolean') return v ? '1' : '0';
        return `"${String(v ?? '').replace(/"/g, '""')}"`;
      });
      rows.push(row.join(','));
    }
    return rows.join('\n');
  }

  async exportUsers() {
    const users = await User.find().select('-password_hash').lean();
    const headers = ['email', 'full_name', 'phone', 'role', 'is_active', 'created_at'];
    const rows = [headers.join(',')];
    for (const u of users) {
      const row = headers.map((h) => {
        const v = (u as unknown as Record<string, unknown>)[h];
        if (v instanceof Date) return v.toLocaleDateString('vi-VN');
        if (typeof v === 'boolean') return v ? '1' : '0';
        return `"${String(v ?? '').replace(/"/g, '""')}"`;
      });
      rows.push(row.join(','));
    }
    return rows.join('\n');
  }

  async exportPrograms() {
    const programs = await TrainingProgram.find().sort({ language: 1, level_code: 1 }).lean();
    const headers = ['name', 'language', 'level_code', 'duration_months', 'sessions_per_week', 'session_hours', 'tuition_fee', 'min_score', 'description', 'is_active'];
    return toCsv(headers, programs as unknown as Record<string, unknown>[]);
  }

  async exportExamSchedules() {
    const schedules = await ExamSchedule.find().sort({ exam_date: 1 }).lean();
    const headers = ['title', 'language', 'exam_date', 'location', 'room', 'format', 'max_slots', 'registered_slots', 'status'];
    return toCsv(headers, schedules as unknown as Record<string, unknown>[]);
  }

  async exportExamScores(scheduleId = '') {
    const filter = scheduleId ? { schedule_id: new mongoose.Types.ObjectId(scheduleId) } : {};
    const registrations = await ExamRegistration.find(filter)
      .populate('user_id', 'email full_name')
      .populate('room_id', 'name location')
      .sort({ created_at: 1 })
      .lean();
    const rows = await Promise.all(registrations.map(async (registration) => {
      const score = await ExamScore.findOne({ registration_id: registration._id }).lean();
      const user = registration.user_id as unknown as { email?: string; full_name?: string };
      const room = registration.room_id as unknown as { name?: string; location?: string } | undefined;
      return {
        registration_id: registration._id.toString(),
        exam_code: registration.exam_code,
        student_name: user?.full_name,
        email: user?.email,
        room: room?.name,
        bag_number: registration.bag_number,
        anonymous_code: registration.anonymous_code,
        score: score?.score,
        level_passed: score?.level_passed,
        pass_threshold: score?.pass_threshold,
        score_status: score?.status,
      };
    }));
    const headers = ['registration_id', 'exam_code', 'student_name', 'email', 'room', 'bag_number', 'anonymous_code', 'score', 'level_passed', 'pass_threshold', 'score_status'];
    return toCsv(headers, rows);
  }

  async importUsers(file?: Express.Multer.File) {
    const rows = getImportRows(file);
    const result = { created: 0, updated: 0, skipped: 0, errors: [] as string[] };
    const allowedRoles = ['student', 'staff', 'admin'];
    const allowedLanguages = ['english', 'japanese', 'korean', 'chinese', 'french'];

    for (const [index, row] of rows.entries()) {
      const line = index + 2;
      const email = String(row.email || '').trim().toLowerCase();
      if (!email) {
        result.skipped += 1;
        result.errors.push(`Dong ${line}: email la bat buoc`);
        continue;
      }

      const role = allowedRoles.includes(row.role) ? row.role : 'student';
      const preferredLanguage = allowedLanguages.includes(row.preferred_language) ? row.preferred_language : undefined;
      const update: Record<string, unknown> = {
        full_name: row.full_name || undefined,
        phone: row.phone || undefined,
        role,
        is_active: parseBoolean(row.is_active, true),
        preferred_language: preferredLanguage,
      };

      const existing = await User.findOne({ email });
      if (existing) {
        if (existing.role === 'super_admin') {
          result.skipped += 1;
          result.errors.push(`Dong ${line}: khong cap nhat super_admin`);
          continue;
        }
        if (row.password) update.password_hash = await hashPassword(row.password);
        await User.updateOne({ _id: existing._id }, update);
        result.updated += 1;
      } else {
        await User.create({
          email,
          ...update,
          password_hash: await hashPassword(row.password || 'Password@123'),
        });
        result.created += 1;
      }
    }

    return result;
  }

  async importPrograms(file?: Express.Multer.File) {
    const rows = getImportRows(file);
    const result = { created: 0, updated: 0, skipped: 0, errors: [] as string[] };

    for (const [index, row] of rows.entries()) {
      const line = index + 2;
      const name = String(row.name || '').trim();
      const language = String(row.language || '').trim();
      const levelCode = String(row.level_code || '').trim();
      if (!name || !language || !levelCode) {
        result.skipped += 1;
        result.errors.push(`Dong ${line}: name, language, level_code la bat buoc`);
        continue;
      }

      const data = {
        name,
        language,
        level_code: levelCode,
        duration_months: parseNumber(row.duration_months, 3),
        sessions_per_week: parseNumber(row.sessions_per_week, 3),
        session_hours: parseNumber(row.session_hours, 2),
        tuition_fee: parseNumber(row.tuition_fee, 0),
        min_score: parseNumber(row.min_score, 0),
        description: row.description || undefined,
        is_active: parseBoolean(row.is_active, true),
      };

      const existing = await TrainingProgram.findOne({ language, level_code: levelCode });
      if (existing) {
        await TrainingProgram.updateOne({ _id: existing._id }, data);
        result.updated += 1;
      } else {
        await TrainingProgram.create(data);
        result.created += 1;
      }
    }

    return result;
  }

  async importExamSchedules(file?: Express.Multer.File) {
    const rows = getImportRows(file);
    const result = { created: 0, updated: 0, skipped: 0, errors: [] as string[] };

    for (const [index, row] of rows.entries()) {
      const line = index + 2;
      const title = String(row.title || '').trim();
      const language = String(row.language || '').trim();
      const examDateKey = String(row.exam_date || '').slice(0, 10);
      const examDate = new Date(String(row.exam_date || ''));
      const location = String(row.location || '').trim();
      if (!title || !language || Number.isNaN(examDate.getTime()) || !location) {
        result.skipped += 1;
        result.errors.push(`Dong ${line}: title, language, exam_date, location la bat buoc`);
        continue;
      }
      if (!isFixedExamDate(examDateKey)) {
        result.skipped += 1;
        result.errors.push(`Dong ${line}: exam_date phai nam trong danh sach ngay thi co dinh`);
        continue;
      }

      const format: 'offline' | 'online' = row.format === 'online' ? 'online' : 'offline';
      const status: 'open' | 'closed' | 'cancelled' = ['open', 'closed', 'cancelled'].includes(row.status)
        ? row.status as 'open' | 'closed' | 'cancelled'
        : 'open';
      const fixedExamDate = new Date(`${examDateKey}T00:00:00.000`);
      const data = {
        title,
        language,
        exam_date: fixedExamDate,
        location,
        room: row.room || undefined,
        format,
        max_slots: parseNumber(row.max_slots, 30),
        registered_slots: parseNumber(row.registered_slots, 0),
        status,
      };

      const existing = await ExamSchedule.findOne({ title, language, exam_date: fixedExamDate });
      if (existing) {
        await ExamSchedule.updateOne({ _id: existing._id }, data);
        result.updated += 1;
      } else {
        await ExamSchedule.create(data);
        result.created += 1;
      }
    }

    return result;
  }

  async importExamScores(file: Express.Multer.File | undefined, scheduleId: string, adminId: string) {
    const rows = getImportRows(file);
    const result = { imported: 0, skipped: 0, errors: [] as string[] };

    for (const [index, row] of rows.entries()) {
      const line = index + 2;
      const registrationId = getStringValue(row.registration_id);
      const examCode = getStringValue(row.exam_code);
      const query: Record<string, unknown> = {};
      if (registrationId && mongoose.Types.ObjectId.isValid(registrationId)) {
        query._id = new mongoose.Types.ObjectId(registrationId);
      } else if (examCode) {
        query.exam_code = examCode;
      } else {
        result.skipped += 1;
        result.errors.push(`Dong ${line}: can co registration_id hoac exam_code`);
        continue;
      }
      if (scheduleId) query.schedule_id = new mongoose.Types.ObjectId(scheduleId);

      const registration = await ExamRegistration.findOne(query);
      if (!registration) {
        result.skipped += 1;
        result.errors.push(`Dong ${line}: khong tim thay dang ky thi`);
        continue;
      }

      try {
        await this.saveExamScoreDraft(registration._id.toString(), {
          score: row.score,
          level_passed: row.level_passed,
          pass_threshold: row.pass_threshold || 50,
          bag_number: row.bag_number,
          anonymous_code: row.anonymous_code,
        }, adminId);
        result.imported += 1;
      } catch (err) {
        result.skipped += 1;
        result.errors.push(`Dong ${line}: ${(err as Error).message}`);
      }
    }

    return result;
  }

  async closeExamSchedule(id: string) {
    const schedule = await ExamSchedule.findByIdAndUpdate(id, { status: 'closed' }, { new: true });
    if (!schedule) throw new Error('Lịch thi không tồn tại');
    return schedule;
  }

  async getEligibleExamEnrollments(scheduleId: string, search = '') {
    const schedule = await ExamSchedule.findById(scheduleId);
    if (!schedule) throw new Error('Lịch thi không tồn tại');
    const examDateKeys = getExamDateKeys(schedule.exam_date);

    const filter: Record<string, unknown> = {
      is_deleted: false,
      payment_status: 'success',
      exam_required: true,
      language: schedule.language,
      preferred_exam_date: { $in: examDateKeys },
    };

    if (search) {
      filter.$or = [
        { student_full_name: { $regex: search, $options: 'i' } },
        { document_number: { $regex: search, $options: 'i' } },
        { student_cccd: { $regex: search, $options: 'i' } },
      ];
    }

    return EnrollmentForm.find(filter)
      .select('student_full_name document_number student_cccd language level preferred_exam_date exam_schedule_id current_step status')
      .sort({ created_at: -1 })
      .limit(50)
      .lean();
  }

  async assignEnrollmentToExam(scheduleId: string, enrollmentId: string, adminId: string) {
    const schedule = await ExamSchedule.findById(scheduleId);
    if (!schedule) throw new Error('Lịch thi không tồn tại');
    if (schedule.status !== 'open') throw new Error('Lịch thi đã đóng');
    if (schedule.registered_slots >= schedule.max_slots) throw new Error('Lịch thi đã hết chỗ');

    const enrollment = await EnrollmentForm.findById(enrollmentId);
    if (!enrollment || enrollment.is_deleted) throw new Error('Hồ sơ không tồn tại');
    if (enrollment.payment_status !== 'success') throw new Error('Hồ sơ chưa thanh toán lệ phí');
    if (!enrollment.exam_required) throw new Error('Hồ sơ này không yêu cầu kiểm tra năng lực');
    if (enrollment.language !== schedule.language) throw new Error('Ngôn ngữ của hồ sơ không khớp kỳ thi');
    if (!enrollment.preferred_exam_date || !getExamDateKeys(schedule.exam_date).includes(enrollment.preferred_exam_date)) {
      throw new Error('Ngày thi học sinh đã chọn không khớp với ngày thi của kỳ thi này');
    }

    const oldScheduleId = enrollment.exam_schedule_id?.toString();
    const existing = await ExamRegistration.findOne({ enrollment_id: enrollment._id }).sort({ created_at: -1 });
    let registration = existing;

    if (existing) {
      const existingScore = await ExamScore.findOne({ registration_id: existing._id });
      if (existingScore) throw new Error('Thí sinh đã có điểm, không thể đổi kỳ thi');

      if (existing.schedule_id.toString() !== scheduleId) {
        await ExamSchedule.updateOne({ _id: existing.schedule_id }, { $inc: { registered_slots: -1 } });
        await ExamSchedule.updateOne({ _id: scheduleId }, { $inc: { registered_slots: 1 } });
        await this.releaseRoom(existing.room_id);
        existing.schedule_id = new mongoose.Types.ObjectId(scheduleId);
        existing.room_id = undefined;
        existing.exam_code = createTemporaryExamCode(schedule.language);
        await existing.save();
      }
    } else {
      registration = await ExamRegistration.create({
        user_id: enrollment.user_id,
        enrollment_id: enrollment._id,
        schedule_id: schedule._id,
        exam_code: createTemporaryExamCode(schedule.language),
        status: 'confirmed',
      });
      await ExamSchedule.updateOne({ _id: scheduleId }, { $inc: { registered_slots: 1 } });
    }
    enrollment.exam_schedule_id = new mongoose.Types.ObjectId(scheduleId);
    enrollment.exam_confirmed = true;
    if (enrollment.current_step < 4) {
      enrollment.current_step = 4;
      enrollment.status = 'step_4';
    }
    await enrollment.save();

    await EnrollmentLog.create({
      enrollment_id: enrollment._id,
      changed_by: new mongoose.Types.ObjectId(adminId),
      action: 'EXAM_ASSIGNED_BY_ADMIN',
      field_name: 'exam_schedule_id',
      old_value: oldScheduleId,
      new_value: scheduleId,
    });

    await notificationService.create(
      enrollment.user_id.toString(),
      'Bạn đã được xếp lịch thi',
      `Bạn đã được xếp vào kỳ thi "${schedule.title}" ngày ${schedule.exam_date.toLocaleDateString('vi-VN')}${schedule.room ? ` tại ${schedule.room}` : ''}.`,
      'info',
      '/ho-so'
    );
  }

  async assignEnrollmentsByExamDate(scheduleId: string, adminId: string) {
    const schedule = await ExamSchedule.findById(scheduleId);
    if (!schedule) throw new Error('Lá»‹ch thi khÃ´ng tá»“n táº¡i');
    if (schedule.status !== 'open') throw new Error('Lá»‹ch thi Ä‘Ã£ Ä‘Ã³ng');

    const examDateKeys = getExamDateKeys(schedule.exam_date);
    const examDate = examDateKeys[0];
    const enrollments = await EnrollmentForm.find({
      is_deleted: false,
      payment_status: 'success',
      exam_required: true,
      language: schedule.language,
      preferred_exam_date: { $in: examDateKeys },
    }).sort({ created_at: 1 });

    let assigned = 0;
    let moved = 0;
    let skipped = 0;
    let full = false;

    for (const enrollment of enrollments) {
      const currentSchedule = await ExamSchedule.findById(scheduleId);
      if (!currentSchedule || currentSchedule.registered_slots >= currentSchedule.max_slots) {
        full = true;
        break;
      }

      const existing = await ExamRegistration.findOne({ enrollment_id: enrollment._id }).sort({ created_at: -1 });
      let registration = existing;
      if (existing) {
        const existingScore = await ExamScore.findOne({ registration_id: existing._id });
        if (existingScore) {
          skipped += 1;
          continue;
        }
        if (existing.schedule_id.toString() === scheduleId) {
          skipped += 1;
          continue;
        }

        await ExamSchedule.updateOne({ _id: existing.schedule_id }, { $inc: { registered_slots: -1 } });
        await ExamSchedule.updateOne({ _id: scheduleId }, { $inc: { registered_slots: 1 } });
        await this.releaseRoom(existing.room_id);
        existing.schedule_id = new mongoose.Types.ObjectId(scheduleId);
        existing.room_id = undefined;
        existing.exam_code = createTemporaryExamCode(schedule.language, assigned + moved);
        existing.status = 'confirmed';
        await existing.save();
        moved += 1;
      } else {
        registration = await ExamRegistration.create({
          user_id: enrollment.user_id,
          enrollment_id: enrollment._id,
          schedule_id: schedule._id,
          exam_code: createTemporaryExamCode(schedule.language, assigned + moved),
          status: 'confirmed',
        });
        await ExamSchedule.updateOne({ _id: scheduleId }, { $inc: { registered_slots: 1 } });
        assigned += 1;
      }
      const oldScheduleId = enrollment.exam_schedule_id?.toString();
      enrollment.exam_schedule_id = new mongoose.Types.ObjectId(scheduleId);
      enrollment.exam_confirmed = true;
      if (enrollment.current_step < 4) {
        enrollment.current_step = 4;
        enrollment.status = 'step_4';
      }
      await enrollment.save();

      await EnrollmentLog.create({
        enrollment_id: enrollment._id,
        changed_by: new mongoose.Types.ObjectId(adminId),
        action: 'EXAM_ASSIGNED_BY_DATE',
        field_name: 'exam_schedule_id',
        old_value: oldScheduleId,
        new_value: scheduleId,
      });

      await notificationService.create(
        enrollment.user_id.toString(),
        'Bạn đã được xếp lịch thi',
        `Bạn đã được xếp vào kỳ thi "${schedule.title}" ngày ${schedule.exam_date.toLocaleDateString('vi-VN')}${schedule.room ? ` tại ${schedule.room}` : ''}. Phòng thi và số báo danh sẽ hiển thị sau khi trung tâm công bố.`,
        'info',
        '/ho-so'
      );
    }

    return { exam_date: examDate, language: schedule.language, matched: enrollments.length, assigned, moved, skipped, full };
  }

  async getExamRegistrations({ scheduleId = '' } = {}) {
    const filter = scheduleId ? { schedule_id: new mongoose.Types.ObjectId(scheduleId) } : {};
    const regs = await ExamRegistration.find(filter)
      .populate('user_id', 'email full_name')
      .populate('room_id', 'name location capacity assigned_count')
      .sort({ created_at: -1 })
      .lean();
    const withScores = await Promise.all(regs.map(async (r) => {
      const score = await ExamScore.findOne({ registration_id: r._id });
      return {
        ...r,
        score: score
          ? {
            score: score.score,
            level_passed: score.level_passed,
            pass_status: score.pass_status,
            pass_threshold: score.pass_threshold,
            status: score.status,
          }
          : null,
      };
    }));
    return withScores;
  }

  async getInterviews({ page = 1, limit = 20, status = '' } = {}) {
    const filter: Record<string, unknown> = {};
    if (status) filter.status = status;
    const [data, total] = await Promise.all([
      Interview.find(filter)
        .populate('user_id', 'email full_name phone')
        .populate('enrollment_id', 'student_full_name document_number language level')
        .sort({ scheduled_at: 1 })
        .skip((page - 1) * limit)
        .limit(limit)
        .lean(),
      Interview.countDocuments(filter),
    ]);
    return { data, total, page, limit };
  }

  async createInterview(data: Record<string, unknown>, adminId: string) {
    const enrollment = await EnrollmentForm.findById(data.enrollment_id);
    if (!enrollment) throw new Error('Hồ sơ không tồn tại');
    const title = String(data.title || '').trim();
    const scheduledAt = new Date(String(data.scheduled_at || ''));
    const location = String(data.location || '').trim();
    if (!title || Number.isNaN(scheduledAt.getTime()) || !location) {
      throw new Error('Thiếu thông tin lịch phỏng vấn');
    }
    const interview = await Interview.create({
      user_id: enrollment.user_id,
      enrollment_id: enrollment._id,
      title,
      scheduled_at: scheduledAt,
      location,
      format: data.format === 'online' ? 'online' : 'offline',
      notes: data.notes ? String(data.notes) : undefined,
      created_by: new mongoose.Types.ObjectId(adminId),
    });
    await notificationService.create(
      enrollment.user_id.toString(),
      'Lịch phỏng vấn tuyển sinh',
      `Bạn có lịch phỏng vấn: ${interview.title}. Vui lòng xác nhận tham gia.`,
      'info',
      '/ho-so'
    );
    return interview;
  }

  async updateInterviewStatus(id: string, status: string) {
    const allowed = ['pending', 'confirmed', 'declined', 'completed', 'cancelled'];
    if (!allowed.includes(status)) throw new Error('Trạng thái phỏng vấn không hợp lệ');
    const interview = await Interview.findByIdAndUpdate(id, { status }, { new: true });
    if (!interview) throw new Error('Lịch phỏng vấn không tồn tại');
    await notificationService.create(
      interview.user_id.toString(),
      'Cập nhật lịch phỏng vấn',
      `Lịch phỏng vấn "${interview.title}" đã được cập nhật trạng thái: ${status}.`,
      status === 'cancelled' ? 'warning' : 'info',
      '/ho-so'
    );
    return interview;
  }

  async getInvoices({ page = 1, limit = 20, status = '' } = {}) {
    const filter: Record<string, unknown> = {};
    if (status) filter.status = status;
    const [data, total] = await Promise.all([
      Invoice.find(filter)
        .populate('user_id', 'email full_name')
        .populate('enrollment_id', 'student_full_name document_number')
        .sort({ issued_at: -1 })
        .skip((page - 1) * limit)
        .limit(limit)
        .lean(),
      Invoice.countDocuments(filter),
    ]);
    return { data, total, page, limit };
  }

  async updateInvoiceStatus(id: string, status: string) {
    const allowed = ['draft', 'issued', 'paid', 'cancelled'];
    if (!allowed.includes(status)) throw new Error('Trạng thái hóa đơn không hợp lệ');
    const invoice = await Invoice.findByIdAndUpdate(
      id,
      { status, paid_at: status === 'paid' ? new Date() : undefined },
      { new: true }
    );
    if (!invoice) throw new Error('Hóa đơn không tồn tại');
    return invoice;
  }

  async getBanners() {
    return Banner.find().sort({ sort_order: 1, created_at: -1 });
  }

  async createBanner(data: Record<string, unknown>) {
    return Banner.create(data);
  }

  async updateBanner(id: string, data: Record<string, unknown>) {
    const banner = await Banner.findByIdAndUpdate(id, data, { new: true });
    if (!banner) throw new Error('Banner không tồn tại');
    return banner;
  }

  async deleteBanner(id: string) {
    await Banner.findByIdAndUpdate(id, { is_active: false });
  }

  async getNews() {
    return News.find().sort({ published_at: -1, created_at: -1 });
  }

  async createNews(data: Record<string, unknown>) {
    const title = String(data.title || '').trim();
    if (!title) throw new Error('Tiêu đề tin tức là bắt buộc');
    const slug = String(data.slug || title.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, ''));
    return News.create({
      title,
      slug,
      summary: data.summary ? String(data.summary) : undefined,
      content: data.content ? String(data.content) : undefined,
      category: data.category ? String(data.category) : 'announcement',
      status: data.status === 'published' || data.status === 'archived' ? data.status : 'draft',
      published_at: data.status === 'published' ? new Date() : undefined,
    });
  }

  async updateNews(id: string, data: Record<string, unknown>) {
    const news = await News.findByIdAndUpdate(id, data, { new: true });
    if (!news) throw new Error('Tin tức không tồn tại');
    return news;
  }

  async deleteNews(id: string) {
    await News.findByIdAndUpdate(id, { status: 'archived' });
  }

  async getConfigs() {
    return SystemConfig.find().sort({ group: 1, key: 1 });
  }

  async upsertConfig(data: Record<string, unknown>, adminId: string) {
    const key = String(data.key || '').trim();
    if (!key) throw new Error('Key cấu hình là bắt buộc');
    return SystemConfig.findOneAndUpdate(
      { key },
      {
        value: String(data.value ?? ''),
        group: data.group || 'general',
        description: data.description,
        updated_by: new mongoose.Types.ObjectId(adminId),
      },
      { new: true, upsert: true }
    );
  }
}

export const adminService = new AdminService();
