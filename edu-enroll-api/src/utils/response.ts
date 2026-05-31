import { Response } from 'express';

export const successResponse = (
  res: Response,
  data: unknown = null,
  message = 'Thành công',
  status = 200
) => {
  return res.status(status).json({ success: true, message, data });
};

export const errorResponse = (
  res: Response,
  message = 'Có lỗi xảy ra',
  status = 400,
  errors: unknown = null
) => {
  return res.status(status).json({ success: false, message, errors });
};
