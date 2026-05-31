import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button, Card, Row, Col } from 'antd';
import {
  TrophyOutlined,
  TeamOutlined,
  ClockCircleOutlined,
  SmileOutlined,
  UserOutlined,
  BookOutlined,
  ScheduleOutlined,
  HomeOutlined,
  SafetyCertificateOutlined,
  CustomerServiceOutlined,
  RightOutlined,
} from '@ant-design/icons';
import { contentService } from '../../services/content.service';
import type { Banner, NewsItem } from '../../types';

const LANGUAGE_CARDS = [
  {
    flag: '🇬🇧',
    code: 'GB',
    name: 'Tiếng Anh',
    desc: 'Từ A1 đến IELTS/TOEIC',
    intro: 'Chương trình tập trung vào giao tiếp, phát âm, ngữ pháp nền tảng và kỹ năng học thuật cho học viên muốn dùng tiếng Anh trong học tập, công việc hoặc du học.',
    audience: 'Học sinh, sinh viên, người đi làm và học viên cần chứng chỉ quốc tế.',
    outcome: 'Tự tin giao tiếp, viết email, thuyết trình và đạt mục tiêu IELTS/TOEIC.',
    levels: 'A1 • A2 • B1 • B2 • C1 • IELTS • TOEIC',
    color: 'from-blue-500 to-blue-700',
  },
  {
    flag: '🇯🇵',
    code: 'JP',
    name: 'Tiếng Nhật',
    desc: 'Luyện thi JLPT N5 đến N1',
    intro: 'Lộ trình tiếng Nhật đi từ bảng chữ cái, giao tiếp đời sống đến đọc hiểu, nghe hiểu và luyện đề JLPT theo từng cấp độ.',
    audience: 'Người mới bắt đầu, học viên định hướng du học, thực tập hoặc làm việc tại Nhật Bản.',
    outcome: 'Nắm chắc từ vựng, ngữ pháp, phản xạ giao tiếp và sẵn sàng thi JLPT.',
    levels: 'N5 • N4 • N3 • N2 • N1',
    color: 'from-red-500 to-red-700',
  },
  {
    flag: '🇰🇷',
    code: 'KR',
    name: 'Tiếng Hàn',
    desc: 'Từ sơ cấp đến TOPIK',
    intro: 'Khóa học xây nền Hangul, mẫu câu giao tiếp, nghe nói thực tế và luyện kỹ năng đọc viết theo chuẩn TOPIK.',
    audience: 'Học viên yêu thích văn hóa Hàn Quốc, cần giao tiếp, du học hoặc chuẩn bị hồ sơ lao động.',
    outcome: 'Giao tiếp tự nhiên trong tình huống hằng ngày và có nền tảng để thi TOPIK.',
    levels: 'Sơ cấp • Trung cấp • TOPIK',
    color: 'from-purple-500 to-purple-700',
  },
  {
    flag: '🇨🇳',
    code: 'CN',
    name: 'Tiếng Trung',
    desc: 'Từ HSK 1 đến HSK 6',
    intro: 'Chương trình kết hợp Pinyin, chữ Hán, mẫu câu giao tiếp và luyện đọc hiểu theo cấp độ HSK.',
    audience: 'Người học phục vụ công việc, thương mại, du lịch hoặc chuẩn bị chứng chỉ HSK.',
    outcome: 'Đọc hiểu tốt hơn, giao tiếp rõ ràng và mở rộng vốn từ theo chủ đề thực tế.',
    levels: 'HSK 1-2 • HSK 3-4 • HSK 5-6',
    color: 'from-yellow-500 to-orange-600',
  },
  {
    flag: '🇫🇷',
    code: 'FR',
    name: 'Tiếng Pháp',
    desc: 'Chuẩn DELF từ A1 đến B2',
    intro: 'Khóa tiếng Pháp chú trọng phát âm, hội thoại, ngữ pháp ứng dụng và luyện bốn kỹ năng theo khung CEFR.',
    audience: 'Học viên học từ đầu, chuẩn bị du học, định cư hoặc cần chứng chỉ DELF.',
    outcome: 'Sử dụng tiếng Pháp trong giao tiếp cơ bản, học thuật và các kỳ thi chuẩn hóa.',
    levels: 'A1 • A2 • B1 • B2',
    color: 'from-indigo-500 to-indigo-700',
  },
];

