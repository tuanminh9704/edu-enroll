import { Router } from 'express';
import { authenticate } from '../../middlewares/auth.middleware';
import * as controller from './notification.controller';

const router = Router();
router.use(authenticate);

router.get('/', controller.getNotifications);
router.get('/unread-count', controller.getUnreadCount);
router.patch('/:id/read', controller.markRead);
router.patch('/read-all', controller.markAllRead);

export default router;
