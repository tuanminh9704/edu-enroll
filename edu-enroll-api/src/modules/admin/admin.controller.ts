import { Request, Response } from 'express';
import { adminService } from './admin.service';
import { successResponse, errorResponse } from '../../utils/response';

const sendCsv = (res: Response, filename: string, csv: string) => {
  res.setHeader('Content-Type', 'text/csv; charset=utf-8');
  res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
  res.send('\uFEFF' + csv);
};

export const getStats = async (req: Request, res: Response): Promise<void> => {
  try { successResponse(res, await adminService.getStats()); }
  catch (err) { errorResponse(res, (err as Error).message); }
};

export const getUsers = async (req: Request, res: Response): Promise<void> => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    const search = (req.query.search as string) || '';
    successResponse(res, await adminService.getUsers({ page, limit, search }));
  } catch (err) { errorResponse(res, (err as Error).message); }
};

export const getEnrollments = async (req: Request, res: Response): Promise<void> => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    const status = (req.query.status as string) || '';
    const search = (req.query.search as string) || '';
    successResponse(res, await adminService.getEnrollments({ page, limit, status, search }));
  } catch (err) { errorResponse(res, (err as Error).message); }
};

export const updateEnrollmentStatus = async (req: Request, res: Response): Promise<void> => {
  try {
    await adminService.updateEnrollmentStatus(req.params.id, req.body.status, req.body.staff_notes, req.user!.userId);
    successResponse(res, null, 'Cập nhật trạng thái thành công');
  } catch (err) { errorResponse(res, (err as Error).message); }
};

export const getExamSchedules = async (req: Request, res: Response): Promise<void> => {
  try { successResponse(res, await adminService.getExamSchedules()); }
  catch (err) { errorResponse(res, (err as Error).message); }
};

export const createExamSchedule = async (req: Request, res: Response): Promise<void> => {
  try {
    await adminService.createExamSchedule(req.body);
    successResponse(res, null, 'Tạo lịch thi thành công', 201);
  } catch (err) { errorResponse(res, (err as Error).message); }
};

export const getExamRooms = async (req: Request, res: Response): Promise<void> => {
  try {
    successResponse(res, await adminService.getExamRooms(req.params.id));
  } catch (err) { errorResponse(res, (err as Error).message); }
};

export const createExamRoom = async (req: Request, res: Response): Promise<void> => {
  try {
    const room = await adminService.createExamRoom(req.params.id, req.body);
    successResponse(res, room, 'Tao phong thi thanh cong', 201);
  } catch (err) { errorResponse(res, (err as Error).message); }
};

export const autoCreateExamRooms = async (req: Request, res: Response): Promise<void> => {
  try {
    const result = await adminService.autoCreateExamRooms(req.params.id, req.body);
    successResponse(res, result, 'Đã tạo phòng thi tự động');
  } catch (err) { errorResponse(res, (err as Error).message); }
};

export const autoAssignExamRooms = async (req: Request, res: Response): Promise<void> => {
  try {
    const result = await adminService.autoAssignExamRooms(req.params.id);
    successResponse(res, result, 'Da xep phong thi tu dong');
  } catch (err) { errorResponse(res, (err as Error).message); }
};

export const setupExamProcess = async (req: Request, res: Response): Promise<void> => {
  try {
    const result = await adminService.setupExamProcess(req.params.id, req.body);
    successResponse(res, result, 'Đã setup phòng thi, SBD, số túi và mã phách');
  } catch (err) { errorResponse(res, (err as Error).message); }
};

export const publishExamRooms = async (req: Request, res: Response): Promise<void> => {
  try {
    successResponse(res, await adminService.publishExamRooms(req.body.schedule_id), 'Da cong bo phong thi');
  } catch (err) { errorResponse(res, (err as Error).message); }
};

export const generateExamBagsAndAnonymousCodes = async (req: Request, res: Response): Promise<void> => {
  try {
    successResponse(res, await adminService.generateExamBagsAndAnonymousCodes(req.params.id), 'Da danh so tui va ma phach');
  } catch (err) { errorResponse(res, (err as Error).message); }
};

