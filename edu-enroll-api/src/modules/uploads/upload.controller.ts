import { Request, Response } from 'express';
import { successResponse, errorResponse } from '../../utils/response';
import { uploadToCloudinary } from './upload.service';

export const uploadFile = async (req: Request, res: Response): Promise<void> => {
  try {
    if (!req.file) {
      errorResponse(res, 'Vui lòng chọn file upload', 400);
      return;
    }
    const result = await uploadToCloudinary(req.file);
    successResponse(res, {
      public_id: result.public_id,
      secure_url: result.secure_url,
      resource_type: result.resource_type,
      original_filename: result.original_filename,
    }, 'Upload file thành công', 201);
  } catch (err) {
    errorResponse(res, (err as Error).message);
  }
};
