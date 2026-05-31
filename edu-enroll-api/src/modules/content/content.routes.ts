import { Router } from 'express';
import { Banner } from '../../models/Banner';
import { News } from '../../models/News';
import { successResponse, errorResponse } from '../../utils/response';

const router = Router();

router.get('/banners', async (_req, res) => {
  try {
    const banners = await Banner.find({ is_active: true }).sort({ sort_order: 1, created_at: -1 }).lean();
    successResponse(res, banners);
  } catch (err) { errorResponse(res, (err as Error).message); }
});

router.get('/news', async (req, res) => {
  try {
    const limit = parseInt(req.query.limit as string) || 10;
    const news = await News.find({ status: 'published' }).sort({ published_at: -1, created_at: -1 }).limit(limit).lean();
    successResponse(res, news);
  } catch (err) { errorResponse(res, (err as Error).message); }
});

router.get('/news/:slug', async (req, res) => {
  try {
    const news = await News.findOne({ slug: req.params.slug, status: 'published' }).lean();
    if (!news) { errorResponse(res, 'Tin tức không tồn tại', 404); return; }
    successResponse(res, news);
  } catch (err) { errorResponse(res, (err as Error).message); }
});

export default router;
