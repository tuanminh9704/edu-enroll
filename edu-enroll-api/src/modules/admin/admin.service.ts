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
import { CourseClass } from '../../models/CourseClass';
import { notificationService } from '../notifications/notification.service';
import mongoose from 'mongoose';
import { calculateExamResult } from '../../utils/examResult';
import { hashPassword } from '../../utils/hash';
import { parseBoolean, parseCsv, parseNumber, toCsv } from '../../utils/csv';
import { FIXED_EXAM_DATES, isFixedExamDate, toExamDateKey } from '../../constants/exam';

const EXAM_DATE_TIME_ZONE = 'Asia/Ho_Chi_Minh';

const PROGRAM_MIN_SCORE_BY_LEVEL: Record<string, number> = {
  A1: 0,
  A2: 40,
  B1: 55,
  B2: 70,
  C1: 85,
  IELTS: 70,
  TOEIC: 55,
  N5: 0,
  N4: 55,
  N3: 70,
  N2: 85,
  N1: 90,
  K1: 0,
  K2: 50,
  K3: 75,
  TOPIK: 75,
  HSK1: 0,
  HSK3: 50,
  HSK5: 75,
  FR_A1: 0,
  FR_A2: 45,
  FR_B1: 65,
  FR_B2: 80,
};

const normalizeProgramInput = (data: Record<string, unknown>) => {
  const levelCode = getStringValue(data.level_code);
  const normalized = { ...data };
  if (levelCode) {
    normalized.level_code = levelCode;
    normalized.level = getStringValue(data.level) || levelCode;
    if (data.min_score === undefined || data.min_score === null || data.min_score === '') {
      normalized.min_score = PROGRAM_MIN_SCORE_BY_LEVEL[levelCode] ?? 0;
    }
  }
  return normalized;
};

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

const createRoomCode = (roomName: string, index: number): string => {
  const normalized = roomName
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-zA-Z0-9]/g, '')
    .toUpperCase();
  return normalized || `P${String(index).padStart(2, '0')}`;
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

const getObjectIdString = (value: unknown): string => {
  if (!value) return '';
  if (typeof value === 'string') return value;
  if (value instanceof mongoose.Types.ObjectId) return value.toString();
  const maybe = value as { _id?: unknown; toString?: () => string };
  if (maybe._id) return getObjectIdString(maybe._id);
  return maybe.toString ? maybe.toString() : '';
};

const getFirstStringValue = (row: Record<string, unknown>, keys: string[]): string | undefined => {
  for (const key of keys) {
    const value = getStringValue(row[key]);
    if (value) return value;
  }
  return undefined;
};

const normalizeAttendanceStatus = (value: unknown): 'pending' | 'attended' | 'absent' | undefined => {
  const text = String(value ?? '').trim().toLowerCase();
  if (!text) return undefined;
  if (['attended', 'present', 'co thi', 'có thi', 'du thi', 'dự thi', '1', 'yes', 'true'].includes(text)) return 'attended';
  if (['absent', 'vang', 'vắng', 'vang thi', 'vắng thi', '0', 'no', 'false'].includes(text)) return 'absent';
  if (['pending', 'chua xac nhan', 'chưa xác nhận', 'cho xu ly', 'chờ xử lý'].includes(text)) return 'pending';
  return undefined;
};

const hasScoreValue = (value: unknown): boolean => String(value ?? '').trim() !== '';

const createClassCode = (language: string, levelCode: string): string => {
  const lang = (language || 'XX').toUpperCase().substring(0, 2);
  const level = (levelCode || 'LV').toUpperCase().replace(/[^A-Z0-9]/g, '');
  return `${lang}-${level}-${Date.now().toString().slice(-6)}`;
};

type CourseClassStatus = 'open' | 'full' | 'closed' | 'completed';