export const enterExamScore = async (req: Request, res: Response): Promise<void> => {
  try {
    const { registration_id, score, level_passed, pass_threshold } = req.body;
    await adminService.enterExamScore(registration_id, score, level_passed, req.user!.userId, pass_threshold);
    successResponse(res, null, 'Nhập điểm thành công');
  } catch (err) { errorResponse(res, (err as Error).message); }
};

export const saveExamScoreDraft = async (req: Request, res: Response): Promise<void> => {
  try {
    await adminService.saveExamScoreDraft(req.params.registrationId, req.body, req.user!.userId);
    successResponse(res, null, 'Đã lưu điểm nháp');
  } catch (err) { errorResponse(res, (err as Error).message); }
};

export const updateExamProcess = async (req: Request, res: Response): Promise<void> => {
  try {
    await adminService.updateExamProcess(req.params.registrationId, req.body, req.user!.userId);
    successResponse(res, null, 'Đã lưu quy trình thi');
  } catch (err) { errorResponse(res, (err as Error).message); }
};

export const syncExamScore = async (req: Request, res: Response): Promise<void> => {
  try {
    await adminService.syncExamScore(req.params.registrationId, req.user!.userId);
    successResponse(res, null, 'Đã đồng bộ điểm');
  } catch (err) { errorResponse(res, (err as Error).message); }
};

export const syncExamScoresBySchedule = async (req: Request, res: Response): Promise<void> => {
  try {
    successResponse(res, await adminService.syncExamScoresBySchedule(req.params.id, req.user!.userId, req.body.pass_threshold), 'Đã đồng bộ điểm theo kỳ thi');
  } catch (err) { errorResponse(res, (err as Error).message); }
};

export const getPrograms = async (req: Request, res: Response): Promise<void> => {
  try { successResponse(res, await adminService.getPrograms()); }
  catch (err) { errorResponse(res, (err as Error).message); }
};

export const createProgram = async (req: Request, res: Response): Promise<void> => {
  try {
    const program = await adminService.createProgram(req.body);
    successResponse(res, program, 'Tạo hệ đào tạo thành công', 201);
  } catch (err) { errorResponse(res, (err as Error).message); }
};

export const updateProgram = async (req: Request, res: Response): Promise<void> => {
  try {
    const program = await adminService.updateProgram(req.params.id, req.body);
    successResponse(res, program, 'Cập nhật hệ đào tạo thành công');
  } catch (err) { errorResponse(res, (err as Error).message); }
};

export const deleteProgram = async (req: Request, res: Response): Promise<void> => {
  try {
    await adminService.deleteProgram(req.params.id);
    successResponse(res, null, 'Vô hiệu hoá hệ đào tạo thành công');
  } catch (err) { errorResponse(res, (err as Error).message); }
};

export const getClasses = async (req: Request, res: Response): Promise<void> => {
  try {
    successResponse(res, await adminService.getClasses({
      status: (req.query.status as string) || '',
      language: (req.query.language as string) || '',
      level: (req.query.level as string) || '',
    }));
  } catch (err) { errorResponse(res, (err as Error).message); }
};

export const createClass = async (req: Request, res: Response): Promise<void> => {
  try {
    const klass = await adminService.createClass(req.body, req.user!.userId);
    successResponse(res, klass, 'Tạo lớp học thành công', 201);
  } catch (err) { errorResponse(res, (err as Error).message); }
};

export const updateClass = async (req: Request, res: Response): Promise<void> => {
  try {
    const klass = await adminService.updateClass(req.params.id, req.body);
    successResponse(res, klass, 'Cập nhật lớp học thành công');
  } catch (err) { errorResponse(res, (err as Error).message); }
};

export const getClassStudents = async (req: Request, res: Response): Promise<void> => {
  try {
    successResponse(res, await adminService.getClassStudents(req.params.id));
  } catch (err) { errorResponse(res, (err as Error).message); }
};

