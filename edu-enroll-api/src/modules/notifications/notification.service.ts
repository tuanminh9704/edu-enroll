import mongoose from 'mongoose';
import { Notification } from '../../models/Notification';
import { User } from '../../models/User';
import { config } from '../../configs';
import { emailService } from './email.service';

export const notificationService = {
  async create(userId: string, title: string, message: string, type: 'info' | 'success' | 'warning' | 'error' = 'info', link?: string, sendEmail = false) {
    const notification = await Notification.create({ user_id: new mongoose.Types.ObjectId(userId), title, message, type, link });
    const shouldSendEmail = sendEmail || link === '/ho-so';
    if (shouldSendEmail) {
      void (async () => {
        try {
          const user = await User.findById(userId).select('email').lean();
          if (!user?.email) return;
          const url = link?.startsWith('http') ? link : `${config.frontendUrl}${link || ''}`;
          await emailService.sendNotification(user.email, title, message, link ? url : undefined);
        } catch (err) {
          console.error('[NOTIFY][EMAIL_BACKGROUND_FAILED]', (err as Error).message);
        }
      })();
    }
    return notification;
  },

  async createForRoles(roles: Array<'student' | 'staff' | 'admin' | 'super_admin'>, title: string, message: string, type: 'info' | 'success' | 'warning' | 'error' = 'info', link?: string) {
    const users = await User.find({ role: { $in: roles }, is_active: true }).select('_id').lean();
    await Promise.all(users.map((user) => this.create(user._id.toString(), title, message, type, link)));
    return { sent: users.length };
  },

  async getForUser(userId: string, page = 1, limit = 20) {
    const filter = { user_id: new mongoose.Types.ObjectId(userId) };
    const [docs, total, unread] = await Promise.all([
      Notification.find(filter).sort({ created_at: -1 }).skip((page - 1) * limit).limit(limit).lean(),
      Notification.countDocuments(filter),
      Notification.countDocuments({ ...filter, is_read: false }),
    ]);
    const data = docs.map((d) => ({ ...d, id: d._id.toString() }));
    return { data, total, unread, page, limit };
  },

  async markRead(userId: string, notificationId: string) {
    await Notification.updateOne(
      { _id: new mongoose.Types.ObjectId(notificationId), user_id: new mongoose.Types.ObjectId(userId) },
      { is_read: true }
    );
  },

  async markAllRead(userId: string) {
    await Notification.updateMany({ user_id: new mongoose.Types.ObjectId(userId), is_read: false }, { is_read: true });
  },

  async getUnreadCount(userId: string) {
    return Notification.countDocuments({ user_id: new mongoose.Types.ObjectId(userId), is_read: false });
  },
};
