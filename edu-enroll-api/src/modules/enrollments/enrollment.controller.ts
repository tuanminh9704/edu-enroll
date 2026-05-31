import { Request, Response } from 'express';
import { enrollmentService } from './enrollment.service';
import { RecheckRequest } from '../../models/RecheckRequest';
import { ExamRegistration } from '../../models/ExamRegistration';
import { Interview } from '../../models/Interview';
import { Invoice } from '../../models/Invoice';
import { successResponse, errorResponse } from '../../utils/response';

export const getMyEnrollment = async (req: Request, res: Response): Promise<void> => {
  try {
    const enrollment = await enrollmentService.initEnrollment(req.user!.userId);
    successResponse(res, enrollment);
  } catch (err) { errorResponse(res, (err as Error).message); }
};

export const signPolicy = async (req: Request, res: Response): Promise<void> => {
  try {
    const ip = req.ip || req.socket.remoteAddress || 'unknown';
    await enrollmentService.initEnrollment(req.user!.userId);
    await enrollmentService.signPolicy(req.user!.userId, req.body.signature_data, ip);
    successResponse(res, null, 'Ký chính sách thành công');
  } catch (err) { errorResponse(res, (err as Error).message); }
};

export const getPaymentUrl = async (req: Request, res: Response): Promise<void> => {
  try {
    const enrollment = await enrollmentService.initEnrollment(req.user!.userId);
    if (enrollment.current_step < 2) throw new Error('Vui lòng ký chính sách trước');
    const url = enrollmentService.getPaymentUrl(req.user!.userId, (enrollment._id as unknown as { toString(): string }).toString());
    successResponse(res, { url });
  } catch (err) { errorResponse(res, (err as Error).message); }
};

export const submitForm = async (req: Request, res: Response): Promise<void> => {
  try {
    await enrollmentService.submitForm(req.user!.userId, req.body);
    successResponse(res, null, 'Điền hồ sơ thành công');
  } catch (err) { errorResponse(res, (err as Error).message); }
};

export const getExamSchedules = async (req: Request, res: Response): Promise<void> => {
  try {
    const language = req.query.language as string;
    if (!language) { errorResponse(res, 'Vui lòng cung cấp ngôn ngữ', 400); return; }
    const schedules = await enrollmentService.getExamSchedules(language);
    successResponse(res, schedules);
  } catch (err) { errorResponse(res, (err as Error).message); }
};

export const registerExam = async (req: Request, res: Response): Promise<void> => {
  try {
    await enrollmentService.registerExam(req.user!.userId, req.body.schedule_id);
    successResponse(res, null, 'Đăng ký thi thành công');
  } catch (err) { errorResponse(res, (err as Error).message); }
};

export const skipExam = async (req: Request, res: Response): Promise<void> => {
  try {
    await enrollmentService.skipExam(req.user!.userId);
    successResponse(res, null, 'Đã bỏ qua bước kiểm tra năng lực');
  } catch (err) { errorResponse(res, (err as Error).message); }
};

export const getExamResult = async (req: Request, res: Response): Promise<void> => {
  try {
    const result = await enrollmentService.getExamResult(req.user!.userId);
    successResponse(res, result);
  } catch (err) { errorResponse(res, (err as Error).message); }
};

export const advanceToStep5 = async (req: Request, res: Response): Promise<void> => {
  try {
    await enrollmentService.advanceToStep5(req.user!.userId);
    successResponse(res, null, 'Tiến đến bước chọn hệ đào tạo');
  } catch (err) { errorResponse(res, (err as Error).message); }
};

export const getAvailablePrograms = async (req: Request, res: Response): Promise<void> => {
  try {
    await enrollmentService.initEnrollment(req.user!.userId);
    const programs = await enrollmentService.getAvailablePrograms(req.user!.userId);
    successResponse(res, programs);
  } catch (err) { errorResponse(res, (err as Error).message); }
};

export const selectProgram = async (req: Request, res: Response): Promise<void> => {
  try {
    await enrollmentService.selectProgram(req.user!.userId, req.body.program_id);
    successResponse(res, null, 'Chọn hệ đào tạo thành công');
  } catch (err) { errorResponse(res, (err as Error).message); }
};

export const submitOriginalDocs = async (req: Request, res: Response): Promise<void> => {
  try {
    const result = await enrollmentService.submitOriginalDocs(req.user!.userId, req.body);
    successResponse(res, result, 'Đăng ký tuyển sinh hoàn tất thành công!');
  } catch (err) { errorResponse(res, (err as Error).message); }
};

export const submitRecheck = async (req: Request, res: Response): Promise<void> => {
  try {
    const { reason } = req.body;
    if (!reason?.trim()) { errorResponse(res, 'Vui lòng cung cấp lý do phúc khảo', 400); return; }
    const enrollment = await enrollmentService.getMyEnrollment(req.user!.userId);
    if (!enrollment) { errorResponse(res, 'Hồ sơ không tồn tại', 404); return; }
    const reg = await ExamRegistration.findOne({ user_id: req.user!.userId }).sort({ created_at: -1 });
    if (!reg) { errorResponse(res, 'Không tìm thấy đăng ký thi', 404); return; }
    const existing = await RecheckRequest.findOne({ user_id: req.user!.userId, registration_id: reg._id, status: { $in: ['pending', 'reviewing'] } });
    if (existing) { errorResponse(res, 'Bạn đã có yêu cầu phúc khảo đang chờ xử lý', 400); return; }
    const recheck = await RecheckRequest.create({
      user_id: req.user!.userId,
      enrollment_id: enrollment._id,
      registration_id: reg._id,
      reason: reason.trim(),
    });
    successResponse(res, recheck, 'Gửi yêu cầu phúc khảo thành công', 201);
  } catch (err) { errorResponse(res, (err as Error).message); }
};

export const getMyRecheck = async (req: Request, res: Response): Promise<void> => {
  try {
    const recheck = await RecheckRequest.findOne({ user_id: req.user!.userId }).sort({ created_at: -1 });
    successResponse(res, recheck);
  } catch (err) { errorResponse(res, (err as Error).message); }
};

export const getMyInterviews = async (req: Request, res: Response): Promise<void> => {
  try {
    const interviews = await Interview.find({ user_id: req.user!.userId }).sort({ scheduled_at: 1 }).lean();
    successResponse(res, interviews);
  } catch (err) { errorResponse(res, (err as Error).message); }
};

export const respondInterview = async (req: Request, res: Response): Promise<void> => {
  try {
    const status = req.body.status;
    if (!['confirmed', 'declined'].includes(status)) {
      errorResponse(res, 'Trạng thái xác nhận không hợp lệ', 400);
      return;
    }
    const interview = await Interview.findOneAndUpdate(
      { _id: req.params.id, user_id: req.user!.userId },
      { status },
      { new: true }
    );
    if (!interview) { errorResponse(res, 'Lịch phỏng vấn không tồn tại', 404); return; }
    successResponse(res, interview, 'Đã cập nhật xác nhận phỏng vấn');
  } catch (err) { errorResponse(res, (err as Error).message); }
};

export const getMyInvoices = async (req: Request, res: Response): Promise<void> => {
  try {
    const invoices = await Invoice.find({ user_id: req.user!.userId }).sort({ issued_at: -1 }).lean();
    successResponse(res, invoices);
  } catch (err) { errorResponse(res, (err as Error).message); }
};