export const getEligibleClassEnrollments = async (req: Request, res: Response): Promise<void> => {
  try {
    successResponse(res, await adminService.getEligibleClassEnrollments(req.params.id, (req.query.search as string) || ''));
  } catch (err) { errorResponse(res, (err as Error).message); }
};

export const assignEnrollmentToClass = async (req: Request, res: Response): Promise<void> => {
  try {
    successResponse(res, await adminService.assignEnrollmentToClass(req.params.id, req.body.enrollment_id, req.user!.userId), 'Đã xếp học viên vào lớp');
  } catch (err) { errorResponse(res, (err as Error).message); }
};

export const autoAssignClassByLevel = async (req: Request, res: Response): Promise<void> => {
  try {
    successResponse(res, await adminService.autoAssignClassByLevel(req.params.id, req.user!.userId), 'Đã xếp lớp tự động theo cấp độ');
  } catch (err) { errorResponse(res, (err as Error).message); }
};

export const removeEnrollmentFromClass = async (req: Request, res: Response): Promise<void> => {
  try {
    await adminService.removeEnrollmentFromClass(req.params.id, req.params.enrollmentId, req.user!.userId);
    successResponse(res, null, 'Đã gỡ học viên khỏi lớp');
  } catch (err) { errorResponse(res, (err as Error).message); }
};

export const toggleUserActive = async (req: Request, res: Response): Promise<void> => {
  try {
    const result = await adminService.toggleUserActive(req.params.id);
    successResponse(res, result, result.is_active ? 'Đã kích hoạt tài khoản' : 'Đã khóa tài khoản');
  } catch (err) { errorResponse(res, (err as Error).message); }
};

export const changeUserRole = async (req: Request, res: Response): Promise<void> => {
  try {
    const user = await adminService.changeUserRole(req.params.id, req.body.role);
    successResponse(res, user, 'Đã thay đổi vai trò');
  } catch (err) { errorResponse(res, (err as Error).message); }
};

export const exportEnrollments = async (req: Request, res: Response): Promise<void> => {
  try {
    const csv = await adminService.exportEnrollments();
    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', 'attachment; filename="enrollments.csv"');
    res.send('﻿' + csv);
  } catch (err) { errorResponse(res, (err as Error).message); }
};

export const exportUsers = async (req: Request, res: Response): Promise<void> => {
  try {
    const csv = await adminService.exportUsers();
    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', 'attachment; filename="users.csv"');
    res.send('﻿' + csv);
  } catch (err) { errorResponse(res, (err as Error).message); }
};

export const exportPrograms = async (_req: Request, res: Response): Promise<void> => {
  try {
    sendCsv(res, 'programs.csv', await adminService.exportPrograms());
  } catch (err) { errorResponse(res, (err as Error).message); }
};

export const exportExamSchedules = async (_req: Request, res: Response): Promise<void> => {
  try {
    sendCsv(res, 'exam-schedules.csv', await adminService.exportExamSchedules());
  } catch (err) { errorResponse(res, (err as Error).message); }
};

export const exportExamScores = async (req: Request, res: Response): Promise<void> => {
  try {
    const scheduleId = (req.query.scheduleId as string) || '';
    sendCsv(res, 'exam-scores.csv', await adminService.exportExamScores(scheduleId));
  } catch (err) { errorResponse(res, (err as Error).message); }
};

export const importUsers = async (req: Request, res: Response): Promise<void> => {
  try {
    successResponse(res, await adminService.importUsers(req.file), 'Import người dùng thành công');
  } catch (err) { errorResponse(res, (err as Error).message); }
};

export const importPrograms = async (req: Request, res: Response): Promise<void> => {
  try {
    successResponse(res, await adminService.importPrograms(req.file), 'Import chương trình thành công');
  } catch (err) { errorResponse(res, (err as Error).message); }
};

