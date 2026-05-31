import { useEffect, useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Bell,
  FileText,
  GraduationCap,
  LayoutDashboard,
  LogOut,
  Menu,
  ShieldCheck,
  User,
  X,
} from 'lucide-react';
import { message } from 'antd';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { useAuthStore } from '../../store/auth.store';
import { authService } from '../../services/auth.service';
import { notificationService } from '../../services/notification.service';

export const Navbar = () => {
  const { isAuthenticated, user, logout } = useAuthStore();
  const navigate = useNavigate();
  const menuRef = useRef<HTMLDivElement>(null);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [accountOpen, setAccountOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    if (!isAuthenticated) return;

    let cancelled = false;
    const fetchCount = async () => {
      try {
        const count = await notificationService.getUnreadCount();
        if (!cancelled) setUnreadCount(count);
      } catch {
        // ignore notification counter failures in navigation
      }
    };

    fetchCount();
    const interval = setInterval(fetchCount, 60000);

    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, [isAuthenticated]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setAccountOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleLogout = async () => {
    try {
      await authService.logout();
      message.success('Đăng xuất thành công');
    } catch {
      // local logout still needs to happen if the server session is already invalid
    } finally {
      logout();
      navigate('/');
    }
  };

  const navLinks = [
    { to: '/', label: 'Trang chủ' },
    { to: '/#courses', label: 'Khóa học' },
    { to: '/#about', label: 'Về chúng tôi' },
    { to: '/#contact', label: 'Liên hệ' },
  ];

  const accountLinks = [
    { to: '/ho-so-ca-nhan', label: 'Hồ sơ cá nhân', icon: User },
    { to: '/tai-khoan', label: 'Tài khoản của tôi', icon: LayoutDashboard },
    { to: '/ho-so', label: 'Hồ sơ tuyển sinh', icon: FileText },
    ...(user?.role === 'admin' || user?.role === 'super_admin'
      ? [{ to: '/quan-tri', label: 'Quản trị', icon: ShieldCheck }]
      : []),
  ];

  return (
    <nav className="sticky top-0 z-50 border-b border-border/80 bg-card/90 backdrop-blur-xl">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between gap-4">
          <Link to="/" className="flex items-center gap-3 no-underline">
            <span className="flex size-10 items-center justify-center rounded-2xl bg-primary text-primary-foreground shadow-sm">
              <GraduationCap className="size-5" />
            </span>
            <span>
              <span className="block text-lg font-bold leading-none text-primary">Apex</span>
              <span className="block text-xs font-medium leading-none text-muted-foreground">Trung tâm ngôn ngữ</span>
            </span>
          </Link>

          <div className="hidden items-center gap-1 md:flex">
            {navLinks.map((link) => (
              <Button key={link.to} asChild variant="ghost" size="sm">
                <Link to={link.to}>{link.label}</Link>
              </Button>
            ))}
          </div>

          <div className="hidden items-center gap-2 md:flex">
            {isAuthenticated && user ? (
              <>
                <Button
                  variant="ghost"
                  size="icon"
                  aria-label="Thông báo"
                  onClick={() => navigate('/thong-bao')}
                  className="relative"
                >
                  <Bell className="size-5" />
                  {unreadCount > 0 && (
                    <Badge className="absolute -right-1 -top-1 px-1.5 py-0 text-[10px]">
                      {unreadCount}
                    </Badge>
                  )}
                </Button>

                <div ref={menuRef} className="relative">
                  <button
                    type="button"
                    className="flex items-center gap-2 rounded-full px-2 py-1.5 text-sm font-medium text-foreground transition-colors hover:bg-accent"
                    onClick={() => setAccountOpen((open) => !open)}
                  >
                    <span className="flex size-9 items-center justify-center rounded-full bg-primary-container text-on-primary-container">
                      <User className="size-4" />
                    </span>
                    <span className="max-w-44 truncate">{user.full_name || user.email}</span>
                  </button>

                  {accountOpen && (
                    <div className="absolute right-0 mt-2 w-64 rounded-3xl border border-border bg-popover p-2 text-popover-foreground shadow-lg">
                      {accountLinks.map(({ to, label, icon: Icon }) => (
                        <Link
                          key={to}
                          to={to}
                          className="flex items-center gap-3 rounded-2xl px-3 py-2.5 text-sm font-medium no-underline hover:bg-accent"
                          onClick={() => setAccountOpen(false)}
                        >
                          <Icon className="size-4 text-muted-foreground" />
                          {label}
                        </Link>
                      ))}
                      <div className="my-2 h-px bg-border" />
                      <button
                        type="button"
                        className="flex w-full items-center gap-3 rounded-2xl px-3 py-2.5 text-left text-sm font-medium text-destructive hover:bg-red-50"
                        onClick={handleLogout}
                      >
                        <LogOut className="size-4" />
                        Đăng xuất
                      </button>
                    </div>
                  )}
                </div>
              </>
            ) : (
              <>
                <Button variant="ghost" onClick={() => navigate('/dang-nhap')}>
                  Đăng nhập
                </Button>
                <Button onClick={() => navigate('/dang-ky')}>Đăng ký tuyển sinh</Button>
              </>
            )}
          </div>

          <Button
            variant="ghost"
            size="icon"
            className="md:hidden"
            aria-label="Mở menu"
            onClick={() => setMobileOpen((open) => !open)}
          >
            {mobileOpen ? <X className="size-5" /> : <Menu className="size-5" />}
          </Button>
        </div>

        <div
          className={cn(
            'grid border-t border-border transition-all md:hidden',
            mobileOpen ? 'grid-rows-[1fr] py-3' : 'grid-rows-[0fr]',
          )}
        >
          <div className="overflow-hidden">
            <div className="flex flex-col gap-1">
              {navLinks.map((link) => (
                <Link
                  key={link.to}
                  to={link.to}
                  className="rounded-2xl px-3 py-2.5 text-sm font-medium no-underline hover:bg-accent"
                  onClick={() => setMobileOpen(false)}
                >
                  {link.label}
                </Link>
              ))}

              {isAuthenticated ? (
                <>
                  <Link
                    to="/thong-bao"
                    className="flex items-center justify-between rounded-2xl px-3 py-2.5 text-sm font-medium no-underline hover:bg-accent"
                    onClick={() => setMobileOpen(false)}
                  >
                    Thông báo
                    {unreadCount > 0 && <Badge>{unreadCount}</Badge>}
                  </Link>
                  {accountLinks.map(({ to, label }) => (
                    <Link
                      key={to}
                      to={to}
                      className="rounded-2xl px-3 py-2.5 text-sm font-medium no-underline hover:bg-accent"
                      onClick={() => setMobileOpen(false)}
                    >
                      {label}
                    </Link>
                  ))}
                  <Button variant="outline" className="mt-2 text-destructive" onClick={handleLogout}>
                    Đăng xuất
                  </Button>
                </>
              ) : (
                <div className="mt-2 grid gap-2">
                  <Button variant="outline" onClick={() => { navigate('/dang-nhap'); setMobileOpen(false); }}>
                    Đăng nhập
                  </Button>
                  <Button onClick={() => { navigate('/dang-ky'); setMobileOpen(false); }}>
                    Đăng ký tuyển sinh
                  </Button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </nav>
  );
};