const WHY_CHOOSE = [
  { icon: <UserOutlined className="text-2xl text-indigo-600" />, title: 'Giáo viên chuyên nghiệp', desc: 'Đội ngũ giáo viên bản ngữ và Việt Nam được đào tạo tại nước ngoài, có chứng chỉ giảng dạy quốc tế.' },
  { icon: <BookOutlined className="text-2xl text-indigo-600" />, title: 'Lộ trình rõ ràng', desc: 'Chương trình học được thiết kế khoa học theo chuẩn quốc tế CEFR, có lộ trình học tập từng bước rõ ràng.' },
  { icon: <ScheduleOutlined className="text-2xl text-indigo-600" />, title: 'Lịch học linh hoạt', desc: 'Nhiều ca học sáng - trưa - chiều - tối phù hợp với mọi đối tượng học sinh, sinh viên và người đi làm.' },
  { icon: <HomeOutlined className="text-2xl text-indigo-600" />, title: 'Cơ sở vật chất hiện đại', desc: 'Phòng học máy lạnh, hệ thống âm thanh hiện đại, màn hình tương tác và trang thiết bị học tập tiên tiến.' },
  { icon: <SafetyCertificateOutlined className="text-2xl text-indigo-600" />, title: 'Cam kết đầu ra', desc: 'Cam kết hoàn lại 100% học phí nếu học viên không đạt mục tiêu sau khi hoàn thành khóa học.' },
  { icon: <CustomerServiceOutlined className="text-2xl text-indigo-600" />, title: 'Hỗ trợ 24/7', desc: 'Đội ngũ tư vấn và hỗ trợ học viên mọi lúc mọi nơi qua điện thoại, email và chat trực tuyến.' },
];

const TESTIMONIALS = [
  { name: 'Nguyễn Thị Mai', course: 'IELTS - Đạt 7.0', avatar: 'M', quote: 'Sau 4 tháng học IELTS tại Trung tâm ngôn ngữ Apex, mình đã đạt 7.0 IELTS như mong đợi. Giáo viên rất tận tâm, phương pháp dạy hiệu quả và sát với đề thi thật.' },
  { name: 'Trần Văn Hùng', course: 'Tiếng Nhật N3', avatar: 'H', quote: 'Học tiếng Nhật N3 tại Trung tâm ngôn ngữ Apex thực sự rất tốt. Giáo viên nhiệt tình, tài liệu phong phú. Mình đã vượt qua kỳ thi JLPT N3 ngay lần đầu tiên.' },
  { name: 'Lê Thị Hoa', course: 'Tiếng Hàn Trung cấp', avatar: 'H', quote: 'Lớp học tiếng Hàn rất vui và bổ ích. Cô giáo người Hàn dạy rất dễ hiểu. Sau 3 tháng mình đã giao tiếp được cơ bản và tự tin hơn nhiều.' },
];

const NEWS = [
  { title: 'Khai giảng khóa học Tiếng Anh IELTS tháng 6/2026', date: '15/05/2026', category: 'Thông báo' },
  { title: 'Học bổng 30% học phí cho học viên đăng ký sớm', date: '10/05/2026', category: 'Ưu đãi' },
  { title: 'Kết quả thi JLPT tháng 12/2025 - Tỷ lệ đậu 95%', date: '05/05/2026', category: 'Tin tức' },
];