export const importExamSchedules = async (req: Request, res: Response): Promise<void> => {
  try {
    successResponse(res, await adminService.importExamSchedules(req.file), 'Import lịch thi thành công');
  } catch (err) { errorResponse(res, (err as Error).message); }
};

export const importExamScores = async (req: Request, res: Response): Promise<void> => {
  try {
    const scheduleId = (req.body.schedule_id as string) || '';
    successResponse(res, await adminService.importExamScores(req.file, scheduleId, req.user!.userId), 'Import điểm thi thành công');
  } catch (err) { errorResponse(res, (err as Error).message); }
};

export const closeExamSchedule = async (req: Request, res: Response): Promise<void> => {
  try {
    await adminService.closeExamSchedule(req.params.id);
    successResponse(res, null, 'Đã đóng lịch thi');
  } catch (err) { errorResponse(res, (err as Error).message); }
};

export const getExamRegistrations = async (req: Request, res: Response): Promise<void> => {
  try {
    const scheduleId = (req.query.scheduleId as string) || '';
    const regs = await adminService.getExamRegistrations({ scheduleId });
    successResponse(res, regs);
  } catch (err) { errorResponse(res, (err as Error).message); }
};

export const getEligibleExamEnrollments = async (req: Request, res: Response): Promise<void> => {
  try {
    const scheduleId = req.params.id;
    const search = (req.query.search as string) || '';
    const enrollments = await adminService.getEligibleExamEnrollments(scheduleId, search);
    successResponse(res, enrollments);
  } catch (err) { errorResponse(res, (err as Error).message); }
};

export const assignEnrollmentToExam = async (req: Request, res: Response): Promise<void> => {
  try {
    await adminService.assignEnrollmentToExam(req.params.id, req.body.enrollment_id, req.user!.userId);
    successResponse(res, null, 'Đã thêm thí sinh vào kỳ thi');
  } catch (err) { errorResponse(res, (err as Error).message); }
};

export const assignEnrollmentsByExamDate = async (req: Request, res: Response): Promise<void> => {
  try {
    const result = await adminService.assignEnrollmentsByExamDate(req.params.id, req.user!.userId);
    successResponse(res, result, 'Đã thêm thí sinh theo ngày thi');
  } catch (err) { errorResponse(res, (err as Error).message); }
};

export const enterExamScoreForReg = async (req: Request, res: Response): Promise<void> => {
  try {
    const { score, level_passed, pass_threshold } = req.body;
    await adminService.enterExamScore(req.params.registrationId, score, level_passed, req.user!.userId, pass_threshold);
    successResponse(res, null, 'Nhập điểm thành công');
  } catch (err) { errorResponse(res, (err as Error).message); }
};

export const getEnrollmentLogs = async (req: Request, res: Response): Promise<void> => {
  try {
    const logs = await adminService.getEnrollmentLogs(req.params.id);
    successResponse(res, logs);
  } catch (err) { errorResponse(res, (err as Error).message); }
};

export const broadcastNotification = async (req: Request, res: Response): Promise<void> => {
  try {
    const { title, message, type, link, role } = req.body;
    const result = await adminService.broadcastNotification(title, message, type || 'info', link, role);
    successResponse(res, result, `Đã gửi thông báo đến ${result.sent} người dùng`);
  } catch (err) { errorResponse(res, (err as Error).message); }
};

export const getRechecks = async (req: Request, res: Response): Promise<void> => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;
    const status = (req.query.status as string) || '';
    successResponse(res, await adminService.getRechecks({ page, limit, status }));
  } catch (err) { errorResponse(res, (err as Error).message); }
};

export const resolveRecheck = async (req: Request, res: Response): Promise<void> => {
  try {
    const { status, admin_note } = req.body;
    const recheck = await adminService.resolveRecheck(req.params.id, status, admin_note || '', req.user!.userId);
    successResponse(res, recheck, 'Cập nhật phúc khảo thành công');
  } catch (err) { errorResponse(res, (err as Error).message); }
};
export const getInterviews = async (req: Request, res: Response): Promise<void> => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;
    const status = (req.query.status as string) || '';
    successResponse(res, await adminService.getInterviews({ page, limit, status }));
  } catch (err) { errorResponse(res, (err as Error).message); }
};

