import { useEffect, useState, useCallback } from 'react';
import { Card, List, Badge, Button, Empty, Spin, Tag } from 'antd';
import { BellOutlined, CheckOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';
import 'dayjs/locale/vi';
import { notificationService } from '../../services/notification.service';
import type { Notification } from '../../types';

dayjs.extend(relativeTime);
dayjs.locale('vi');

const TYPE_COLORS: Record<string, string> = {
  success: 'success',
  warning: 'warning',
  error: 'error',
  info: 'processing',
};

const TYPE_LABELS: Record<string, string> = {
  success: 'Thành công',
  warning: 'Cảnh báo',
  error: 'Lỗi',
  info: 'Thông tin',
};

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [markingAll, setMarkingAll] = useState(false);
  const [unread, setUnread] = useState(0);
  const navigate = useNavigate();

  const load = useCallback(async () => {
    try {
      const data = await notificationService.getAll(1, 50);
      setNotifications(data.data);
      setUnread(data.unread);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const handleMarkRead = async (n: Notification) => {
    if (!n.is_read) {
      await notificationService.markRead(n.id);
      setNotifications((prev) => prev.map((x) => x.id === n.id ? { ...x, is_read: true } : x));
      setUnread((c) => Math.max(0, c - 1));
    }
    if (n.link) navigate(n.link);
  };

  const handleMarkAllRead = async () => {
    setMarkingAll(true);
    try {
      await notificationService.markAllRead();
      setNotifications((prev) => prev.map((x) => ({ ...x, is_read: true })));
      setUnread(0);
    } finally {
      setMarkingAll(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto py-8 px-4">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <BellOutlined />
            Thông báo
            {unread > 0 && (
              <Badge count={unread} style={{ backgroundColor: '#4f46e5' }} />
            )}
          </h1>
          <p className="text-gray-500 mt-1 text-sm">Cập nhật về hồ sơ tuyển sinh của bạn</p>
        </div>
        {unread > 0 && (
          <Button
            icon={<CheckOutlined />}
            onClick={handleMarkAllRead}
            loading={markingAll}
          >
            Đánh dấu tất cả đã đọc
          </Button>
        )}
      </div>

      <Card className="border-0 shadow-md rounded-2xl">
        {loading ? (
          <div className="flex justify-center py-12">
            <Spin size="large" />
          </div>
        ) : notifications.length === 0 ? (
          <Empty
            image={Empty.PRESENTED_IMAGE_SIMPLE}
            description="Chưa có thông báo nào"
            className="py-12"
          />
        ) : (
          <List
            dataSource={notifications}
            renderItem={(item) => (
              <List.Item
                className={`cursor-pointer transition-colors rounded-lg px-3 ${item.is_read ? '' : 'bg-indigo-50'}`}
                onClick={() => handleMarkRead(item)}
              >
                <div className="w-full">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2">
                      {!item.is_read && (
                        <span className="w-2 h-2 rounded-full bg-indigo-500 mt-1 shrink-0" />
                      )}
                      <span className={`font-medium text-gray-900 ${item.is_read ? 'ml-4' : ''}`}>
                        {item.title}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <Tag color={TYPE_COLORS[item.type]}>{TYPE_LABELS[item.type]}</Tag>
                      <span className="text-xs text-gray-400">
                        {dayjs(item.created_at).fromNow()}
                      </span>
                    </div>
                  </div>
                  <p className={`text-sm text-gray-500 mt-1 ${item.is_read ? 'ml-4' : 'ml-4'}`}>
                    {item.message}
                  </p>
                </div>
              </List.Item>
            )}
          />
        )}
      </Card>
    </div>
  );
}