export default function Home() {
  const navigate = useNavigate();
  const [banners, setBanners] = useState<Banner[]>([]);
  const [newsItems, setNewsItems] = useState<NewsItem[]>([]);

  useEffect(() => {
    const loadContent = async () => {
      const [bannerData, newsData] = await Promise.all([
        contentService.getBanners().catch(() => []),
        contentService.getNews(3).catch(() => []),
      ]);
      setBanners(bannerData);
      setNewsItems(newsData);
    };
    loadContent();
  }, []);

  const displayNews: Array<{ title: string; date: string; category: string; summary?: string }> = newsItems.length > 0
    ? newsItems.map((item) => ({
      title: item.title,
      date: item.published_at ? new Date(item.published_at).toLocaleDateString('vi-VN') : '',
      category: item.category,
      summary: item.summary,
    }))
    : NEWS;

  return (
    <div>
      {/* HERO */}
      <section className="relative bg-gradient-to-br from-indigo-900 via-indigo-800 to-blue-700 text-white py-24 px-4 overflow-hidden">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-10 left-10 text-8xl">🌐</div>
          <div className="absolute top-20 right-20 text-6xl">📚</div>
          <div className="absolute bottom-10 left-1/3 text-7xl">✨</div>
        </div>
        <div className="max-w-5xl mx-auto text-center relative">
          <div className="inline-flex items-center gap-2 bg-indigo-700/50 border border-indigo-500/50 rounded-full px-4 py-2 text-sm mb-6">
            <TrophyOutlined /> Trung tâm ngoại ngữ uy tín hàng đầu Việt Nam
          </div>
          <h1 className="text-4xl md:text-6xl font-bold mb-6 leading-tight">
            Ngôn ngữ là cầu nối <br />
            <span className="text-amber-400">tương lai</span>
          </h1>
          <p className="text-lg md:text-xl text-indigo-200 mb-10 max-w-2xl mx-auto leading-relaxed">
            Trung tâm ngôn ngữ Apex — Nơi học ngoại ngữ hàng đầu với đội ngũ giáo viên chuyên nghiệp, lịch học linh hoạt và phương pháp đào tạo tiên tiến.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button
              size="large"
              style={{ backgroundColor: '#f59e0b', borderColor: '#f59e0b', color: '#1e293b', height: 52, paddingInline: 32, fontWeight: 600, fontSize: 16 }}
              onClick={() => navigate('/dang-ky')}
            >
              Đăng ký tuyển sinh ngay
            </Button>
            <Button
              size="large"
              ghost
              style={{ height: 52, paddingInline: 32, fontSize: 16 }}
              onClick={() => document.getElementById('courses')?.scrollIntoView({ behavior: 'smooth' })}
            >
              Xem khóa học
            </Button>
          </div>
        </div>
      </section>

      {/* STATS */}
      <section className="bg-white shadow-sm py-10">
        <div className="max-w-5xl mx-auto px-4">
          <Row gutter={32} justify="center">
            {[
              { title: '5.000+', desc: 'Học viên', icon: <TeamOutlined className="text-indigo-600 text-2xl" /> },
              { title: '15+', desc: 'Khóa học', icon: <BookOutlined className="text-indigo-600 text-2xl" /> },
              { title: '10+', desc: 'Năm kinh nghiệm', icon: <TrophyOutlined className="text-indigo-600 text-2xl" /> },
              { title: '98%', desc: 'Học viên hài lòng', icon: <SmileOutlined className="text-indigo-600 text-2xl" /> },
            ].map((stat) => (
              <Col key={stat.desc} xs={12} sm={6} className="text-center py-4">
                <div className="mb-2">{stat.icon}</div>
                <div className="text-3xl font-bold text-indigo-600">{stat.title}</div>
                <div className="text-gray-500 text-sm mt-1">{stat.desc}</div>
              </Col>
            ))}
          </Row>
        </div>
      </section>

      {banners.length > 0 && (
        <section className="bg-white py-8 px-4 border-b border-gray-100">
          <div className="max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-4">
            {banners.slice(0, 2).map((banner) => (
              <div key={banner._id} className="rounded-xl overflow-hidden bg-indigo-50 border border-indigo-100">
                {banner.image_url && (
                  <img src={banner.image_url} alt={banner.title} className="w-full h-40 object-cover" />
                )}
                <div className="p-5">
                  <h3 className="font-bold text-gray-900 text-lg">{banner.title}</h3>
                  {banner.subtitle && <p className="text-gray-500 text-sm mt-1">{banner.subtitle}</p>}
                  {banner.link_url && (
                    <Button size="small" className="mt-4" onClick={() => { window.location.href = banner.link_url!; }}>
                      Xem thêm
                    </Button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* LANGUAGES */}
      <section id="courses" className="py-20 px-4 bg-gray-50">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">Ngôn ngữ chúng tôi đào tạo</h2>
            <p className="text-gray-500 text-lg">5 ngôn ngữ phổ biến nhất với các cấp độ từ sơ cấp đến nâng cao</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
            {LANGUAGE_CARDS.map((lang) => (
              <div
                key={lang.name}
                className={`flex min-h-[430px] flex-col rounded-2xl bg-gradient-to-br ${lang.color} p-6 text-white shadow-sm transition hover:-translate-y-1 hover:shadow-lg`}
              >
                <div className="mb-5 flex items-start justify-between gap-4">
                  <div>
                    <div className="text-4xl font-bold leading-none">{lang.code}</div>
                    <h3 className="mt-5 text-2xl font-bold">{lang.name}</h3>
                    <p className="mt-2 text-sm font-medium text-white/90">{lang.desc}</p>
                  </div>
                  <span className="rounded-full bg-white/15 px-3 py-1 text-xs font-semibold text-white/90 ring-1 ring-white/25">
                    {lang.flag}
                  </span>
                </div>

                <div className="space-y-3 text-sm leading-6 text-white/90">
                  <p>{lang.intro}</p>
                  <div className="rounded-xl bg-white/10 p-3 ring-1 ring-white/15">
                    <p className="text-xs font-bold uppercase tracking-wide text-white/70">Phù hợp</p>
                    <p className="mt-1">{lang.audience}</p>
                  </div>
                  <div className="rounded-xl bg-white/10 p-3 ring-1 ring-white/15">
                    <p className="text-xs font-bold uppercase tracking-wide text-white/70">Mục tiêu</p>
                    <p className="mt-1">{lang.outcome}</p>
                  </div>
                </div>

                <div className="mt-auto pt-5">
                  <p className="mb-2 text-xs font-bold uppercase tracking-wide text-white/70">Cấp độ</p>
                  <div className="mb-4 rounded-xl bg-white/10 px-3 py-2 text-xs font-semibold text-white/90 ring-1 ring-white/15">
                    {lang.levels}
                  </div>
                  <Button ghost size="small" className="border-white/60 text-white hover:bg-white/20" onClick={() => navigate('/dang-ky')}>
                    Đăng ký tư vấn <RightOutlined />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* WHY CHOOSE US */}
      <section className="py-20 px-4 bg-white">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">Tại sao chọn Apex?</h2>
            <p className="text-gray-500 text-lg">Cam kết mang đến trải nghiệm học ngoại ngữ tốt nhất</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {WHY_CHOOSE.map((item) => (
              <Card key={item.title} className="hover:shadow-md transition-shadow border-0 bg-gray-50">
                <div className="mb-4 w-12 h-12 bg-indigo-50 rounded-xl flex items-center justify-center">
                  {item.icon}
                </div>
                <h3 className="font-semibold text-gray-900 mb-2">{item.title}</h3>
                <p className="text-gray-500 text-sm leading-relaxed">{item.desc}</p>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* TESTIMONIALS */}
      <section className="py-20 px-4 bg-indigo-50">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">Học viên nói gì về Apex?</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {TESTIMONIALS.map((t) => (
              <Card key={t.name} className="border-0 shadow-sm">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 bg-indigo-600 rounded-full flex items-center justify-center text-white font-bold">
                    {t.avatar}
                  </div>
                  <div>
                    <div className="font-semibold text-gray-900 text-sm">{t.name}</div>
                    <div className="text-indigo-600 text-xs">{t.course}</div>
                  </div>
                </div>
                <p className="text-gray-600 text-sm leading-relaxed italic">"{t.quote}"</p>
                <div className="mt-3 text-amber-400">★★★★★</div>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* CTA BANNER */}
      <section className="bg-gradient-to-r from-indigo-600 to-blue-600 py-16 px-4">
        <div className="max-w-3xl mx-auto text-center text-white">
          <ClockCircleOutlined className="text-4xl mb-4 text-amber-300" />
          <h2 className="text-3xl font-bold mb-4">Sẵn sàng bắt đầu hành trình ngôn ngữ?</h2>
          <p className="text-indigo-200 mb-8 text-lg">Đăng ký tuyển sinh ngay hôm nay và nhận ưu đãi đặc biệt từ Trung tâm ngôn ngữ Apex</p>
          <Button
            size="large"
            style={{ backgroundColor: '#f59e0b', borderColor: '#f59e0b', color: '#1e293b', height: 52, paddingInline: 36, fontWeight: 700, fontSize: 16 }}
            onClick={() => navigate('/dang-ky')}
          >
            Đăng ký tuyển sinh ngay →
          </Button>
        </div>
      </section>

      {/* NEWS */}
      <section id="news" className="py-20 px-4 bg-white">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">Tin tức & Thông báo</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {displayNews.map((news) => (
              <Card key={news.title} className="hover:shadow-md transition-shadow cursor-pointer">
                <div className="h-40 bg-gradient-to-br from-indigo-100 to-blue-100 rounded-lg mb-4 flex items-center justify-center text-4xl">📰</div>
                <div className="text-xs text-indigo-600 font-medium mb-2">{news.category}</div>
                <h4 className="font-semibold text-gray-900 mb-2 line-clamp-2">{news.title}</h4>
                {news.summary && <p className="text-gray-500 text-sm mb-3 line-clamp-2">{news.summary}</p>}
                <p className="text-gray-400 text-xs">{news.date}</p>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* CONTACT */}
      <section id="contact" className="py-20 px-4 bg-gray-50">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">Liên hệ với chúng tôi</h2>
            <p className="text-gray-500">Chúng tôi luôn sẵn sàng tư vấn và hỗ trợ bạn</p>
          </div>
          <Row gutter={32}>
            <Col xs={24} md={12}>
              <div className="space-y-4">
                {[
                  { label: 'Cơ sở Hà Nội', value: '123 Phố Huế, Hai Bà Trưng, Hà Nội' },
                  { label: 'Cơ sở TP.HCM', value: '789 Nguyễn Huệ, Quận 1, TP.HCM' },
                  { label: 'Hotline', value: '1900 1234 (8:00 - 21:00)' },
                  { label: 'Email', value: 'info@apex-language.vn' },
                ].map((item) => (
                  <div key={item.label} className="flex gap-4 items-start p-4 bg-white rounded-lg shadow-sm">
                    <div className="w-8 h-8 bg-indigo-100 rounded-full flex items-center justify-center shrink-0">
                      <span className="text-indigo-600 text-sm">📍</span>
                    </div>
                    <div>
                      <div className="font-medium text-gray-900 text-sm">{item.label}</div>
                      <div className="text-gray-500 text-sm">{item.value}</div>
                    </div>
                  </div>
                ))}
              </div>
            </Col>
            <Col xs={24} md={12}>
              <Card className="shadow-sm">
                <h3 className="font-semibold text-gray-900 mb-4">Gửi tin nhắn cho chúng tôi</h3>
                <div className="space-y-3">
                  <input className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-indigo-400" placeholder="Họ và tên" />
                  <input className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-indigo-400" placeholder="Email hoặc số điện thoại" />
                  <textarea className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-indigo-400 h-24 resize-none" placeholder="Nội dung tin nhắn..." />
                  <Button type="primary" style={{ backgroundColor: '#4f46e5' }} block>Gửi tin nhắn</Button>
                </div>
              </Card>
            </Col>
          </Row>
        </div>
      </section>
    </div>
  );
}
