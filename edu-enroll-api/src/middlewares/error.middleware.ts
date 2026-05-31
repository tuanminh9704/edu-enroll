import { Request, Response, NextFunction } from 'express';

export const errorMiddleware = (
  err: Error,
  req: Request,
  res: Response,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  _next: NextFunction
): void => {
  console.error('[Error]', err.message, err.stack);
  res.status(500).json({
    success: false,
    message: 'Lỗi máy chủ nội bộ',
    errors: process.env.NODE_ENV === 'development' ? err.message : null,
  });
};
