import { Link } from 'react-router-dom';
import { GraduationCap, Mail, MapPin, Phone } from 'lucide-react';

export const Footer = () => {
  return (
    <footer className="border-t border-border bg-slate-950 text-slate-300">
      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 gap-10 md:grid-cols-4">
          <div>
            <div className="mb-4 flex items-center gap-3">
              <span className="flex size-10 items-center justify-center rounded-2xl bg-primary text-primary-foreground">
                <GraduationCap className="size-5" />
              </span>
              <div>
                <div className="text-lg font-bold leading-none text-white">Apex</div>
                <div className="text-xs font-medium leading-none text-slate-400">Trung tâm ngôn ngữ</div>
              </div>
            </div>
            <p className="text-sm leading-6 text-slate-400">
              Mở ra cánh cửa tri thức, xây dựng tương lai ngôn ngữ cùng đội ngũ giáo viên chuyên nghiệp.
            </p>
          </div>

          <div>
            <h4 className="mb-4 font-semibold text-white">Về chúng tôi</h4>
            <ul className="space-y-2 text-sm">
              {['Giới thiệu', 'Đội ngũ giáo viên', 'Cơ sở vật chất', 'Tin tức'].map((item) => (
                <li key={item}>
                  <Link to="/" className="text-slate-400 no-underline transition-colors hover:text-white">
                    {item}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h4 className="mb-4 font-semibold text-white">Khóa học</h4>
            <ul className="space-y-2 text-sm">
              {['Tiếng Anh', 'Tiếng Nhật', 'Tiếng Hàn', 'Tiếng Trung', 'Tiếng Pháp'].map((item) => (
                <li key={item}>
                  <Link to="/" className="text-slate-400 no-underline transition-colors hover:text-white">
                    {item}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h4 className="mb-4 font-semibold text-white">Liên hệ</h4>
            <ul className="space-y-3 text-sm text-slate-400">
              <li className="flex items-start gap-3">
                <MapPin className="mt-0.5 size-4 shrink-0 text-primary-container" />
                <span>123 Phố Huế, Hai Bà Trưng, Hà Nội</span>
              </li>
              <li className="flex items-center gap-3">
                <Phone className="size-4 shrink-0 text-primary-container" />
                <span>1900 1234</span>
              </li>
              <li className="flex items-center gap-3">
                <Mail className="size-4 shrink-0 text-primary-container" />
                <span>info@apex-language.vn</span>
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-10 flex flex-col gap-4 border-t border-slate-800 pt-6 text-sm text-slate-500 md:flex-row md:items-center md:justify-between">
          <p>© 2026 Trung tâm ngôn ngữ Apex. All rights reserved.</p>
          <div className="flex gap-4">
            <Link to="/" className="no-underline hover:text-white">Chính sách bảo mật</Link>
            <Link to="/" className="no-underline hover:text-white">Điều khoản sử dụng</Link>
          </div>
        </div>
      </div>
    </footer>
  );
};