const normalizeClassStatus = (value: unknown, fallback: CourseClassStatus = 'open'): CourseClassStatus => {
  const text = String(value ?? '').trim();
  return ['open', 'full', 'closed', 'completed'].includes(text) ? text as CourseClassStatus : fallback;
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

  private assertCanEnterExamScore(registration: {
    room_id?: unknown;
    exam_code?: string;
    bag_number?: string;
    anonymous_code?: string;
    attendance_status?: string;
    exam_violation?: boolean;
  }) {
    if (!registration.room_id) throw new Error('Cần xếp phòng thi trước khi nhập điểm');
    if (!registration.exam_code || registration.exam_code.startsWith('TMP')) throw new Error('Cần đánh số báo danh trước khi nhập điểm');
    if (!registration.bag_number) throw new Error('Cần đánh số túi bài thi trước khi nhập điểm');
    if (!registration.anonymous_code) throw new Error('Cần nhập mã phách trước khi nhập điểm');
    if (registration.attendance_status !== 'attended') throw new Error('Chỉ thí sinh có thi mới được nhập điểm');
    if (registration.exam_violation) throw new Error('Thí sinh có biên bản VPQC không được nhập điểm');
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

  async autoCreateExamRooms(scheduleId: string, data: Record<string, unknown> = {}) {
    const schedule = await ExamSchedule.findById(scheduleId);
    if (!schedule) throw new Error('Lịch thi không tồn tại');

    const roomCapacity = Math.max(1, Number(data.room_capacity || data.capacity || 25));
    const roomPrefix = String(data.room_prefix || 'P').trim() || 'P';
    const targetSlots = Math.max(schedule.max_slots || 0, schedule.registered_slots || 0);
    if (targetSlots < 1) throw new Error('Kỳ thi chưa cấu hình số chỗ tối đa');

    const existingRooms = await ExamRoom.find({ schedule_id: schedule._id }).sort({ created_at: 1 });
    const existingCapacity = existingRooms.reduce((sum, room) => sum + room.capacity, 0);
    const missingSlots = Math.max(targetSlots - existingCapacity, 0);
    const roomsToCreate = Math.ceil(missingSlots / roomCapacity);

    const created = [];
    const existingNames = new Set(existingRooms.map((room) => room.name));
    let nextRoomNumber = 1;
    for (let i = 0; i < roomsToCreate; i += 1) {
      let name = `${roomPrefix}${String(nextRoomNumber).padStart(2, '0')}`;
      while (existingNames.has(name)) {
        nextRoomNumber += 1;
        name = `${roomPrefix}${String(nextRoomNumber).padStart(2, '0')}`;
      }
      existingNames.add(name);
      nextRoomNumber += 1;
      const room = await ExamRoom.create({
        schedule_id: schedule._id,
        name,
        capacity: roomCapacity,
        location: String(data.location || schedule.location || '').trim() || undefined,
      });
      created.push(room);
    }

    return {
      schedule_id: scheduleId,
      target_slots: targetSlots,
      room_capacity: roomCapacity,
      existing_rooms: existingRooms.length,
      created: created.length,
      total_rooms: existingRooms.length + created.length,
      total_capacity: existingCapacity + (created.length * roomCapacity),
    };
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
      registration.bag_number = undefined;
      registration.anonymous_code = undefined;
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

    const rooms = await ExamRoom.find({ schedule_id: new mongoose.Types.ObjectId(scheduleId) }).sort({ created_at: 1, name: 1 }).lean();
    const roomOrder = new Map(rooms.map((room, index) => [room._id.toString(), { index: index + 1, name: room.name }]));

    const registrations = await ExamRegistration.find({
      schedule_id: new mongoose.Types.ObjectId(scheduleId),
      status: 'confirmed',
      room_id: { $exists: true, $ne: null },
    })
      .populate('room_id', 'name')
      .sort({ exam_code: 1, created_at: 1 });

    if (registrations.length === 0) throw new Error('Can xep phong truoc khi danh so tui va ma phach');

    const prefix = (schedule.language || 'XX').toUpperCase().substring(0, 2);
    const dateKey = toExamDateKey(schedule.exam_date).replace(/-/g, '');
    let generated = 0;
    const roomCounters = new Map<string, number>();
    const orderedRegistrations = registrations.sort((a, b) => {
      const aRoom = getObjectIdString(a.room_id);
      const bRoom = getObjectIdString(b.room_id);
      const aOrder = roomOrder.get(aRoom)?.index ?? 9999;
      const bOrder = roomOrder.get(bRoom)?.index ?? 9999;
      return aOrder - bOrder || String(a.exam_code || '').localeCompare(String(b.exam_code || ''));
    });

    for (const registration of orderedRegistrations) {
      const roomId = getObjectIdString(registration.room_id);
      const roomMeta = roomOrder.get(roomId);
      if (!roomMeta) throw new Error('Phòng thi không thuộc kỳ thi này');
      const next = (roomCounters.get(roomId) || 0) + 1;
      roomCounters.set(roomId, next);
      const roomIndex = roomMeta.index;
      const roomCode = createRoomCode(roomMeta.name, roomIndex);
      registration.subject_code = registration.subject_code || schedule.language;
      registration.bag_number = `${prefix}-${dateKey}-${roomCode}`;
      registration.anonymous_code = `${prefix}${dateKey}${String(roomIndex).padStart(2, '0')}${String(next).padStart(3, '0')}`;
      await registration.save();
      generated += 1;
    }

    return {
      matched: registrations.length,
      generated,
      rooms: roomCounters.size,
      bag_count: roomCounters.size,
    };
  }

  async setupExamProcess(scheduleId: string, data: Record<string, unknown> = {}) {
    const rooms = await this.autoCreateExamRooms(scheduleId, data);
    const assigned = await this.autoAssignExamRooms(scheduleId);
    const coded = await this.generateExamBagsAndAnonymousCodes(scheduleId);
    return {
      rooms,
      assigned,
      coded,
    };
  }

  async updateExamProcess(registrationId: string, data: Record<string, unknown>, adminId?: string) {
    const reg = await ExamRegistration.findById(registrationId);
    if (!reg) throw new Error('Đăng ký thi không tồn tại');
    if (!['confirmed', 'absent'].includes(reg.status)) throw new Error('Chỉ có thể cập nhật quy trình cho thí sinh đã xác nhận thi');

    const oldValue = [
      reg.subject_code,
      reg.bag_number,
      reg.anonymous_code,
      reg.attendance_status,
      reg.exam_violation ? 'VPQC' : '',
    ].filter(Boolean).join('/');

    const subjectCode = getFirstStringValue(data, ['subject_code', 'subject', 'mon_thi', 'môn_thi']);
    const bagNumber = getFirstStringValue(data, ['bag_number', 'so_tui', 'số_túi']);
    const anonymousCode = getFirstStringValue(data, ['anonymous_code', 'ma_phach', 'mã_phách']);
    const attendanceStatus = normalizeAttendanceStatus(getFirstStringValue(data, ['attendance_status', 'co_thi', 'có_thi', 'du_thi', 'dự_thi']));
    const absenceReportNumber = getFirstStringValue(data, ['absence_report_number', 'bien_ban_vang_thi', 'biên_bản_vắng_thi']);
    const absenceReason = getFirstStringValue(data, ['absence_reason', 'ly_do_vang', 'lý_do_vắng']);
    const violationReportNumber = getFirstStringValue(data, ['violation_report_number', 'bien_ban_vpqc', 'biên_bản_vpqc']);
    const violationNote = getFirstStringValue(data, ['violation_note', 'ghi_chu_vpqc', 'ghi_chú_vpqc']);

    if (subjectCode !== undefined) reg.subject_code = subjectCode;
    if (bagNumber !== undefined) reg.bag_number = bagNumber;
    if (anonymousCode !== undefined) reg.anonymous_code = anonymousCode;
    if (attendanceStatus !== undefined) {
      reg.attendance_status = attendanceStatus;
      if (attendanceStatus === 'absent') reg.status = 'absent';
      if (attendanceStatus === 'attended' && reg.status === 'absent') reg.status = 'confirmed';
    }
    if (absenceReportNumber !== undefined) reg.absence_report_number = absenceReportNumber;
    if (absenceReason !== undefined) reg.absence_reason = absenceReason;
    if (data.exam_violation !== undefined || data.vpqc !== undefined || data.vi_pham_quy_che !== undefined || data['vi_phạm_quy_chế'] !== undefined) {
      reg.exam_violation = parseBoolean(data.exam_violation ?? data.vpqc ?? data.vi_pham_quy_che ?? data['vi_phạm_quy_chế'], false);
    }
    if (violationReportNumber !== undefined) reg.violation_report_number = violationReportNumber;
    if (violationNote !== undefined) reg.violation_note = violationNote;

    if (reg.attendance_status === 'absent' && !reg.absence_report_number) {
      throw new Error('Thí sinh vắng thi cần có số biên bản vắng thi');
    }
    if (reg.exam_violation && !reg.violation_report_number) {
      throw new Error('Thí sinh VPQC cần có số biên bản vi phạm quy chế');
    }

    await reg.save();

    if (adminId) {
      await EnrollmentLog.create({
        enrollment_id: reg.enrollment_id,
        changed_by: new mongoose.Types.ObjectId(adminId),
        action: 'EXAM_PROCESS_UPDATED',
        field_name: 'exam_process',
        old_value: oldValue || undefined,
        new_value: [
          reg.subject_code,
          reg.bag_number,
          reg.anonymous_code,
          reg.attendance_status,
          reg.exam_violation ? 'VPQC' : '',
        ].filter(Boolean).join('/'),
      });
    }

    if (reg.attendance_status === 'absent' || reg.exam_violation) {
      await ExamScore.deleteOne({ registration_id: reg._id });
    }

    return reg;
  }

  async enterExamScore(registrationId: string, score: number, levelPassed?: string, adminId?: string, passThreshold = 50) {
    const numericScore = Number(score);
    if (!Number.isFinite(numericScore) || numericScore < 0 || numericScore > 100) {
      throw new Error('Điểm thi phải nằm trong khoảng 0 - 100');
    }

    const reg = await ExamRegistration.findById(registrationId).populate('schedule_id', 'language');
    if (!reg) throw new Error('Đăng ký thi không tồn tại');
    if (!['confirmed', 'absent'].includes(reg.status)) throw new Error('Chỉ có thể nhập điểm cho thí sinh đã xác nhận thi');
    this.assertCanEnterExamScore(reg);

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
    await this.updateExamProcess(registrationId, data, adminId);
    const updatedReg = await ExamRegistration.findById(registrationId).populate('schedule_id', 'language');
    if (!updatedReg) throw new Error('Đăng ký thi không tồn tại');
    this.assertCanEnterExamScore(updatedReg);

    const enrollment = await EnrollmentForm.findById(updatedReg.enrollment_id);
    if (!enrollment) throw new Error('Hồ sơ không tồn tại');
    const scheduleLanguage = typeof updatedReg.schedule_id === 'object' && 'language' in updatedReg.schedule_id
      ? String((updatedReg.schedule_id as unknown as { language?: string }).language || '')
      : '';
    const result = calculateExamResult(numericScore, enrollment.language || scheduleLanguage, getStringValue(data.level_passed), Number(data.pass_threshold || 50));

    const existingScore = await ExamScore.findOne({ registration_id: updatedReg._id });
    await ExamScore.findOneAndUpdate(
      { registration_id: updatedReg._id },
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
        enrollment_id: updatedReg.enrollment_id,
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
    this.assertCanEnterExamScore(reg);
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
    const errors: string[] = [];

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
      try {
        await this.syncExamScore(registration._id.toString(), adminId);
        synced += 1;
      } catch (err) {
        skipped += 1;
        errors.push(`${registration._id}: ${(err as Error).message}`);
      }
    }

    return { matched: registrations.length, synced, skipped, errors };
  }

  async getPrograms() {
    return TrainingProgram.find({ is_active: true }).sort({ language: 1, level_code: 1 });
  }

  async createProgram(data: Record<string, unknown>) {
    return TrainingProgram.create(normalizeProgramInput(data));
  }

  async updateProgram(id: string, data: Record<string, unknown>) {
    const program = await TrainingProgram.findByIdAndUpdate(id, normalizeProgramInput(data), { new: true });
    if (!program) throw new Error('Hệ đào tạo không tồn tại');
    return program;
  }

  async deleteProgram(id: string) {
    await TrainingProgram.findByIdAndUpdate(id, { is_active: false });
  }

  async getClasses({ status = '', language = '', level = '' } = {}) {
    const filter: Record<string, unknown> = {};
    if (status) filter.status = status;
    if (language) filter.language = language;
    if (level) filter.level_code = level;

    const classes = await CourseClass.find(filter)
      .populate('program_id', 'name level_code language')
      .sort({ created_at: -1 })
      .lean();

    return classes;
  }

  async createClass(data: Record<string, unknown>, adminId: string) {
    const name = getStringValue(data.name);
    const language = getStringValue(data.language);
    const levelCode = getStringValue(data.level_code);
    const maxStudents = Number(data.max_students);
    if (!name || !language || !levelCode) throw new Error('Tên lớp, ngôn ngữ và cấp độ là bắt buộc');
    if (!Number.isFinite(maxStudents) || maxStudents < 1) throw new Error('Sĩ số tối đa không hợp lệ');

    const programId = getStringValue(data.program_id);
    if (programId) {
      const program = await TrainingProgram.findById(programId);
      if (!program) throw new Error('Chương trình đào tạo không tồn tại');
      if (program.language !== language || program.level_code !== levelCode) {
        throw new Error('Chương trình không khớp ngôn ngữ hoặc cấp độ lớp');
      }
    }

    const code = getStringValue(data.code) || createClassCode(language, levelCode);
    return CourseClass.create({
      code,
      name,
      language,
      level_code: levelCode,
      program_id: programId ? new mongoose.Types.ObjectId(programId) : undefined,
      teacher_name: getStringValue(data.teacher_name),
      facility: getStringValue(data.facility),
      schedule: getStringValue(data.schedule),
      start_date: data.start_date ? new Date(String(data.start_date)) : undefined,
      end_date: data.end_date ? new Date(String(data.end_date)) : undefined,
      max_students: maxStudents,
      status: normalizeClassStatus(data.status),
      note: getStringValue(data.note),
      created_by: new mongoose.Types.ObjectId(adminId),
    });
  }

  async updateClass(id: string, data: Record<string, unknown>) {
    const klass = await CourseClass.findById(id);
    if (!klass) throw new Error('Lớp học không tồn tại');

    const update: Record<string, unknown> = {};
    const stringFields = ['code', 'name', 'language', 'level_code', 'teacher_name', 'facility', 'schedule', 'note'];
    for (const field of stringFields) {
      const value = getStringValue(data[field]);
      if (value !== undefined) update[field] = value;
    }
    if (data.program_id !== undefined) {
      const programId = getStringValue(data.program_id);
      update.program_id = programId ? new mongoose.Types.ObjectId(programId) : undefined;
    }
    if (data.start_date !== undefined) update.start_date = data.start_date ? new Date(String(data.start_date)) : undefined;
    if (data.end_date !== undefined) update.end_date = data.end_date ? new Date(String(data.end_date)) : undefined;
    if (data.max_students !== undefined) {
      const maxStudents = Number(data.max_students);
      if (!Number.isFinite(maxStudents) || maxStudents < klass.current_students) {
        throw new Error('Sĩ số tối đa không được nhỏ hơn số học viên hiện tại');
      }
      update.max_students = maxStudents;
    }
    if (data.status) {
      update.status = normalizeClassStatus(data.status, klass.status);
    }

    const updated = await CourseClass.findByIdAndUpdate(id, update, { new: true });
    if (!updated) throw new Error('Lớp học không tồn tại');
    return updated;
  }

  async getClassStudents(classId: string) {
    return EnrollmentForm.find({ class_id: new mongoose.Types.ObjectId(classId), is_deleted: false })
      .populate('user_id', 'email full_name phone')
      .select('user_id student_full_name parent_phone language level exam_level_passed exam_score program_name document_number status created_at')
      .sort({ student_full_name: 1, created_at: 1 })
      .lean();
  }

  private getClassEligibleFilter(klass: { _id: unknown; language: string; level_code: string; program_id?: unknown }) {
    const filter: Record<string, unknown> = {
      is_deleted: false,
      payment_status: 'success',
      program_id: { $exists: true, $ne: null },
      language: klass.language,
      status: { $nin: ['cancelled', 'rejected'] },
      $or: [
        { class_id: { $exists: false } },
        { class_id: null },
        { class_id: klass._id },
      ],
    };

    if (klass.program_id) filter.program_id = klass.program_id;
    filter.$and = [{
      $or: [
        { exam_required: false, level: klass.level_code },
        { exam_required: true, exam_pass_status: 'passed', exam_level_passed: klass.level_code },
        { program_name: { $regex: klass.level_code, $options: 'i' } },
      ],
    }];

    return filter;
  }

  async getEligibleClassEnrollments(classId: string, search = '') {
    const klass = await CourseClass.findById(classId);
    if (!klass) throw new Error('Lớp học không tồn tại');

    const filter = this.getClassEligibleFilter(klass);
    if (search) {
      filter.$and = [
        ...((filter.$and as Record<string, unknown>[]) || []),
        {
          $or: [
            { student_full_name: { $regex: search, $options: 'i' } },
            { document_number: { $regex: search, $options: 'i' } },
            { student_cccd: { $regex: search, $options: 'i' } },
            { parent_phone: { $regex: search, $options: 'i' } },
          ],
        },
      ];
    }

    return EnrollmentForm.find(filter)
      .select('student_full_name document_number parent_phone language level exam_level_passed exam_score program_name class_id status')
      .sort({ created_at: 1 })
      .limit(100)
      .lean();
  }

  async assignEnrollmentToClass(classId: string, enrollmentId: string, adminId: string) {
    const klass = await CourseClass.findById(classId);
    if (!klass) throw new Error('Lớp học không tồn tại');
    if (!['open', 'full'].includes(klass.status)) throw new Error('Lớp học đã đóng, không thể xếp thêm học viên');

    const enrollment = await EnrollmentForm.findById(enrollmentId);
    if (!enrollment || enrollment.is_deleted) throw new Error('Hồ sơ không tồn tại');
    if (enrollment.payment_status !== 'success') throw new Error('Học viên chưa thanh toán lệ phí');
    if (!enrollment.program_id) throw new Error('Học viên chưa chọn chương trình học');
    if (enrollment.language !== klass.language) throw new Error('Ngôn ngữ học viên không khớp lớp');
    if (klass.program_id && enrollment.program_id.toString() !== klass.program_id.toString()) {
      throw new Error('Chương trình học viên không khớp lớp');
    }
    const effectiveLevel = enrollment.exam_required ? enrollment.exam_level_passed : enrollment.level;
    if (effectiveLevel !== klass.level_code && !String(enrollment.program_name || '').includes(klass.level_code)) {
      throw new Error('Cấp độ học viên không phù hợp với lớp');
    }
    if (enrollment.exam_required && enrollment.exam_pass_status !== 'passed') {
      throw new Error('Học viên chưa đạt điều kiện đầu vào');
    }

    const oldClassId = enrollment.class_id?.toString();
    if (oldClassId === classId) return { assigned: 0, alreadyAssigned: true };
    if (klass.current_students >= klass.max_students) throw new Error('Lớp đã đủ sĩ số');

    if (oldClassId) {
      await CourseClass.updateOne({ _id: oldClassId, current_students: { $gt: 0 } }, { $inc: { current_students: -1 }, $set: { status: 'open' } });
    }

    enrollment.class_id = klass._id as mongoose.Types.ObjectId;
    await enrollment.save();
    klass.current_students += 1;
    if (klass.current_students >= klass.max_students) klass.status = 'full';
    await klass.save();

    await EnrollmentLog.create({
      enrollment_id: enrollment._id,
      changed_by: new mongoose.Types.ObjectId(adminId),
      action: 'CLASS_ASSIGNED',
      field_name: 'class_id',
      old_value: oldClassId,
      new_value: classId,
    });

    await notificationService.create(
      enrollment.user_id.toString(),
      'Bạn đã được xếp lớp',
      `Bạn đã được xếp vào lớp ${klass.name}${klass.schedule ? `, lịch học: ${klass.schedule}` : ''}.`,
      'success',
      '/tai-khoan'
    );

    return { assigned: 1, alreadyAssigned: false };
  }

  async autoAssignClassByLevel(classId: string, adminId: string) {
    const klass = await CourseClass.findById(classId);
    if (!klass) throw new Error('Lớp học không tồn tại');
    if (!['open', 'full'].includes(klass.status)) throw new Error('Lớp học đã đóng');

    const remaining = klass.max_students - klass.current_students;
    if (remaining <= 0) throw new Error('Lớp đã đủ sĩ số');

    const enrollments = await EnrollmentForm.find(this.getClassEligibleFilter(klass))
      .sort({ exam_score: -1, created_at: 1 })
      .limit(remaining);

    let assigned = 0;
    let skipped = 0;
    for (const enrollment of enrollments) {
      try {
        const result = await this.assignEnrollmentToClass(classId, enrollment._id.toString(), adminId);
        assigned += result.assigned;
      } catch {
        skipped += 1;
      }
    }

    return { matched: enrollments.length, assigned, skipped, remaining_before: remaining };
  }

  async removeEnrollmentFromClass(classId: string, enrollmentId: string, adminId: string) {
    const enrollment = await EnrollmentForm.findById(enrollmentId);
    if (!enrollment || enrollment.class_id?.toString() !== classId) throw new Error('Học viên không thuộc lớp này');
    enrollment.class_id = undefined;
    await enrollment.save();
    await CourseClass.updateOne({ _id: classId, current_students: { $gt: 0 } }, { $inc: { current_students: -1 }, $set: { status: 'open' } });
    await EnrollmentLog.create({
      enrollment_id: enrollment._id,
      changed_by: new mongoose.Types.ObjectId(adminId),
      action: 'CLASS_REMOVED',
      field_name: 'class_id',
      old_value: classId,
      new_value: undefined,
    });
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
        subject_code: registration.subject_code,
        room: room?.name,
        bag_number: registration.bag_number,
        anonymous_code: registration.anonymous_code,
        attendance_status: registration.attendance_status,
        absence_report_number: registration.absence_report_number,
        absence_reason: registration.absence_reason,
        exam_violation: registration.exam_violation ? '1' : '0',
        violation_report_number: registration.violation_report_number,
        violation_note: registration.violation_note,
        score: score?.score,
        level_passed: score?.level_passed,
        pass_status: score?.pass_status,
        pass_threshold: score?.pass_threshold,
        score_status: score?.status,
      };
    }));
    const headers = [
      'registration_id', 'exam_code', 'student_name', 'email', 'subject_code', 'room', 'bag_number', 'anonymous_code',
      'attendance_status', 'absence_report_number', 'absence_reason', 'exam_violation', 'violation_report_number', 'violation_note',
      'score', 'level_passed', 'pass_status', 'pass_threshold', 'score_status',
    ];
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
        level: levelCode,
        duration_months: parseNumber(row.duration_months, 3),
        sessions_per_week: parseNumber(row.sessions_per_week, 3),
        session_hours: parseNumber(row.session_hours, 2),
        tuition_fee: parseNumber(row.tuition_fee, 0),
        min_score: row.min_score === undefined || row.min_score === ''
          ? (PROGRAM_MIN_SCORE_BY_LEVEL[levelCode] ?? 0)
          : parseNumber(row.min_score, 0),
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
        await this.updateExamProcess(registration._id.toString(), row, adminId);
        if (hasScoreValue(row.score)) {
          await this.saveExamScoreDraft(registration._id.toString(), {
            ...row,
            score: row.score,
            level_passed: row.level_passed,
            pass_threshold: row.pass_threshold || 50,
          }, adminId);
        }
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
    if (!schedule) throw new Error('Lịch thi không tồn tại');
    if (schedule.status !== 'open') throw new Error('Lịch thi đã đóng');
    if (!Number.isFinite(schedule.max_slots) || schedule.max_slots < 1) {
      throw new Error('Lịch thi chưa cấu hình số chỗ tối đa');
    }

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
    let alreadyAssigned = 0;
    let full = false;
    let registeredSlots = await ExamRegistration.countDocuments({
      schedule_id: schedule._id,
      status: { $in: ['confirmed', 'pending', 'absent'] },
    });

    for (const enrollment of enrollments) {
      const existing = await ExamRegistration.findOne({ enrollment_id: enrollment._id }).sort({ created_at: -1 });
      if (existing) {
        const existingScore = await ExamScore.findOne({ registration_id: existing._id });
        if (existingScore) {
          skipped += 1;
          continue;
        }
        if (existing.schedule_id.toString() === scheduleId) {
          const oldScheduleId = enrollment.exam_schedule_id?.toString();
          enrollment.exam_schedule_id = new mongoose.Types.ObjectId(scheduleId);
          enrollment.exam_confirmed = true;
          if (enrollment.current_step < 4) {
            enrollment.current_step = 4;
            enrollment.status = 'step_4';
          }
          await enrollment.save();
          if (oldScheduleId !== scheduleId) {
            await EnrollmentLog.create({
              enrollment_id: enrollment._id,
              changed_by: new mongoose.Types.ObjectId(adminId),
              action: 'EXAM_ASSIGNED_BY_DATE',
              field_name: 'exam_schedule_id',
              old_value: oldScheduleId,
              new_value: scheduleId,
            });
          }
          alreadyAssigned += 1;
          continue;
        }
      }

      if (registeredSlots >= schedule.max_slots) {
        full = true;
        skipped += 1;
        continue;
      }

      if (existing) {
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
        await ExamRegistration.create({
          user_id: enrollment.user_id,
          enrollment_id: enrollment._id,
          schedule_id: schedule._id,
          exam_code: createTemporaryExamCode(schedule.language, assigned + moved),
          status: 'confirmed',
        });
        await ExamSchedule.updateOne({ _id: scheduleId }, { $inc: { registered_slots: 1 } });
        assigned += 1;
      }
      registeredSlots += 1;

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

    await ExamSchedule.updateOne({ _id: scheduleId }, { registered_slots: registeredSlots });

    return {
      exam_date: examDate,
      language: schedule.language,
      matched: enrollments.length,
      assigned,
      moved,
      already_assigned: alreadyAssigned,
      skipped,
      full,
      remaining_slots: Math.max(schedule.max_slots - registeredSlots, 0),
    };
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
