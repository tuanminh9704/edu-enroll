import { NavLink } from 'react-router-dom';
import {
  Bell,
  BookOpen,
  CalendarDays,
  ClipboardCheck,
  FileText,
  Gauge,
  GraduationCap,
  MessageSquare,
  Receipt,
  School,
  Settings,
  Trophy,
  Users,
} from 'lucide-react';
import { cn } from '@/lib/utils';

const menuItems = [
  { to: '/quan-tri', icon: Gauge, label: 'Dashboard', end: true },
  { to: '/quan-tri/ho-so', icon: FileText, label: 'Hồ sơ tuyển sinh' },
  { to: '/quan-tri/nguoi-dung', icon: Users, label: 'Người dùng' },
  { to: '/quan-tri/ky-thi', icon: CalendarDays, label: 'Lịch thi' },
  { to: '/quan-tri/diem-thi', icon: Trophy, label: 'Nhập điểm thi' },
  { to: '/quan-tri/xem-diem-thi', icon: ClipboardCheck, label: 'Xem điểm thi' },
  { to: '/quan-tri/phuc-khao', icon: ClipboardCheck, label: 'Phúc khảo' },
  { to: '/quan-tri/phong-van', icon: MessageSquare, label: 'Phỏng vấn' },
  { to: '/quan-tri/hoa-don', icon: Receipt, label: 'Hóa đơn' },
  { to: '/quan-tri/chuong-trinh', icon: BookOpen, label: 'Chương trình' },
  { to: '/quan-tri/lop-hoc', icon: School, label: 'Lớp học' },
  { to: '/quan-tri/thong-bao', icon: Bell, label: 'Gửi thông báo' },
  { to: '/quan-tri/noi-dung', icon: Settings, label: 'Nội dung' },
];

export const AdminSidebar = () => {
  return (
    <aside className="hidden min-h-screen w-72 shrink-0 border-r border-border bg-card/95 lg:block">
      <div className="sticky top-0 flex h-screen flex-col">
        <div className="border-b border-border px-5 py-4">
          <div className="flex items-center gap-3">
            <span className="flex size-11 items-center justify-center rounded-2xl bg-primary text-primary-foreground">
              <GraduationCap className="size-5" />
            </span>
            <div>
              <div className="font-bold leading-none text-primary">Apex</div>
              <div className="text-xs font-medium text-muted-foreground">Admin Console</div>
            </div>
          </div>
        </div>

        <nav className="flex-1 space-y-1 overflow-y-auto px-3 py-4">
          {menuItems.map(({ to, icon: Icon, label, end }) => (
            <NavLink
              key={to}
              to={to}
              end={end}
              className={({ isActive }) =>
                cn(
                  'flex items-center gap-3 rounded-full px-4 py-2.5 text-sm font-medium no-underline transition-colors',
                  isActive
                    ? 'bg-primary-container text-on-primary-container'
                    : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground',
                )
              }
            >
              <Icon className="size-4" />
              <span className="truncate">{label}</span>
            </NavLink>
          ))}
        </nav>

        <div className="border-t border-border px-5 py-4 text-xs text-muted-foreground">
          Design system: shadcn/ui + Material 3 tokens
        </div>
      </div>
    </aside>
  );
};

export { menuItems };
