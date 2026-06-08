import { Request, Response, NextFunction } from 'express';
import { ZodSchema } from 'zod';
import { errorResponse } from '../utils/response';

export const validate = (schema: ZodSchema) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    const result = schema.safeParse(req.body);
    if (!result.success) {
      const errors = result.error.errors.map((e) => ({
        field: e.path.join('.'),
        message: e.message,
      }));
      const message = errors.length
        ? `Dữ liệu không hợp lệ: ${errors.map((e) => e.message).join('; ')}`
        : 'Dữ liệu không hợp lệ';
      errorResponse(res, message, 400, errors);
      return;
    }
    req.body = result.data;
    next();
  };
};
