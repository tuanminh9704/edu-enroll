const fs = require('fs');
const path = require('path');

const outDir = path.join(__dirname, '..', 'use-case-analysis');
const classDir = path.join(outDir, 'class-diagrams');
const sequenceDir = path.join(outDir, 'sequence-diagrams');

fs.mkdirSync(classDir, { recursive: true });
fs.mkdirSync(sequenceDir, { recursive: true });

const esc = (value) => String(value)
  .replace(/&/g, '&amp;')
  .replace(/</g, '&lt;')
  .replace(/>/g, '&gt;')
  .replace(/"/g, '&quot;');

const slug = (value) => value
  .normalize('NFD')
  .replace(/[\u0300-\u036f]/g, '')
  .replace(/đ/g, 'd')
  .replace(/Đ/g, 'D')
  .toLowerCase()
  .replace(/[^a-z0-9]+/g, '-')
  .replace(/^-|-$/g, '');

const useCases = [
  {
    id: 'UC01',
    name: 'Xem nội dung công khai',
    actor: 'Khách truy cập / Học viên / Quản trị viên',
    short: 'Cho phép người dùng xem trang chủ, banner và tin tức công khai mà không cần đăng nhập.',
    boundary: 'XemNoiDungCongKhaiUI',
    control: 'ContentController',
    entities: ['BANNERS', 'NEWS'],
    endpoints: ['GET /api/content/banners', 'GET /api/content/news', 'GET /api/content/news/:slug'],
    pre: 'Hệ thống API đang hoạt động.',
    post: 'Không thay đổi dữ liệu; người dùng xem được nội dung công khai nếu có dữ liệu.',
    special: 'Chỉ hiển thị banner active và tin tức published.',
    basic: [
      'Người dùng truy cập trang chủ hoặc trang tin tức.',
      'Giao diện gửi yêu cầu lấy banner/tin tức công khai.',
      'Controller truy vấn dữ liệu từ BANNERS và NEWS.',
      'Hệ thống trả danh sách nội dung hợp lệ.',
      'Giao diện hiển thị nội dung cho người dùng.',
    ],
    alternate: [
      'Không có dữ liệu công khai: giao diện hiển thị danh sách rỗng hoặc nội dung mặc định.',
      'Tin tức không tồn tại: hệ thống trả thông báo không tìm thấy.',
    ],
  },
  {
    id: 'UC02',
    name: 'Đăng ký / đăng nhập',
    actor: 'Học viên / Phụ huynh / Quản trị viên',
    short: 'Cho phép người dùng đăng ký tài khoản, xác thực OTP, đăng nhập, đăng xuất và làm mới phiên đăng nhập.',
    boundary: 'DangKyDangNhapUI',
    control: 'AuthController',
    entities: ['USERS', 'OTP_CODES', 'REFRESH_TOKENS'],
    endpoints: ['POST /api/auth/register', 'POST /api/auth/verify-otp', 'POST /api/auth/resend-otp', 'POST /api/auth/login', 'POST /api/auth/logout', 'POST /api/auth/refresh-token'],
    pre: 'Người dùng có email hợp lệ; với đăng nhập, tài khoản đã được kích hoạt OTP.',
    post: 'Đăng nhập thành công tạo access token và refresh token; đăng ký thành công tạo tài khoản chờ xác thực.',
    special: 'Mật khẩu được hash, OTP có thời hạn và refresh token được lưu trong hệ thống.',
    basic: [
      'Người dùng chọn đăng ký hoặc đăng nhập.',
      'Giao diện hiển thị form tương ứng.',
      'Người dùng nhập thông tin và gửi yêu cầu.',
      'AuthController kiểm tra dữ liệu trong USERS, OTP_CODES hoặc REFRESH_TOKENS.',
      'Hệ thống trả kết quả và chuyển hướng theo vai trò người dùng.',
    ],
    alternate: [
      'Sai email/mật khẩu hoặc tài khoản chưa xác thực: hiển thị lỗi.',
      'OTP sai/hết hạn: yêu cầu nhập lại hoặc gửi lại OTP.',
    ],
  },
  {
    id: 'UC03',
    name: 'Quản lý tài khoản',
    actor: 'Học viên / Quản trị viên',
    short: 'Cho phép người dùng xem thông tin cá nhân, cập nhật hồ sơ tài khoản và đổi mật khẩu.',
    boundary: 'QuanLyTaiKhoanUI',
    control: 'AuthController',
    entities: ['USERS', 'REFRESH_TOKENS'],
    endpoints: ['GET /api/auth/me', 'PUT /api/auth/profile', 'PUT /api/auth/change-password'],
    pre: 'Người dùng đã đăng nhập.',
    post: 'Thông tin tài khoản hoặc mật khẩu được cập nhật; khi đổi mật khẩu, refresh token cũ bị vô hiệu.',
    special: 'Chỉ chủ tài khoản được cập nhật thông tin cá nhân của mình.',
    basic: [
      'Người dùng mở trang hồ sơ cá nhân.',
      'Giao diện tải thông tin tài khoản hiện tại.',
      'Người dùng cập nhật họ tên, số điện thoại hoặc mật khẩu.',
      'Controller xác thực token và cập nhật USERS.',
      'Hệ thống trả thông tin mới cho giao diện.',
    ],
    alternate: [
      'Mật khẩu hiện tại không đúng: hiển thị lỗi.',
      'Token không hợp lệ: yêu cầu đăng nhập lại.',
    ],
  },
  {
    id: 'UC04',
    name: 'Lập hồ sơ tuyển sinh',
    actor: 'Học viên / Phụ huynh',
    short: 'Cho phép học viên khởi tạo hồ sơ, ký chính sách và nhập thông tin tuyển sinh.',
    boundary: 'LapHoSoTuyenSinhUI',
    control: 'EnrollmentController',
    entities: ['ENROLLMENT_FORMS', 'ENROLLMENT_LOGS', 'USERS'],
    endpoints: ['GET /api/enrollments', 'POST /api/enrollments/sign-policy', 'POST /api/enrollments/form', 'POST /api/uploads/cloudinary'],
    pre: 'Người dùng đã đăng nhập.',
    post: 'Hồ sơ được tạo/cập nhật, current_step tăng theo tiến độ và log được ghi nhận.',
    special: 'Thông tin quan trọng được validate ở backend; ký chính sách là điều kiện trước thanh toán.',
    basic: [
      'Người dùng mở trang hồ sơ tuyển sinh.',
      'Hệ thống khởi tạo hồ sơ nếu chưa tồn tại.',
      'Người dùng ký chính sách tuyển sinh.',
      'Người dùng điền thông tin học viên, phụ huynh, ngôn ngữ, level và lịch học.',
      'Hệ thống lưu ENROLLMENT_FORMS, xác định có cần thi đầu vào và ghi log.',
    ],
    alternate: [
      'Thiếu chữ ký hoặc dữ liệu không hợp lệ: hệ thống báo lỗi.',
      'Chưa thanh toán lệ phí: không cho nộp thông tin hồ sơ bước sau.',
    ],
  },
  {
    id: 'UC05',
    name: 'Thanh toán lệ phí',
    actor: 'Học viên / Phụ huynh, VNPay',
    short: 'Cho phép học viên thanh toán lệ phí hồ sơ qua VNPay và cập nhật trạng thái thanh toán.',
    boundary: 'ThanhToanLePhiUI',
    control: 'PaymentController',
    entities: ['ENROLLMENT_FORMS', 'PAYMENTS', 'INVOICES'],
    endpoints: ['GET /api/enrollments/payment-url', 'GET /api/payments/vnpay', 'GET /api/payments/callback', 'GET /api/payments/mock-vnpay'],
    pre: 'Học viên đã ký chính sách tuyển sinh.',
    post: 'Thanh toán thành công tạo Payment/Invoice và chuyển hồ sơ sang bước điền thông tin.',
    special: 'Callback VNPay phải được kiểm tra secure hash, mã phản hồi và trạng thái giao dịch.',
    basic: [
      'Học viên chọn thanh toán lệ phí.',
      'Hệ thống tạo URL thanh toán VNPay.',
      'Học viên thanh toán trên VNPay.',
      'VNPay gọi callback về hệ thống.',
      'PaymentController xác thực callback và cập nhật hồ sơ, payment, invoice.',
    ],
    alternate: [
      'Thanh toán thất bại hoặc chữ ký không hợp lệ: chuyển về trạng thái thất bại.',
      'Hồ sơ đã thanh toán: hệ thống không tạo thanh toán trùng.',
    ],
  },
  {
    id: 'UC06',
    name: 'Đăng ký / xem kết quả thi',
    actor: 'Học viên / Phụ huynh',
    short: 'Cho phép học viên đăng ký lịch kiểm tra đầu vào, bỏ qua thi nếu đủ điều kiện và xem kết quả sau khi admin đồng bộ.',
    boundary: 'DangKyXemKetQuaThiUI',
    control: 'EnrollmentController',
    entities: ['EXAM_SCHEDULES', 'EXAM_REGISTRATIONS', 'EXAM_ROOMS', 'EXAM_SCORES'],
    endpoints: ['GET /api/enrollments/exam-schedules', 'POST /api/enrollments/exam/register', 'POST /api/enrollments/exam/skip', 'GET /api/enrollments/exam/result', 'POST /api/enrollments/exam/advance'],
    pre: 'Hồ sơ đã hoàn thành thông tin tuyển sinh.',
    post: 'Học viên có đăng ký thi hoặc được bỏ qua thi; kết quả thi được hiển thị khi đã có điểm đồng bộ.',
    special: 'Chỉ được đổi lịch thi khi chưa có điểm.',
    basic: [
      'Học viên mở bước kiểm tra năng lực.',
      'Hệ thống hiển thị lịch thi theo ngôn ngữ đã đăng ký.',
      'Học viên đăng ký lịch thi hoặc bỏ qua nếu level cơ bản.',
      'Sau khi admin nhập và đồng bộ điểm, học viên xem kết quả.',
      'Nếu đạt ngưỡng, học viên được chuyển sang bước chọn chương trình.',
    ],
    alternate: [
      'Lịch thi đầy/đã đóng: hệ thống báo lỗi.',
      'Điểm chưa đồng bộ: chưa thể chọn chương trình.',
    ],
  },
  {
    id: 'UC07',
    name: 'Chọn chương trình học',
    actor: 'Học viên / Phụ huynh',
    short: 'Cho phép học viên chọn chương trình đào tạo phù hợp với ngôn ngữ, level và điểm đã đạt.',
    boundary: 'ChonChuongTrinhHocUI',
    control: 'EnrollmentController',
    entities: ['TRAINING_PROGRAMS', 'ENROLLMENT_FORMS', 'EXAM_SCORES'],
    endpoints: ['GET /api/enrollments/programs', 'POST /api/enrollments/program/select'],
    pre: 'Học viên đã đạt điều kiện qua thi hoặc thuộc level cơ bản không cần thi.',
    post: 'Hồ sơ lưu chương trình, tên chương trình, học phí và chuyển sang bước nộp hồ sơ gốc.',
    special: 'Chỉ hiển thị các khóa đủ điều kiện theo điểm đã đồng bộ và ngưỡng tối thiểu.',
    basic: [
      'Học viên mở bước chọn chương trình.',
      'Hệ thống lấy danh sách chương trình đủ điều kiện.',
      'Học viên chọn một chương trình.',
      'Controller kiểm tra ngôn ngữ, điểm và trạng thái đỗ.',
      'Hệ thống cập nhật chương trình đã chọn vào hồ sơ.',
    ],
    alternate: [
      'Chưa đạt ngưỡng đỗ: không hiển thị chương trình để chọn.',
      'Chọn chương trình không đủ điểm: hệ thống báo lỗi.',
    ],
  },
  {
    id: 'UC08',
    name: 'Nộp hồ sơ gốc',
    actor: 'Học viên / Phụ huynh',
    short: 'Cho phép học viên đăng ký ngày nộp hồ sơ gốc, chọn mua sách và hoàn tất hồ sơ tuyển sinh.',
    boundary: 'NopHoSoGocUI',
    control: 'EnrollmentController',
    entities: ['ENROLLMENT_FORMS', 'COUNTERS', 'ENROLLMENT_LOGS'],
    endpoints: ['POST /api/enrollments/original-docs'],
    pre: 'Học viên đã chọn chương trình đào tạo.',
    post: 'Hồ sơ có mã hồ sơ, ngày hẹn nộp bản gốc và trạng thái completed.',
    special: 'Mã hồ sơ được sinh bằng Counter ở backend, không sinh ở frontend.',
    basic: [
      'Học viên mở bước nộp hồ sơ gốc.',
      'Học viên chọn ngày hẹn, nhu cầu mua sách và ghi chú.',
      'Controller sinh mã hồ sơ nếu chưa có.',
      'Hệ thống cập nhật hồ sơ thành completed.',
      'Hệ thống tạo thông báo cho học viên và admin.',
    ],
    alternate: [
      'Thiếu ngày hẹn hoặc dữ liệu không hợp lệ: hệ thống báo lỗi.',
      'Hồ sơ đã có mã: hệ thống dùng lại mã cũ.',
    ],
  },
  {
    id: 'UC09',
    name: 'Phúc khảo / phỏng vấn',
    actor: 'Học viên / Phụ huynh / Quản trị viên',
    short: 'Cho phép học viên gửi phúc khảo, xem lịch phỏng vấn và xác nhận tham gia; admin xử lý phúc khảo và phỏng vấn.',
    boundary: 'PhucKhaoPhongVanUI',
    control: 'EnrollmentController_AdminController',
    entities: ['RECHECK_REQUESTS', 'INTERVIEWS', 'EXAM_REGISTRATIONS', 'ENROLLMENT_FORMS'],
    endpoints: ['POST /api/enrollments/recheck', 'GET /api/enrollments/recheck', 'GET /api/enrollments/interviews', 'POST /api/enrollments/interviews/:id/respond', 'GET/PUT /api/admin/rechecks', 'GET/POST/PATCH /api/admin/interviews'],
    pre: 'Học viên đã có hồ sơ; với phúc khảo, học viên đã có đăng ký thi.',
    post: 'Yêu cầu phúc khảo hoặc trạng thái phỏng vấn được cập nhật.',
    special: 'Không cho tạo nhiều yêu cầu phúc khảo đang chờ xử lý cho cùng một đăng ký thi.',
    basic: [
      'Học viên gửi yêu cầu phúc khảo hoặc xem lịch phỏng vấn.',
      'Hệ thống lưu yêu cầu/trạng thái xác nhận.',
      'Admin xem danh sách phúc khảo hoặc tạo lịch phỏng vấn.',
      'Admin cập nhật kết quả xử lý.',
      'Hệ thống thông báo kết quả cho học viên.',
    ],
    alternate: [
      'Đã có yêu cầu phúc khảo đang xử lý: hệ thống báo lỗi.',
      'Lịch phỏng vấn không tồn tại: hệ thống trả lỗi.',
    ],
  },
  {
    id: 'UC10',
    name: 'Xem hóa đơn / thông báo',
    actor: 'Học viên / Quản trị viên',
    short: 'Cho phép người dùng xem hóa đơn, xem thông báo và đánh dấu thông báo đã đọc.',
    boundary: 'HoaDonThongBaoUI',
    control: 'NotificationInvoiceController',
    entities: ['INVOICES', 'NOTIFICATIONS'],
    endpoints: ['GET /api/enrollments/invoices', 'GET /api/notifications', 'GET /api/notifications/unread-count', 'PATCH /api/notifications/:id/read', 'PATCH /api/notifications/read-all'],
    pre: 'Người dùng đã đăng nhập.',
    post: 'Danh sách hóa đơn/thông báo được hiển thị; trạng thái đọc của thông báo có thể thay đổi.',
    special: 'Người dùng chỉ xem hóa đơn và thông báo thuộc tài khoản của mình.',
    basic: [
      'Người dùng mở trang hóa đơn hoặc thông báo.',
      'Giao diện gửi yêu cầu đến API.',
      'Controller lấy dữ liệu theo userId.',
      'Hệ thống trả danh sách hóa đơn/thông báo.',
      'Người dùng có thể đánh dấu thông báo đã đọc.',
    ],
    alternate: [
      'Không có dữ liệu: hiển thị danh sách rỗng.',
      'Token hết hạn: yêu cầu đăng nhập lại.',
    ],
  },
  {
    id: 'UC11',
    name: 'Xem dashboard',
    actor: 'Quản trị viên',
    short: 'Cho phép admin xem thống kê tổng quan về người dùng, hồ sơ và doanh thu.',
    boundary: 'DashboardAdminUI',
    control: 'AdminController',
    entities: ['USERS', 'ENROLLMENT_FORMS', 'PAYMENTS'],
    endpoints: ['GET /api/admin/stats'],
    pre: 'Admin đã đăng nhập và có quyền admin/super_admin.',
    post: 'Dashboard hiển thị số liệu thống kê mới nhất.',
    special: 'Chỉ admin/super_admin được truy cập.',
    basic: [
      'Admin mở trang quản trị.',
      'Giao diện yêu cầu thống kê dashboard.',
      'Controller tổng hợp số người dùng, hồ sơ, doanh thu.',
      'Hệ thống trả dữ liệu thống kê.',
      'Giao diện hiển thị dashboard.',
    ],
    alternate: [
      'Không có quyền admin: hệ thống trả 403.',
      'Lỗi truy vấn dữ liệu: hiển thị thông báo lỗi.',
    ],
  },
  {
    id: 'UC12',
    name: 'Quản lý người dùng',
    actor: 'Quản trị viên',
    short: 'Cho phép admin xem, tìm kiếm, khóa/mở khóa tài khoản và đổi vai trò người dùng.',
    boundary: 'QuanLyNguoiDungUI',
    control: 'AdminController',
    entities: ['USERS'],
    endpoints: ['GET /api/admin/users', 'PATCH /api/admin/users/:id/toggle-active', 'PATCH /api/admin/users/:id/role'],
    pre: 'Admin đã đăng nhập.',
    post: 'Danh sách hoặc trạng thái tài khoản người dùng được cập nhật.',
    special: 'Không cho đổi sang role không hợp lệ.',
    basic: [
      'Admin mở trang quản lý người dùng.',
      'Giao diện tải danh sách người dùng có phân trang/tìm kiếm.',
      'Admin chọn khóa/mở khóa hoặc đổi vai trò.',
      'Controller cập nhật USERS.',
      'Hệ thống trả dữ liệu mới cho giao diện.',
    ],
    alternate: [
      'User không tồn tại: hệ thống báo lỗi.',
      'Role không hợp lệ: hệ thống từ chối cập nhật.',
    ],
  },
  {
    id: 'UC13',
    name: 'Quản lý hồ sơ tuyển sinh',
    actor: 'Quản trị viên',
    short: 'Cho phép admin xem, lọc, cập nhật trạng thái hồ sơ và xem lịch sử thay đổi.',
    boundary: 'QuanLyHoSoTuyenSinhUI',
    control: 'AdminController',
    entities: ['ENROLLMENT_FORMS', 'ENROLLMENT_LOGS', 'NOTIFICATIONS'],
    endpoints: ['GET /api/admin/enrollments', 'PUT /api/admin/enrollments/:id/status', 'GET /api/admin/enrollments/:id/logs'],
    pre: 'Admin đã đăng nhập.',
    post: 'Trạng thái hồ sơ và log thay đổi được cập nhật nếu admin thực hiện chỉnh sửa.',
    special: 'Mỗi thay đổi trạng thái quan trọng được ghi log.',
    basic: [
      'Admin mở trang quản lý hồ sơ.',
      'Giao diện tải danh sách hồ sơ theo bộ lọc.',
      'Admin xem chi tiết hoặc cập nhật trạng thái hồ sơ.',
      'Controller cập nhật ENROLLMENT_FORMS và ghi ENROLLMENT_LOGS.',
      'Hệ thống thông báo cho học viên nếu trạng thái quan trọng thay đổi.',
    ],
    alternate: [
      'Hồ sơ không tồn tại: hệ thống báo lỗi.',
      'Không có quyền admin: hệ thống trả 403.',
    ],
  },
  {
    id: 'UC14',
    name: 'Quản lý thi và điểm',
    actor: 'Quản trị viên',
    short: 'Cho phép admin quản lý lịch thi, phòng thi, xếp thí sinh, sinh mã phách, nhập và đồng bộ điểm.',
    boundary: 'QuanLyThiVaDiemUI',
    control: 'AdminController',
    entities: ['EXAM_SCHEDULES', 'EXAM_ROOMS', 'EXAM_REGISTRATIONS', 'EXAM_SCORES', 'ENROLLMENT_FORMS'],
    endpoints: ['GET/POST /api/admin/exam-schedules', 'GET/POST /api/admin/exam-schedules/:id/rooms', 'POST /api/admin/exam-schedules/:id/assign-by-date', 'POST /api/admin/exam-schedules/:id/generate-bags', 'POST /api/admin/exam-registrations/:id/score', 'POST /api/admin/exam-schedules/:id/sync-scores'],
    pre: 'Admin đã đăng nhập; có lịch thi và hồ sơ đủ điều kiện khi xếp thí sinh.',
    post: 'Lịch thi/phòng thi/đăng ký thi/điểm thi được cập nhật; hồ sơ học viên nhận kết quả khi đồng bộ điểm.',
    special: 'Chỉ đồng bộ điểm sau khi có điểm hợp lệ; ngưỡng đỗ quyết định pass_status.',
    basic: [
      'Admin tạo lịch thi và phòng thi.',
      'Admin xếp học viên vào kỳ thi hoặc xếp hàng loạt theo ngày.',
      'Admin xếp phòng, công bố phòng thi và sinh số túi/mã phách.',
      'Admin nhập điểm hoặc import điểm.',
      'Admin đồng bộ điểm để cập nhật kết quả vào hồ sơ học viên.',
    ],
    alternate: [
      'Lịch thi đầy/đóng: không xếp thêm thí sinh.',
      'Điểm ngoài khoảng 0-100: hệ thống báo lỗi.',
    ],
  },
  {
    id: 'UC15',
    name: 'Quản lý chương trình',
    actor: 'Quản trị viên',
    short: 'Cho phép admin tạo, cập nhật, vô hiệu hóa và xem danh sách chương trình đào tạo.',
    boundary: 'QuanLyChuongTrinhUI',
    control: 'AdminController',
    entities: ['TRAINING_PROGRAMS'],
    endpoints: ['GET /api/admin/programs', 'POST /api/admin/programs', 'PUT /api/admin/programs/:id', 'DELETE /api/admin/programs/:id'],
    pre: 'Admin đã đăng nhập.',
    post: 'Danh sách chương trình đào tạo được cập nhật.',
    special: 'Chương trình bị xóa theo hướng vô hiệu hóa is_active, không xóa cứng.',
    basic: [
      'Admin mở trang chương trình đào tạo.',
      'Giao diện tải danh sách chương trình.',
      'Admin thêm, sửa hoặc vô hiệu hóa chương trình.',
      'Controller cập nhật TRAINING_PROGRAMS.',
      'Hệ thống trả kết quả cho giao diện.',
    ],
    alternate: [
      'Thiếu thông tin bắt buộc: hệ thống báo lỗi.',
      'Chương trình không tồn tại: hệ thống báo lỗi.',
    ],
  },
  {
    id: 'UC16',
    name: 'Import / export dữ liệu',
    actor: 'Quản trị viên',
    short: 'Cho phép admin nhập hoặc xuất dữ liệu CSV cho người dùng, chương trình, lịch thi, điểm thi và hồ sơ.',
    boundary: 'ImportExportDuLieuUI',
    control: 'AdminController',
    entities: ['USERS', 'TRAINING_PROGRAMS', 'EXAM_SCHEDULES', 'EXAM_SCORES', 'ENROLLMENT_FORMS'],
    endpoints: ['GET /api/admin/export/*', 'POST /api/admin/import/*'],
    pre: 'Admin đã đăng nhập; file import đúng định dạng CSV.',
    post: 'Dữ liệu được xuất thành CSV hoặc được import/cập nhật vào hệ thống.',
    special: 'Import có thống kê created/updated/skipped/errors.',
    basic: [
      'Admin chọn chức năng import hoặc export.',
      'Nếu export, hệ thống truy vấn dữ liệu và trả file CSV.',
      'Nếu import, admin chọn file CSV.',
      'Controller parse CSV và validate từng dòng.',
      'Hệ thống tạo/cập nhật dữ liệu và trả kết quả import.',
    ],
    alternate: [
      'File sai định dạng hoặc thiếu cột bắt buộc: dòng dữ liệu bị bỏ qua.',
      'Không có dữ liệu export: trả file CSV chỉ có header hoặc danh sách rỗng.',
    ],
  },
  {
    id: 'UC17',
    name: 'Gửi thông báo',
    actor: 'Quản trị viên, Email Service',
    short: 'Cho phép admin gửi thông báo hàng loạt theo vai trò và lưu thông báo trong inbox người dùng.',
    boundary: 'GuiThongBaoUI',
    control: 'AdminController',
    entities: ['USERS', 'NOTIFICATIONS'],
    endpoints: ['POST /api/admin/notifications/broadcast'],
    pre: 'Admin đã đăng nhập; có tiêu đề và nội dung thông báo.',
    post: 'Thông báo được tạo cho các người dùng phù hợp; có thể gửi email nền.',
    special: 'Gửi theo role nếu admin chọn role cụ thể.',
    basic: [
      'Admin mở trang gửi thông báo.',
      'Admin nhập tiêu đề, nội dung, loại thông báo và vai trò nhận.',
      'Controller tìm danh sách user active phù hợp.',
      'Hệ thống tạo NOTIFICATIONS cho từng user.',
      'Email service gửi email nếu cấu hình yêu cầu.',
    ],
    alternate: [
      'Không có user phù hợp: số lượng gửi bằng 0.',
      'Gửi email lỗi: notification vẫn được lưu, lỗi email được log nền.',
    ],
  },
  {
    id: 'UC18',
    name: 'Quản lý nội dung / cấu hình',
    actor: 'Quản trị viên',
    short: 'Cho phép admin quản lý banner, tin tức và cấu hình hệ thống.',
    boundary: 'QuanLyNoiDungCauHinhUI',
    control: 'AdminController',
    entities: ['BANNERS', 'NEWS', 'SYSTEM_CONFIGS'],
    endpoints: ['GET/POST/PUT/DELETE /api/admin/banners', 'GET/POST/PUT/DELETE /api/admin/news', 'GET/POST /api/admin/configs'],
    pre: 'Admin đã đăng nhập.',
    post: 'Banner, tin tức hoặc cấu hình hệ thống được cập nhật.',
    special: 'Xóa banner/tin tức được xử lý theo hướng ẩn/lưu trữ thay vì xóa cứng.',
    basic: [
      'Admin mở trang nội dung.',
      'Giao diện tải banner, tin tức hoặc cấu hình.',
      'Admin tạo, cập nhật, ẩn/lưu trữ nội dung hoặc cập nhật cấu hình.',
      'Controller cập nhật BANNERS, NEWS hoặc SYSTEM_CONFIGS.',
      'Hệ thống trả dữ liệu mới cho giao diện.',
    ],
    alternate: [
      'Thiếu tiêu đề tin tức hoặc key cấu hình: hệ thống báo lỗi.',
      'Bản ghi không tồn tại: hệ thống báo lỗi.',
    ],
  },
];

const entityFields = {
  USERS: ['_id', 'email', 'password_hash', 'full_name', 'phone', 'role', 'is_active'],
  OTP_CODES: ['email', 'otp/code', 'type', 'expires_at', 'is_used'],
  REFRESH_TOKENS: ['user_id', 'token', 'expires_at'],
  ENROLLMENT_FORMS: ['user_id', 'current_step', 'status', 'payment_status', 'exam_score', 'program_id'],
  ENROLLMENT_LOGS: ['enrollment_id', 'changed_by', 'action', 'field_name', 'old_value', 'new_value'],
  BANNERS: ['title', 'subtitle', 'image_url', 'position', 'is_active', 'sort_order'],
  NEWS: ['title', 'slug', 'summary', 'content', 'category', 'status', 'published_at'],
  PAYMENTS: ['user_id', 'enrollment_id', 'amount', 'status', 'vnpay_ref'],
  INVOICES: ['invoice_number', 'amount', 'status', 'issued_at', 'paid_at'],
  EXAM_SCHEDULES: ['title', 'language', 'exam_date', 'location', 'max_slots', 'status'],
  EXAM_ROOMS: ['schedule_id', 'name', 'capacity', 'assigned_count', 'location'],
  EXAM_REGISTRATIONS: ['user_id', 'enrollment_id', 'schedule_id', 'exam_code', 'status'],
  EXAM_SCORES: ['registration_id', 'score', 'level_passed', 'pass_status', 'status'],
  TRAINING_PROGRAMS: ['language', 'name', 'level_code', 'min_score', 'tuition_fee', 'is_active'],
  COUNTERS: ['counter_key', 'current_value'],
  RECHECK_REQUESTS: ['user_id', 'registration_id', 'reason', 'status', 'admin_note'],
  INTERVIEWS: ['user_id', 'enrollment_id', 'title', 'scheduled_at', 'status'],
  NOTIFICATIONS: ['user_id', 'title', 'message', 'type', 'is_read'],
  SYSTEM_CONFIGS: ['key', 'value', 'group', 'description', 'updated_by'],
};

function classBox(x, y, w, title, stereotype, attrs, methods) {
  const headerH = 58;
  const attrH = Math.max(34, attrs.length * 20 + 16);
  const methodH = Math.max(34, methods.length * 20 + 16);
  const h = headerH + attrH + methodH;
  const attrLines = attrs.map((a, i) => `<text x="${x + 16}" y="${y + headerH + 24 + i * 20}" class="txt">- ${esc(a)}</text>`).join('\n');
  const methodLines = methods.map((m, i) => `<text x="${x + 16}" y="${y + headerH + attrH + 24 + i * 20}" class="txt">+ ${esc(m)}</text>`).join('\n');
  return `
  <rect x="${x}" y="${y}" width="${w}" height="${h}" class="box"/>
  <line x1="${x}" y1="${y + headerH}" x2="${x + w}" y2="${y + headerH}" class="plain"/>
  <line x1="${x}" y1="${y + headerH + attrH}" x2="${x + w}" y2="${y + headerH + attrH}" class="plain"/>
  <text x="${x + w / 2}" y="${y + 24}" text-anchor="middle" class="stereo">&lt;&lt;${stereotype}&gt;&gt;</text>
  <text x="${x + w / 2}" y="${y + 48}" text-anchor="middle" class="head">${esc(title)}</text>
  ${attrLines}
  ${methodLines}
`;
}

function analysisClassSvg(uc) {
  const entities = uc.entities.slice(0, 5);
  const h = Math.max(794, 180 + entities.length * 170);
  const entityBoxes = entities.map((entity, index) => classBox(
    760,
    88 + index * 165,
    320,
    entity,
    'entity',
    entityFields[entity] || ['_id'],
    ['find()', 'createOrUpdate()']
  )).join('\n');

  const entityLinks = entities.map((_, index) => {
    const y = 150 + index * 165;
    return `<line x1="700" y1="166" x2="760" y2="${y}" class="plain"/>
  <text x="714" y="${y - 8}" class="small">1</text>
  <text x="746" y="${y - 8}" class="small">n</text>`;
  }).join('\n');

  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="1123" height="${h}" viewBox="0 0 1123 ${h}">
<style>
  .box{fill:#fff;stroke:#222;stroke-width:1.5}
  .plain{stroke:#222;stroke-width:1.35;fill:none}
  .txt{font-family:Arial,Helvetica,sans-serif;font-size:14px;fill:#111}
  .head{font-family:Arial,Helvetica,sans-serif;font-size:16px;font-weight:700;fill:#111}
  .stereo{font-family:Arial,Helvetica,sans-serif;font-size:14px;fill:#111}
  .title{font-family:Arial,Helvetica,sans-serif;font-size:20px;font-weight:700;fill:#111}
  .small{font-family:Arial,Helvetica,sans-serif;font-size:13px;fill:#111}
</style>
<text x="561.5" y="34" text-anchor="middle" class="title">BIEU DO LOP PHAN TICH - ${esc(uc.id)} ${esc(uc.name.toUpperCase())}</text>
${classBox(42, 88, 320, uc.boundary, 'boundary', [], ['chonChucNang()', 'hienThiKetQua()'])}
${classBox(410, 88, 290, uc.control, 'control', [], ['xuLyYeuCau()', 'traKetQua()'])}
<line x1="362" y1="152" x2="410" y2="152" class="plain"/>
<text x="378" y="144" class="small">1</text>
<text x="396" y="144" class="small">1</text>
${entityBoxes}
${entityLinks}
</svg>`;
}

function actorSvg(x, y, label) {
  return `
  <circle cx="${x}" cy="${y - 46}" r="14" class="shape"/>
  <line x1="${x}" y1="${y - 32}" x2="${x}" y2="${y + 12}" class="actorLine"/>
  <line x1="${x - 30}" y1="${y - 12}" x2="${x + 30}" y2="${y - 12}" class="actorLine"/>
  <line x1="${x}" y1="${y + 12}" x2="${x - 28}" y2="${y + 50}" class="actorLine"/>
  <line x1="${x}" y1="${y + 12}" x2="${x + 28}" y2="${y + 50}" class="actorLine"/>
  <text x="${x}" y="${y + 78}" text-anchor="middle" class="head">: ${esc(label)}</text>`;
}

function sequenceSvg(uc) {
  const participants = [
    { key: 'actor', label: uc.actor.split('/')[0].trim(), x: 70, actor: true },
    { key: 'ui', label: uc.boundary, x: 330 },
    { key: 'controller', label: uc.control, x: 590 },
    { key: 'entity1', label: uc.entities[0] || 'DATABASE', x: 840 },
    { key: 'entity2', label: uc.entities[1] || uc.entities[0] || 'DATABASE', x: 1040 },
  ];

  const msg = (from, to, y, label, dashed = false) => {
    const p1 = participants.find((p) => p.key === from);
    const p2 = participants.find((p) => p.key === to);
    const cls = dashed ? 'return' : 'line';
    return `<path d="M${p1.x + (from === 'actor' ? 12 : 8)} ${y} L${p2.x - (to === 'actor' ? 12 : 8)} ${y}" class="${cls}"/>
  <text x="${Math.min(p1.x, p2.x) + 24}" y="${y - 8}" class="txt">${esc(label)}</text>`;
  };

  const y0 = 186;
  const steps = [
    msg('actor', 'ui', y0, `1: chon${uc.boundary.replace(/UI$/, '')}()`),
    msg('ui', 'ui', y0 + 46, '2: hienThiManHinh()'),
    msg('actor', 'ui', y0 + 102, '3: nhapThongTinVaXacNhan()'),
    msg('ui', 'controller', y0 + 158, '4: guiYeuCauXuLy()'),
    msg('controller', 'entity1', y0 + 214, `5: truyVan${uc.entities[0] || 'DuLieu'}()`),
    msg('entity1', 'controller', y0 + 270, '6: returnKetQua()', true),
    msg('controller', 'entity2', y0 + 326, `7: capNhatHoacDoc${uc.entities[1] || 'DuLieu'}()`),
    msg('entity2', 'controller', y0 + 382, '8: returnKetQua()', true),
    msg('controller', 'ui', y0 + 438, '9: returnKetQua()', true),
    msg('ui', 'ui', y0 + 494, '10: hienThiKetQua()'),
  ].join('\n');

  const heads = participants.map((p) => {
    if (p.actor) return actorSvg(p.x, 104, p.label);
    return `
  <circle cx="${p.x}" cy="76" r="30" class="shape"/>
  <line x1="${p.x - 55}" y1="76" x2="${p.x - 30}" y2="76" class="actorLine"/>
  <text x="${p.x}" y="128" text-anchor="middle" class="head">: ${esc(p.label)}</text>`;
  }).join('\n');

  const lifelines = participants.map((p) => `<line x1="${p.x}" y1="148" x2="${p.x}" y2="744" class="life"/>`).join('\n');
  const acts = participants.filter((p) => !p.actor).map((p) => `<rect x="${p.x - 6}" y="178" width="12" height="460" class="act"/>`).join('\n');

  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="1123" height="794" viewBox="0 0 1123 794">
<defs>
  <marker id="arrow" markerWidth="10" markerHeight="10" refX="8" refY="3" orient="auto" markerUnits="strokeWidth"><path d="M0,0 L0,6 L9,3 z" fill="#111"/></marker>
  <marker id="openArrow" markerWidth="10" markerHeight="10" refX="8" refY="3" orient="auto" markerUnits="strokeWidth"><path d="M0,0 L9,3 L0,6" fill="none" stroke="#111" stroke-width="1.2"/></marker>
</defs>
<style>
  .line{stroke:#111;stroke-width:1.45;fill:none;marker-end:url(#arrow)}
  .return{stroke:#111;stroke-width:1.35;stroke-dasharray:7 5;fill:none;marker-end:url(#openArrow)}
  .life{stroke:#111;stroke-width:1.25;stroke-dasharray:8 5}
  .act,.shape{fill:#fff;stroke:#111;stroke-width:1.3}
  .actorLine{stroke:#111;stroke-width:1.45;fill:none}
  .txt{font-family:Arial,Helvetica,sans-serif;font-size:14px;fill:#111}
  .head{font-family:Arial,Helvetica,sans-serif;font-size:14px;font-weight:700;fill:#111}
  .title{font-family:Arial,Helvetica,sans-serif;font-size:20px;font-weight:700;fill:#111}
</style>
<text x="561.5" y="34" text-anchor="middle" class="title">BIEU DO TUAN TU - ${esc(uc.id)} ${esc(uc.name.toUpperCase())}</text>
${heads}
${lifelines}
${acts}
${steps}
</svg>`;
}

function markdownDoc() {
  const parts = [
    '# Phân tích chi tiết các use case chính',
    '',
    'Tài liệu này bám theo các use case chính trong `docs/use-case-svg/10-api-use-case-main-a4.svg`. Mỗi use case có phần đặc tả, biểu đồ lớp phân tích và biểu đồ tuần tự tương ứng.',
    '',
  ];

  for (const uc of useCases) {
    const fileBase = `${uc.id}-${slug(uc.name)}`;
    parts.push(
      `## ${uc.id}. ${uc.name}`,
      '',
      `| Mục | Nội dung |`,
      `| --- | --- |`,
      `| Tác nhân | ${uc.actor} |`,
      `| Mô tả vắn tắt | ${uc.short} |`,
      `| API liên quan | ${uc.endpoints.map((e) => `\`${e}\``).join('<br>')} |`,
      `| Tiền điều kiện | ${uc.pre} |`,
      `| Hậu điều kiện | ${uc.post} |`,
      `| Yêu cầu đặc biệt | ${uc.special} |`,
      `| Điểm mở rộng | Không có hoặc được mô tả trong luồng rẽ nhánh. |`,
      '',
      '**Luồng cơ bản:**',
      '',
      ...uc.basic.map((step, index) => `${index + 1}. ${step}`),
      '',
      '**Luồng rẽ nhánh:**',
      '',
      ...uc.alternate.map((step, index) => `${index + 1}. ${step}`),
      '',
      `Biểu đồ lớp phân tích: [${fileBase}-class.svg](class-diagrams/${fileBase}-class.svg)`,
      '',
      `Biểu đồ tuần tự: [${fileBase}-sequence.svg](sequence-diagrams/${fileBase}-sequence.svg)`,
      '',
    );
  }
  return parts.join('\n');
}

for (const uc of useCases) {
  const fileBase = `${uc.id}-${slug(uc.name)}`;
  fs.writeFileSync(path.join(classDir, `${fileBase}-class.svg`), analysisClassSvg(uc), 'utf8');
  fs.writeFileSync(path.join(sequenceDir, `${fileBase}-sequence.svg`), sequenceSvg(uc), 'utf8');
}

fs.writeFileSync(path.join(outDir, 'use-case-analysis.md'), markdownDoc(), 'utf8');

console.log(`Generated ${useCases.length} use case specs, ${useCases.length} class diagrams, ${useCases.length} sequence diagrams.`);
