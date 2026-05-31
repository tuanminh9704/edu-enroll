import crypto from 'crypto';
import { config } from '../../configs';

type CloudinaryUploadResult = {
  public_id: string;
  secure_url: string;
  resource_type: string;
  original_filename?: string;
};

const buildSignature = (params: Record<string, string | number>) => {
  const signData = Object.keys(params)
    .sort()
    .map((key) => `${key}=${params[key]}`)
    .join('&');
  return crypto.createHash('sha1').update(`${signData}${config.cloudinary.apiSecret}`).digest('hex');
};

export const uploadToCloudinary = async (file: Express.Multer.File): Promise<CloudinaryUploadResult> => {
  if (!config.cloudinary.cloudName || !config.cloudinary.apiKey || !config.cloudinary.apiSecret) {
    throw new Error('Cloudinary is not configured');
  }

  const timestamp = Math.floor(Date.now() / 1000);
  const folder = config.cloudinary.folder;
  const params = { folder, timestamp };
  const signature = buildSignature(params);

  const form = new FormData();
  form.append('file', new Blob([file.buffer], { type: file.mimetype }), file.originalname);
  form.append('api_key', config.cloudinary.apiKey);
  form.append('timestamp', String(timestamp));
  form.append('folder', folder);
  form.append('signature', signature);

  const res = await fetch(`https://api.cloudinary.com/v1_1/${config.cloudinary.cloudName}/auto/upload`, {
    method: 'POST',
    body: form,
  });

  const data = await res.json() as CloudinaryUploadResult & { error?: { message?: string } };
  if (!res.ok) {
    throw new Error(data.error?.message || 'Upload Cloudinary thất bại');
  }

  return data;
};