export const createInterview = async (req: Request, res: Response): Promise<void> => {
  try {
    const interview = await adminService.createInterview(req.body, req.user!.userId);
    successResponse(res, interview, 'Tạo lịch phỏng vấn thành công', 201);
  } catch (err) { errorResponse(res, (err as Error).message); }
};

export const updateInterviewStatus = async (req: Request, res: Response): Promise<void> => {
  try {
    const interview = await adminService.updateInterviewStatus(req.params.id, req.body.status);
    successResponse(res, interview, 'Cập nhật lịch phỏng vấn thành công');
  } catch (err) { errorResponse(res, (err as Error).message); }
};

export const getInvoices = async (req: Request, res: Response): Promise<void> => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;
    const status = (req.query.status as string) || '';
    successResponse(res, await adminService.getInvoices({ page, limit, status }));
  } catch (err) { errorResponse(res, (err as Error).message); }
};

export const updateInvoiceStatus = async (req: Request, res: Response): Promise<void> => {
  try {
    const invoice = await adminService.updateInvoiceStatus(req.params.id, req.body.status);
    successResponse(res, invoice, 'Cập nhật hóa đơn thành công');
  } catch (err) { errorResponse(res, (err as Error).message); }
};

export const getBanners = async (_req: Request, res: Response): Promise<void> => {
  try { successResponse(res, await adminService.getBanners()); }
  catch (err) { errorResponse(res, (err as Error).message); }
};

export const createBanner = async (req: Request, res: Response): Promise<void> => {
  try { successResponse(res, await adminService.createBanner(req.body), 'Tạo banner thành công', 201); }
  catch (err) { errorResponse(res, (err as Error).message); }
};

export const updateBanner = async (req: Request, res: Response): Promise<void> => {
  try { successResponse(res, await adminService.updateBanner(req.params.id, req.body), 'Cập nhật banner thành công'); }
  catch (err) { errorResponse(res, (err as Error).message); }
};

export const deleteBanner = async (req: Request, res: Response): Promise<void> => {
  try {
    await adminService.deleteBanner(req.params.id);
    successResponse(res, null, 'Đã ẩn banner');
  } catch (err) { errorResponse(res, (err as Error).message); }
};

export const getNews = async (_req: Request, res: Response): Promise<void> => {
  try { successResponse(res, await adminService.getNews()); }
  catch (err) { errorResponse(res, (err as Error).message); }
};

export const createNews = async (req: Request, res: Response): Promise<void> => {
  try { successResponse(res, await adminService.createNews(req.body), 'Tạo tin tức thành công', 201); }
  catch (err) { errorResponse(res, (err as Error).message); }
};

export const updateNews = async (req: Request, res: Response): Promise<void> => {
  try { successResponse(res, await adminService.updateNews(req.params.id, req.body), 'Cập nhật tin tức thành công'); }
  catch (err) { errorResponse(res, (err as Error).message); }
};

export const deleteNews = async (req: Request, res: Response): Promise<void> => {
  try {
    await adminService.deleteNews(req.params.id);
    successResponse(res, null, 'Đã lưu trữ tin tức');
  } catch (err) { errorResponse(res, (err as Error).message); }
};

export const getConfigs = async (_req: Request, res: Response): Promise<void> => {
  try { successResponse(res, await adminService.getConfigs()); }
  catch (err) { errorResponse(res, (err as Error).message); }
};

export const upsertConfig = async (req: Request, res: Response): Promise<void> => {
  try { successResponse(res, await adminService.upsertConfig(req.body, req.user!.userId), 'Lưu cấu hình thành công'); }
  catch (err) { errorResponse(res, (err as Error).message); }
};
