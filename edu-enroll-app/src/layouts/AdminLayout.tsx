import { useState } from 'react';
import { Link, NavLink, Outlet, useNavigate } from 'react-router-dom';
import { LogOut, Menu, User, X } from 'lucide-react';
import { AdminSidebar, menuItems } from '../components/layout/AdminSidebar';
import { Button } from '@/components/ui/button';
import { useAuthStore } from '../store/auth.store';
import { authService } from '../services/auth.service';
import { cn } from '@/lib/utils';

export const AdminLayout = () => {
  const { user, logout } = useAuthStore();
  const navigate = useNavigate();
  const [mobileOpen, setMobileOpen] = useState(false);

  const handleLogout = async () => {
    await authService.logout().catch(() => undefined);
    logout();
    navigate('/dang-nhap');
  };

  return (
    <div className="min-h-screen bg-background text-foreground">
      <div className="flex min-h-screen">
        <AdminSidebar />

        <div className="flex min-w-0 flex-1 flex-col">
          <header className="sticky top-0 z-40 border-b border-border bg-card/90 px-4 py-3 backdrop-blur-xl sm:px-6">
            <div className="flex items-center justify-between gap-4">
              <Button
                variant="ghost"
                size="icon"
                className="lg:hidden"
                aria-label="Mở menu quản trị"
                onClick={() => setMobileOpen(true)}
              >
                <Menu className="size-5" />
              </Button>

              <div className="hidden text-sm font-medium text-muted-foreground sm:block">
                Quản trị tuyển sinh
              </div>

              <div className="ml-auto flex items-center gap-3">
                <div className="hidden text-right sm:block">
                  <div className="text-sm font-semibold leading-none">{user?.full_name || user?.email}</div>
                  <div className="mt-1 text-xs text-muted-foreground">{user?.role}</div>
                </div>
                <span className="flex size-10 items-center justify-center rounded-full bg-primary-container text-on-primary-container">
                  <User className="size-4" />
                </span>
                <Button variant="outline" size="sm" onClick={handleLogout}>
                  <LogOut className="size-4" />
                  Đăng xuất
                </Button>
              </div>
            </div>
          </header>

          <main className="flex-1 px-4 py-5 sm:px-6 lg:px-8">
            <Outlet />
          </main>
        </div>
      </div>

      {mobileOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <button
            type="button"
            aria-label="Đóng menu"
            className="absolute inset-0 bg-slate-950/40"
            onClick={() => setMobileOpen(false)}
          />
          <div className="relative flex h-full w-80 max-w-[86vw] flex-col border-r border-border bg-card p-3 shadow-2xl">
            <div className="mb-3 flex items-center justify-between px-2 py-2">
              <Link to="/quan-tri" className="font-bold text-primary no-underline" onClick={() => setMobileOpen(false)}>
                Apex Admin
              </Link>
              <Button variant="ghost" size="icon" aria-label="Đóng menu" onClick={() => setMobileOpen(false)}>
                <X className="size-5" />
              </Button>
            </div>
            <nav className="space-y-1 overflow-y-auto">
              {menuItems.map(({ to, icon: Icon, label, end }) => (
                <NavLink
                  key={to}
                  to={to}
                  end={end}
                  onClick={() => setMobileOpen(false)}
                  className={({ isActive }) =>
                    cn(
                      'flex items-center gap-3 rounded-full px-4 py-2.5 text-sm font-medium no-underline',
                      isActive
                        ? 'bg-primary-container text-on-primary-container'
                        : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground',
                    )
                  }
                >
                  <Icon className="size-4" />
                  {label}
                </NavLink>
              ))}
            </nav>
          </div>
        </div>
      )}
    </div>
  );
};
