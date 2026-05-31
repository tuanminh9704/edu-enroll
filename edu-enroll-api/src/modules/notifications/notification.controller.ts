import { Request, Response } from 'express';
import { notificationService } from './notification.service';
import { successResponse, errorResponse } from '../../utils/response';

export const getNotifications = async (req: Request, res: Response): Promise<void> => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;
    successResponse(res, await notificationService.getForUser(req.user!.userId, page, limit));
  } catch (err) { errorResponse(res, (err as Error).message); }
};

export const markRead = async (req: Request, res: Response): Promise<void> => {
  try {
    await notificationService.markRead(req.user!.userId, req.params.id);
    successResponse(res, null, 'Đã đánh dấu đã đọc');
  } catch (err) { errorResponse(res, (err as Error).message); }
};

export const markAllRead = async (req: Request, res: Response): Promise<void> => {
  try {
    await notificationService.markAllRead(req.user!.userId);
    successResponse(res, null, 'Đã đọc tất cả thông báo');
  } catch (err) { errorResponse(res, (err as Error).message); }
};

export const getUnreadCount = async (req: Request, res: Response): Promise<void> => {
  try {
    const count = await notificationService.getUnreadCount(req.user!.userId);
    successResponse(res, { count });
  } catch (err) { errorResponse(res, (err as Error).message); }
};
