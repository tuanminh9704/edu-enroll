# Phân tích chi tiết các use case chính

Tài liệu này mô tả các use case chính của hệ thống tuyển sinh theo các mục: mô tả vắn tắt, luồng sự kiện, các yêu cầu đặc biệt, tiền điều kiện, hậu điều kiện và điểm mở rộng.

## 2.2.3. Biểu đồ hoạt động (Activity Diagram) cho các luồng nghiệp vụ chính

Biểu đồ hoạt động mô tả trình tự xử lý, các điểm rẽ nhánh và kết quả của những luồng nghiệp vụ quan trọng trong hệ thống tuyển sinh. Các biểu đồ được xây dựng theo nhóm chức năng chính để thể hiện rõ vai trò của người dùng, frontend, backend và các dịch vụ liên quan.

| Luồng nghiệp vụ | Use case liên quan | File biểu đồ |
| --- | --- | --- |
| Xem nội dung công khai | UC01 | [SVG](../diagrams/20-public-content-activity.svg) / [Mermaid](../diagrams/20-public-content-activity.mmd) |
| Đăng ký, đăng nhập và quản lý tài khoản | UC02, UC03 | [SVG](../diagrams/21-auth-account-activity.svg) / [Mermaid](../diagrams/21-auth-account-activity.mmd) |
| Lập và hoàn tất hồ sơ tuyển sinh | UC04, UC05, UC06, UC07, UC08 | [SVG](../diagrams/22-student-enrollment-activity.svg) / [Mermaid](../diagrams/22-student-enrollment-activity.mmd) |
| Phúc khảo, phỏng vấn, hóa đơn và thông báo | UC09, UC10 | [SVG](../diagrams/23-recheck-interview-notification-activity.svg) / [Mermaid](../diagrams/23-recheck-interview-notification-activity.mmd) |
| Quản trị hệ thống | UC11, UC12, UC13, UC14, UC15, UC16, UC17, UC18 | [SVG](../diagrams/24-admin-management-activity.svg) / [Mermaid](../diagrams/24-admin-management-activity.mmd) |

Ngoài các biểu đồ nhóm ở trên, use case quản lý tài khoản có thêm biểu đồ chi tiết: [SVG](../diagrams/19-account-management-activity.svg) / [Mermaid](../diagrams/19-account-management-activity.mmd).

## 2.3.1. Thiết kế kiến trúc hệ thống (Client - Server)

Hệ thống được thiết kế theo mô hình Client - Server. Phía client là ứng dụng React chạy trên trình duyệt, chịu trách nhiệm hiển thị giao diện, điều hướng trang và gửi yêu cầu HTTP đến API. Phía server là Node.js/Express API, xử lý xác thực, phân quyền, validate dữ liệu, nghiệp vụ tuyển sinh và kết nối cơ sở dữ liệu.

Biểu đồ kiến trúc: [SVG](../diagrams/25-client-server-architecture.svg) / [Mermaid](../diagrams/25-client-server-architecture.mmd)

| Thành phần | Vai trò |
| --- | --- |
| Client Layer | Cung cấp giao diện cho khách truy cập, học viên/phụ huynh và quản trị viên; gọi API bằng HTTP/HTTPS và gửi access token khi cần xác thực. |
| Network / REST API | Là kênh giao tiếp giữa frontend và backend, sử dụng dữ liệu JSON và JWT cho các API cần đăng nhập. |
| Server Layer | Bao gồm routes, middleware, controllers, services và models; chịu trách nhiệm xử lý nghiệp vụ, kiểm tra quyền và điều phối dữ liệu. |
| Data Layer | MongoDB lưu thông tin người dùng, hồ sơ tuyển sinh, lịch thi, điểm, hóa đơn, thông báo, banner, tin tức và cấu hình hệ thống. |
| External Services | VNPay xử lý thanh toán; Cloudinary lưu tệp upload; Email Service gửi OTP và thông báo. |

Luồng xử lý tổng quát:

1. Người dùng thao tác trên React App.
2. Frontend gửi request đến REST API kèm dữ liệu JSON và token nếu cần.
3. Backend đi qua middleware để kiểm tra CORS, xác thực, phân quyền và validate dữ liệu.
4. Controller gọi service để xử lý nghiệp vụ.
5. Service truy vấn hoặc cập nhật MongoDB thông qua Mongoose models.
6. Khi cần, service gọi VNPay, Cloudinary hoặc Email Service.
7. Backend trả response về frontend để giao diện cập nhật trạng thái cho người dùng.

## 2.3.2. Thiết kế cơ sở dữ liệu (Biểu đồ ERD, Các bảng dữ liệu chính)

MongoDB là một hệ quản trị cơ sở dữ liệu NoSQL mã nguồn mở, được sử dụng rộng rãi trong các ứng dụng web hiện đại nhờ khả năng lưu trữ dữ liệu linh hoạt, hiệu năng tốt và dễ mở rộng. Khác với mô hình cơ sở dữ liệu quan hệ truyền thống, MongoDB lưu dữ liệu dưới dạng document theo cấu trúc BSON gần giống JSON, giúp việc lưu trữ các dữ liệu có cấu trúc thay đổi như hồ sơ tuyển sinh, thông báo, lịch thi hoặc cấu hình hệ thống trở nên thuận tiện hơn.

Dưới đây là một số điểm nổi bật của MongoDB:

- Mã nguồn mở và linh hoạt: MongoDB cung cấp phiên bản Community Server miễn phí, phù hợp cho quá trình học tập, phát triển và triển khai thử nghiệm. Dữ liệu được tổ chức theo database, collection và document, giúp hệ thống dễ thay đổi cấu trúc dữ liệu khi nghiệp vụ phát triển.
- Mô hình document thân thiện với ứng dụng web: Dữ liệu được biểu diễn gần với JSON, phù hợp với backend Node.js/Express và frontend React vì dữ liệu trao đổi qua API cũng ở dạng JSON. Điều này giúp giảm độ phức tạp khi chuyển đổi dữ liệu giữa frontend, backend và cơ sở dữ liệu.
- Hiệu năng và khả năng mở rộng tốt: MongoDB hỗ trợ index, aggregation pipeline, replication và sharding, giúp tối ưu truy vấn, tăng độ sẵn sàng và mở rộng hệ thống khi lượng người dùng hoặc số lượng hồ sơ tuyển sinh tăng lên.
- Hỗ trợ tính toàn vẹn dữ liệu ở mức cần thiết: MongoDB cho phép định nghĩa schema ở tầng ứng dụng thông qua Mongoose, thiết lập các ràng buộc như required, unique, enum, default value và tham chiếu `ObjectId` giữa các collection. Ngoài ra, MongoDB cũng hỗ trợ transaction trong các trường hợp cần cập nhật nhiều collection có liên quan.

Trong đề tài này, hệ thống sử dụng MongoDB thông qua thư viện Mongoose. Vì vậy, các “bảng dữ liệu” trong thiết kế được hiểu là các collection chính. Quan hệ giữa các collection được thể hiện bằng trường `ObjectId` tham chiếu, ví dụ `user_id`, `enrollment_id`, `schedule_id`, `payment_id`.

Biểu đồ ERD: [SVG](../diagrams/26-database-erd.svg) / [Mermaid](../diagrams/26-database-erd.mmd)

| Collection | Mục đích | Trường dữ liệu chính | Quan hệ chính |
| --- | --- | --- | --- |
| `users` | Lưu tài khoản người dùng, học viên/phụ huynh và quản trị viên. | `email`, `password_hash`, `phone`, `full_name`, `preferred_language`, `role`, `is_active` | Một user có một hồ sơ tuyển sinh và nhiều token, payment, invoice, notification. |
| `refresh_tokens` | Lưu refresh token cho phiên đăng nhập. | `user_id`, `token`, `expires_at`, `created_at` | Tham chiếu `users`. |
| `otp_codes` | Lưu OTP đăng ký hoặc quên mật khẩu. | `email`, `otp`, `type`, `expires_at`, `is_used` | Gắn với email người dùng; tự hết hạn bằng TTL index. |
| `enrollment_forms` | Lưu hồ sơ tuyển sinh và tiến độ từng bước. | `user_id`, `current_step`, `status`, `signed_policy`, `payment_status`, `student_*`, `parent_*`, `exam_*`, `program_id`, `document_number` | Tham chiếu `users`, `exam_schedules`, `training_programs`; liên kết với payment, invoice, exam registration, log. |
| `payments` | Lưu giao dịch thanh toán lệ phí. | `user_id`, `enrollment_id`, `amount`, `status`, `vnpay_ref` | Tham chiếu `users`, `enrollment_forms`; có thể phát sinh invoice. |
| `invoices` | Lưu hóa đơn thanh toán. | `user_id`, `enrollment_id`, `payment_id`, `invoice_number`, `amount`, `status`, `issued_at`, `paid_at` | Tham chiếu `users`, `enrollment_forms`, `payments`. |
| `training_programs` | Lưu chương trình đào tạo để học viên chọn. | `language`, `name`, `level`, `level_code`, `duration_months`, `tuition_fee`, `min_score`, `is_active` | Được tham chiếu bởi `enrollment_forms.program_id`. |
| `exam_schedules` | Lưu lịch thi đầu vào. | `title`, `language`, `exam_date`, `location`, `format`, `max_slots`, `registered_slots`, `status`, `rooms_published` | Có nhiều phòng thi và đăng ký thi. |
| `exam_rooms` | Lưu phòng thi thuộc lịch thi. | `schedule_id`, `name`, `location`, `capacity`, `assigned_count` | Tham chiếu `exam_schedules`. |
| `exam_registrations` | Lưu đăng ký thi của học viên. | `user_id`, `enrollment_id`, `schedule_id`, `room_id`, `exam_code`, `bag_number`, `anonymous_code`, `status` | Tham chiếu `users`, `enrollment_forms`, `exam_schedules`, `exam_rooms`; có một điểm thi. |
| `exam_scores` | Lưu điểm thi đầu vào. | `registration_id`, `score`, `level_passed`, `pass_status`, `pass_threshold`, `status` | Tham chiếu `exam_registrations`. |
| `recheck_requests` | Lưu yêu cầu phúc khảo. | `user_id`, `enrollment_id`, `registration_id`, `reason`, `status`, `admin_note`, `resolved_by`, `resolved_at` | Tham chiếu user, hồ sơ và đăng ký thi. |
| `interviews` | Lưu lịch phỏng vấn và phản hồi. | `user_id`, `enrollment_id`, `title`, `scheduled_at`, `location`, `format`, `status`, `created_by` | Tham chiếu `users` và `enrollment_forms`. |
| `notifications` | Lưu thông báo trong inbox người dùng. | `user_id`, `title`, `message`, `type`, `link`, `is_read`, `created_at` | Tham chiếu `users`. |
| `enrollment_logs` | Lưu lịch sử thay đổi hồ sơ. | `enrollment_id`, `changed_by`, `action`, `field_name`, `old_value`, `new_value`, `created_at` | Tham chiếu `enrollment_forms` và `users`. |
| `banners` | Lưu banner hiển thị công khai. | `title`, `subtitle`, `image_url`, `link_url`, `position`, `is_active`, `sort_order` | Dữ liệu độc lập cho trang công khai. |
| `news` | Lưu tin tức/thông báo tuyển sinh công khai. | `title`, `slug`, `summary`, `content`, `category`, `status`, `published_at` | Dữ liệu độc lập cho trang công khai. |
| `system_configs` | Lưu cấu hình hệ thống. | `key`, `value`, `group`, `description`, `updated_by` | Có thể tham chiếu user cập nhật cấu hình. |
| `counters` | Lưu bộ đếm sinh mã hồ sơ hoặc mã tuần tự. | `counter_key`, `current_value` | Dữ liệu kỹ thuật phục vụ sinh mã. |

Các ràng buộc dữ liệu chính:

1. `users.email`, `news.slug`, `invoices.invoice_number`, `refresh_tokens.token`, `exam_registrations.exam_code`, `system_configs.key`, `counters.counter_key` là các giá trị duy nhất.
2. `enrollment_forms.user_id` là duy nhất để mỗi người dùng chỉ có một hồ sơ tuyển sinh chính.
3. `exam_scores.registration_id` là duy nhất để mỗi đăng ký thi chỉ có một kết quả điểm.
4. `otp_codes.expires_at` và `refresh_tokens.expires_at` sử dụng TTL index để tự hết hạn.
5. Các bản ghi nghiệp vụ quan trọng như hồ sơ, payment, invoice, điểm thi và log phải giữ được lịch sử phục vụ tra cứu và đối soát.

## 2.3.3. Thiết kế giao diện người dùng (Mockup/Wireframe các màn hình chính)

Giao diện người dùng được chia thành ba nhóm chính: giao diện công khai, giao diện người dùng đã đăng nhập và giao diện quản trị. Wireframe tập trung thể hiện bố cục, vùng chức năng chính và luồng điều hướng giữa các màn hình. Mỗi màn hình được tách thành một file SVG riêng và chỉ dùng hai màu trắng - đen.

Sơ đồ điều hướng màn hình: [Mermaid screen map](../diagrams/27-ui-wireframes.mmd)

| Nhóm màn hình | Route chính | Thành phần giao diện chính | Người dùng |
| --- | --- | --- | --- |
| Trang chủ công khai | `/` | Header, menu đăng nhập/đăng ký, banner tuyển sinh, danh sách tin tức/thông báo, nút kêu gọi đăng ký tuyển sinh. | [01-home.png](../diagrams/ui-wireframes/01-home.png) |
| Đăng nhập | `/dang-nhap` | Form email, mật khẩu, nút đăng nhập, liên kết quên mật khẩu và đăng ký tài khoản. | [02-login.png](../diagrams/ui-wireframes/02-login.png) |
| Đăng ký và xác thực OTP | `/dang-ky`, `/xac-thuc-otp` | Form đăng ký, form nhập mã OTP, nút xác thực và gửi lại OTP. | [03-register-otp.png](../diagrams/ui-wireframes/03-register-otp.png) |
| Hồ sơ cá nhân | `/ho-so-ca-nhan` | Form cập nhật họ tên, số điện thoại và đổi mật khẩu. | [04-profile.png](../diagrams/ui-wireframes/04-profile.png) |
| Hồ sơ tuyển sinh | `/ho-so` | Stepper 6 bước, form nhập liệu theo từng bước, khối trạng thái hồ sơ, nút lưu/tiếp tục. | [05-enrollment.png](../diagrams/ui-wireframes/05-enrollment.png) |
| Thông báo | `/thong-bao` | Danh sách thông báo, trạng thái đã đọc/chưa đọc, nút đánh dấu đã đọc. | [06-notifications.png](../diagrams/ui-wireframes/06-notifications.png) |
| Dashboard quản trị | `/quan-tri` | Sidebar admin, các thẻ thống kê, biểu đồ/bảng tổng quan hồ sơ và doanh thu. | [07-admin-dashboard.png](../diagrams/ui-wireframes/07-admin-dashboard.png) |
| Màn hình quản lý admin | `/quan-tri/*` | Bộ lọc, tìm kiếm, bảng dữ liệu và các thao tác thêm/sửa/khóa/xuất dữ liệu. | [08-admin-management.png](../diagrams/ui-wireframes/08-admin-management.png) |

Nguyên tắc thiết kế giao diện:

1. Các màn hình công khai ưu tiên thông tin tuyển sinh rõ ràng, dễ đọc và có lối vào đăng ký/đăng nhập.
2. Các màn hình hồ sơ tuyển sinh dùng stepper để người dùng biết đang ở bước nào và cần hoàn tất gì tiếp theo.
3. Các màn hình quản trị dùng sidebar, bộ lọc và bảng dữ liệu để hỗ trợ thao tác lặp lại, tìm kiếm và xử lý nhanh.
4. Các hành động quan trọng như thanh toán, đổi mật khẩu, cập nhật trạng thái hồ sơ hoặc đồng bộ điểm cần có thông báo kết quả rõ ràng.
5. Giao diện cần phản hồi các trạng thái rỗng, lỗi tải dữ liệu, thiếu quyền truy cập và phiên đăng nhập hết hạn.

## 3.1.1. Môi trường phát triển và cài đặt

Phần này mô tả môi trường phát triển và các bước cài đặt hệ thống tuyển sinh trực tuyến phục vụ quá trình xây dựng, kiểm thử và chạy thử đồ án tốt nghiệp. Hệ thống được triển khai theo mô hình Client - Server, gồm frontend React/Vite và backend Node.js/Express kết nối MongoDB.

### Môi trường phát triển

| Thành phần | Công nghệ sử dụng | Ghi chú |
| --- | --- | --- |
| Hệ điều hành | Windows 10/11 hoặc tương đương | Môi trường phát triển cục bộ. |
| Runtime | Node.js `v18.18.0`, npm `9.8.1` | Dùng để chạy frontend và backend. |
| Frontend | React `19`, Vite `5`, TypeScript, Ant Design, React Router, Axios, Zustand | Thư mục `edu-enroll-app`. |
| Backend | Node.js, Express `4`, TypeScript, Mongoose, JWT, Zod, Multer, Nodemailer | Thư mục `edu-enroll-api`. |
| Cơ sở dữ liệu | MongoDB | Kết nối qua Mongoose bằng `MONGODB_URI`. |
| Thanh toán | VNPay Sandbox | Dùng cho thanh toán lệ phí hồ sơ. |
| Lưu trữ tệp | Cloudinary | Dùng cho upload hồ sơ/tệp minh chứng. |
| Email | SMTP/Nodemailer | Dùng gửi OTP và thông báo. |
| Công cụ kiểm thử | Vitest, Jest, Supertest, mongodb-memory-server | Dùng cho kiểm thử frontend và backend. |

### Cấu trúc thư mục cài đặt

```txt
edu-enroll/
├── edu-enroll-app/      Frontend React/Vite
├── edu-enroll-api/      Backend Express/Mongoose
└── docs/                Tài liệu, biểu đồ và báo cáo
```

### Cấu hình biến môi trường backend

Backend sử dụng file `.env` trong thư mục `edu-enroll-api`. Có thể tạo file này dựa trên `.env.example`.

```env
PORT=3001
NODE_ENV=development
MONGODB_URI=mongodb://localhost:27017/lingua-academy
FRONTEND_URL=http://localhost:5173

JWT_SECRET=change-me
JWT_REFRESH_SECRET=change-me-refresh
JWT_EXPIRES_IN=15m
JWT_REFRESH_EXPIRES_IN=7d

SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=
SMTP_PASS=
SMTP_FROM=noreply@lingua.vn

VNPAY_TMN_CODE=LINGUA001
VNPAY_HASH_SECRET=secret
VNPAY_URL=https://sandbox.vnpayment.vn/paymentv2/vpcpay.html
VNPAY_RETURN_URL=http://localhost:3001/api/payments/callback

CLOUDINARY_CLOUD_NAME=your-cloud-name
CLOUDINARY_API_KEY=your-api-key
CLOUDINARY_API_SECRET=your-api-secret
CLOUDINARY_FOLDER=edu-enroll
```

Các biến quan trọng:

| Biến | Ý nghĩa |
| --- | --- |
| `PORT` | Cổng chạy backend, mặc định `3001`. |
| `MONGODB_URI` | Chuỗi kết nối MongoDB. |
| `FRONTEND_URL` | URL frontend được phép gọi API qua CORS. |
| `JWT_SECRET`, `JWT_REFRESH_SECRET` | Khóa ký access token và refresh token. |
| `SMTP_*` | Cấu hình máy chủ gửi email OTP/thông báo. |
| `VNPAY_*` | Cấu hình thanh toán VNPay Sandbox. |
| `CLOUDINARY_*` | Cấu hình upload tệp lên Cloudinary. |

### Các bước cài đặt backend

```bash
cd edu-enroll-api
npm install
copy .env.example .env
npm run seed
npm run dev
```

Sau khi chạy thành công, backend hoạt động tại:

```txt
http://localhost:3001
```

Có thể kiểm tra API bằng endpoint:

```txt
GET http://localhost:3001/health
```

### Các bước cài đặt frontend

```bash
cd edu-enroll-app
npm install
npm run dev
```

Sau khi chạy thành công, frontend hoạt động tại:

```txt
http://localhost:5173
```

### Lệnh build và kiểm thử

Frontend:

```bash
cd edu-enroll-app
npm run build
npm run test
```

Backend:

```bash
cd edu-enroll-api
npm run build
npm run test
```

### Quy trình chạy thử hệ thống

1. Khởi động MongoDB cục bộ hoặc đảm bảo `MONGODB_URI` trỏ đến MongoDB đang hoạt động.
2. Cài đặt package cho backend và frontend bằng `npm install`.
3. Tạo file `.env` cho backend và cấu hình các biến cần thiết.
4. Chạy seed dữ liệu mẫu bằng `npm run seed` nếu cần dữ liệu ban đầu.
5. Chạy backend bằng `npm run dev` tại thư mục `edu-enroll-api`.
6. Chạy frontend bằng `npm run dev` tại thư mục `edu-enroll-app`.
7. Mở trình duyệt tại `http://localhost:5173` để kiểm tra các chức năng: xem nội dung công khai, đăng ký/đăng nhập, lập hồ sơ tuyển sinh và trang quản trị.

## 3.3.2. Kiểm thử hệ thống

Nội dung kiểm thử chi tiết được trình bày trong tài liệu: [test-cases.md](../testing/test-cases.md).

Tài liệu kiểm thử gồm các nhóm testcase chính:

1. Đăng nhập.
2. Đăng ký và xác thực OTP.
3. Xem nội dung công khai.
4. Quản lý tài khoản.
5. Lập hồ sơ tuyển sinh.
6. Thanh toán lệ phí.
7. Đăng ký và xem kết quả thi.
8. Chọn chương trình và nộp hồ sơ gốc.
9. Xem thông báo và hóa đơn.
10. Quản trị dashboard và người dùng.
11. Quản lý hồ sơ, kỳ thi và điểm.
12. Quản lý chương trình, nội dung và import/export.

Kết quả tổng hợp: 62 testcase, Pass 62, Fail 0.

## UC01. Xem nội dung công khai

**Mô tả vắn tắt:** Use case này cho phép khách truy cập, học viên/phụ huynh hoặc quản trị viên xem các nội dung công khai của hệ thống tuyển sinh như trang chủ, banner, thông báo tuyển sinh và tin tức. Người dùng không cần đăng nhập để xem các nội dung này.

**Luồng sự kiện:**

Luồng cơ bản:

1. Người dùng truy cập trang chủ hệ thống.
2. Frontend gửi yêu cầu lấy banner và tin tức công khai đến API.
3. Hệ thống truy vấn danh sách banner đang hoạt động và tin tức đã xuất bản.
4. Hệ thống trả dữ liệu về cho giao diện.
5. Giao diện hiển thị nội dung công khai cho người dùng. Use case kết thúc.

Luồng rẽ nhánh:

1. Nếu không có banner hoặc tin tức nào đang được công khai, hệ thống hiển thị trang chủ với nội dung mặc định hoặc danh sách rỗng.
2. Nếu người dùng mở chi tiết một tin tức không tồn tại hoặc chưa được xuất bản, hệ thống hiển thị thông báo tin tức không tồn tại.
3. Nếu hệ thống không kết nối được cơ sở dữ liệu hoặc API lỗi, giao diện hiển thị thông báo lỗi hoặc không tải được nội dung.

**Các yêu cầu đặc biệt:** Chỉ hiển thị banner có trạng thái `is_active = true`. Chỉ hiển thị tin tức có trạng thái `published`. Nội dung công khai không yêu cầu đăng nhập.

**Tiền điều kiện:** Hệ thống đang hoạt động. Cơ sở dữ liệu có thể có hoặc không có dữ liệu banner/tin tức công khai.

**Hậu điều kiện:** Không làm thay đổi dữ liệu trong hệ thống. Người dùng xem được nội dung công khai nếu dữ liệu tồn tại.

**Điểm mở rộng:** Người dùng có thể chuyển sang đăng ký tài khoản, đăng nhập hoặc xem chi tiết tin tức tuyển sinh.

## UC02. Đăng ký / đăng nhập

**Mô tả vắn tắt:** Use case này cho phép học viên, phụ huynh hoặc quản trị viên đăng ký tài khoản, xác thực OTP, đăng nhập, đăng xuất và làm mới phiên đăng nhập để sử dụng các chức năng phù hợp với vai trò.

**Luồng sự kiện:**

Luồng cơ bản:

1. Người dùng chọn chức năng đăng ký hoặc đăng nhập.
2. Giao diện hiển thị form tương ứng.
3. Người dùng nhập thông tin và gửi yêu cầu đến hệ thống.
4. Hệ thống kiểm tra dữ liệu đăng ký, thông tin đăng nhập, OTP hoặc refresh token.
5. Nếu thông tin hợp lệ, hệ thống tạo hoặc xác thực phiên đăng nhập.
6. Giao diện chuyển người dùng đến trang phù hợp với vai trò. Use case kết thúc.

Luồng rẽ nhánh:

1. Nếu email đã tồn tại khi đăng ký, hệ thống hiển thị thông báo tài khoản đã được sử dụng.
2. Nếu OTP sai hoặc hết hạn, hệ thống yêu cầu người dùng nhập lại hoặc gửi lại OTP.
3. Nếu email/mật khẩu không đúng, hệ thống hiển thị lỗi đăng nhập.
4. Nếu tài khoản chưa xác thực hoặc bị khóa, hệ thống từ chối đăng nhập.
5. Nếu refresh token không hợp lệ hoặc đã hết hạn, hệ thống yêu cầu đăng nhập lại.

**Các yêu cầu đặc biệt:** Mật khẩu phải được mã hóa/hash trước khi lưu. OTP có thời hạn sử dụng. Refresh token phải được lưu và kiểm soát trạng thái hợp lệ trong hệ thống.

**Tiền điều kiện:** Người dùng có email hợp lệ. Với đăng nhập, tài khoản đã được tạo và có trạng thái cho phép đăng nhập.

**Hậu điều kiện:** Đăng ký thành công tạo tài khoản chờ xác thực OTP. Đăng nhập thành công tạo access token và refresh token. Đăng xuất hoặc đổi phiên làm refresh token cũ không còn được sử dụng.

**Điểm mở rộng:** Người dùng có thể gửi lại OTP, chuyển sang quên mật khẩu, vào trang hồ sơ cá nhân hoặc tiếp tục lập hồ sơ tuyển sinh.

## UC03. Quản lý tài khoản

**Mô tả vắn tắt:** Use case này cho phép người dùng đã đăng nhập xem thông tin tài khoản, cập nhật hồ sơ cá nhân và đổi mật khẩu. Người dùng chỉ được thao tác trên tài khoản của chính mình; quản trị viên có thể truy cập thông tin tài khoản theo quyền được cấp.

**Luồng sự kiện:**

Luồng cơ bản:

1. Người dùng đã đăng nhập mở trang quản lý tài khoản hoặc hồ sơ cá nhân.
2. Frontend gửi yêu cầu lấy thông tin tài khoản hiện tại đến API.
3. Hệ thống xác thực token và truy vấn thông tin người dùng trong cơ sở dữ liệu.
4. Hệ thống trả thông tin tài khoản về cho giao diện.
5. Người dùng chỉnh sửa thông tin cá nhân hoặc chọn đổi mật khẩu.
6. Frontend gửi dữ liệu cập nhật đến API tương ứng.
7. Hệ thống kiểm tra quyền sở hữu tài khoản, validate dữ liệu và cập nhật thông tin.
8. Hệ thống trả kết quả cập nhật thành công; giao diện hiển thị thông tin mới cho người dùng. Use case kết thúc.

Luồng rẽ nhánh:

1. Nếu token hết hạn hoặc không hợp lệ, hệ thống từ chối yêu cầu và giao diện yêu cầu người dùng đăng nhập lại.
2. Nếu tài khoản không tồn tại hoặc đã bị khóa, hệ thống hiển thị thông báo không thể truy cập tài khoản.
3. Nếu dữ liệu cập nhật không hợp lệ, hệ thống hiển thị lỗi và không lưu thay đổi.
4. Nếu người dùng đổi mật khẩu nhưng mật khẩu hiện tại không đúng, hệ thống từ chối đổi mật khẩu.
5. Nếu mật khẩu mới không đạt yêu cầu bảo mật hoặc trùng với mật khẩu cũ, hệ thống yêu cầu nhập mật khẩu khác.
6. Nếu API hoặc cơ sở dữ liệu lỗi trong quá trình cập nhật, giao diện hiển thị thông báo không thể lưu thay đổi.

**Các yêu cầu đặc biệt:** Chỉ chủ tài khoản được cập nhật thông tin cá nhân của mình. Mật khẩu hiện tại phải được xác thực trước khi đổi mật khẩu mới. Dữ liệu cập nhật phải được kiểm tra hợp lệ ở backend.

**Tiền điều kiện:** Người dùng đã đăng nhập bằng tài khoản hợp lệ. Token truy cập còn hiệu lực.

**Hậu điều kiện:** Thông tin tài khoản hoặc mật khẩu được cập nhật nếu dữ liệu hợp lệ. Khi đổi mật khẩu thành công, refresh token cũ bị vô hiệu.

**Điểm mở rộng:** Người dùng có thể đăng xuất, xem thông báo/hóa đơn hoặc chuyển sang lập hồ sơ tuyển sinh sau khi quản lý tài khoản.

**Activity Diagram:** [19-account-management-activity.svg](../diagrams/19-account-management-activity.svg)

## UC04. Lập hồ sơ tuyển sinh

**Mô tả vắn tắt:** Use case này cho phép học viên hoặc phụ huynh khởi tạo hồ sơ tuyển sinh, ký chính sách tuyển sinh và nhập thông tin cần thiết cho quá trình xét tuyển.

**Luồng sự kiện:**

Luồng cơ bản:

1. Người dùng đăng nhập và mở trang hồ sơ tuyển sinh.
2. Hệ thống kiểm tra hồ sơ hiện có hoặc khởi tạo hồ sơ mới nếu chưa tồn tại.
3. Người dùng đọc và ký xác nhận chính sách tuyển sinh.
4. Người dùng nhập thông tin học viên, phụ huynh, ngôn ngữ, cấp độ và lịch học mong muốn.
5. Frontend gửi dữ liệu hồ sơ đến API.
6. Hệ thống validate dữ liệu, lưu hồ sơ và ghi nhận tiến độ hiện tại.
7. Hệ thống trả kết quả để giao diện chuyển sang bước tiếp theo. Use case kết thúc.

Luồng rẽ nhánh:

1. Nếu người dùng chưa ký chính sách, hệ thống không cho tiếp tục các bước sau.
2. Nếu dữ liệu hồ sơ thiếu hoặc sai định dạng, hệ thống hiển thị lỗi và yêu cầu nhập lại.
3. Nếu người dùng chưa thanh toán lệ phí ở bước yêu cầu thanh toán, hệ thống không cho nộp thông tin tiếp theo.
4. Nếu upload tệp minh chứng thất bại, giao diện thông báo lỗi và cho phép tải lại.

**Các yêu cầu đặc biệt:** Thông tin quan trọng phải được validate ở backend. Ký chính sách tuyển sinh là điều kiện trước khi thanh toán. Mọi thay đổi tiến độ hồ sơ quan trọng cần được ghi log.

**Tiền điều kiện:** Người dùng đã đăng nhập. Hệ thống tuyển sinh đang mở hoặc cho phép tạo hồ sơ.

**Hậu điều kiện:** Hồ sơ tuyển sinh được tạo hoặc cập nhật. Tiến độ hồ sơ được lưu theo bước hiện tại và log được ghi nhận.

**Điểm mở rộng:** Người dùng có thể chuyển sang thanh toán lệ phí, tải tệp đính kèm hoặc xem trạng thái hồ sơ.

## UC05. Thanh toán lệ phí

**Mô tả vắn tắt:** Use case này cho phép học viên hoặc phụ huynh thanh toán lệ phí hồ sơ tuyển sinh qua VNPay và cập nhật trạng thái thanh toán trong hệ thống.

**Luồng sự kiện:**

Luồng cơ bản:

1. Người dùng mở bước thanh toán lệ phí trong hồ sơ tuyển sinh.
2. Người dùng chọn thanh toán qua VNPay.
3. Hệ thống tạo URL thanh toán và chuyển người dùng sang cổng thanh toán.
4. Người dùng thực hiện thanh toán trên VNPay.
5. VNPay gửi kết quả callback về hệ thống.
6. Hệ thống xác thực callback và cập nhật trạng thái thanh toán, hóa đơn, hồ sơ.
7. Giao diện hiển thị kết quả thanh toán cho người dùng. Use case kết thúc.

Luồng rẽ nhánh:

1. Nếu thanh toán thất bại, hệ thống ghi nhận trạng thái thất bại và cho phép người dùng thanh toán lại.
2. Nếu chữ ký callback không hợp lệ, hệ thống từ chối cập nhật giao dịch.
3. Nếu hồ sơ đã thanh toán, hệ thống không tạo thanh toán trùng.
4. Nếu người dùng đóng trình duyệt trước khi quay lại hệ thống, trạng thái được xác định theo callback hoặc truy vấn giao dịch.

**Các yêu cầu đặc biệt:** Callback VNPay phải được kiểm tra secure hash, mã phản hồi và trạng thái giao dịch. Không được cập nhật thành công cho giao dịch không hợp lệ.

**Tiền điều kiện:** Người dùng đã đăng nhập và đã ký chính sách tuyển sinh. Hồ sơ chưa thanh toán lệ phí.

**Hậu điều kiện:** Thanh toán thành công tạo hoặc cập nhật payment/invoice và chuyển hồ sơ sang bước điền thông tin tiếp theo.

**Điểm mở rộng:** Người dùng có thể thanh toán lại, xem hóa đơn hoặc tiếp tục hoàn thiện hồ sơ tuyển sinh.

## UC06. Đăng ký / xem kết quả thi

**Mô tả vắn tắt:** Use case này cho phép học viên/phụ huynh đăng ký lịch kiểm tra đầu vào, bỏ qua thi nếu đủ điều kiện và xem kết quả sau khi quản trị viên nhập hoặc đồng bộ điểm.

**Luồng sự kiện:**

Luồng cơ bản:

1. Người dùng mở bước kiểm tra năng lực trong hồ sơ tuyển sinh.
2. Hệ thống hiển thị danh sách lịch thi phù hợp với ngôn ngữ hoặc cấp độ đã đăng ký.
3. Người dùng chọn lịch thi hoặc chọn bỏ qua thi nếu thuộc trường hợp được miễn.
4. Hệ thống ghi nhận đăng ký thi hoặc trạng thái bỏ qua thi.
5. Sau khi admin nhập và đồng bộ điểm, người dùng mở lại trang kết quả thi.
6. Hệ thống hiển thị điểm, trạng thái đạt/không đạt và hướng xử lý tiếp theo. Use case kết thúc.

Luồng rẽ nhánh:

1. Nếu lịch thi đã đầy hoặc đã đóng, hệ thống không cho đăng ký và hiển thị thông báo.
2. Nếu hồ sơ chưa đủ điều kiện đăng ký thi, hệ thống yêu cầu hoàn thành các bước trước.
3. Nếu chưa có điểm hoặc điểm chưa được đồng bộ, hệ thống thông báo chưa có kết quả.
4. Nếu kết quả không đạt, hệ thống có thể cho phép phúc khảo hoặc chờ lịch xử lý khác.

**Các yêu cầu đặc biệt:** Chỉ được đổi lịch thi khi chưa có điểm. Chỉ hiển thị kết quả khi điểm đã được đồng bộ hợp lệ.

**Tiền điều kiện:** Hồ sơ đã hoàn thành thông tin tuyển sinh và đủ điều kiện đến bước kiểm tra năng lực.

**Hậu điều kiện:** Người dùng có đăng ký thi hoặc được bỏ qua thi. Kết quả thi được hiển thị khi đã có điểm đồng bộ.

**Điểm mở rộng:** Người dùng có thể gửi phúc khảo, xem lịch phỏng vấn hoặc chuyển sang bước chọn chương trình nếu đạt điều kiện.

## UC07. Chọn chương trình học

**Mô tả vắn tắt:** Use case này cho phép học viên/phụ huynh chọn chương trình đào tạo phù hợp với ngôn ngữ, cấp độ và kết quả kiểm tra đầu vào.

**Luồng sự kiện:**

Luồng cơ bản:

1. Người dùng mở bước chọn chương trình học.
2. Hệ thống kiểm tra hồ sơ, ngôn ngữ, cấp độ và kết quả thi nếu có.
3. Hệ thống hiển thị danh sách chương trình đủ điều kiện.
4. Người dùng chọn một chương trình đào tạo.
5. Hệ thống kiểm tra lại điều kiện chọn chương trình.
6. Hệ thống lưu chương trình, tên chương trình và học phí vào hồ sơ.
7. Giao diện chuyển người dùng sang bước nộp hồ sơ gốc. Use case kết thúc.

Luồng rẽ nhánh:

1. Nếu người dùng chưa đạt ngưỡng điểm, hệ thống không hiển thị chương trình để chọn.
2. Nếu chương trình đã bị vô hiệu hóa hoặc không còn phù hợp, hệ thống từ chối lựa chọn.
3. Nếu người dùng chọn chương trình không đủ điều kiện, hệ thống hiển thị lỗi.

**Các yêu cầu đặc biệt:** Chỉ hiển thị các chương trình đủ điều kiện theo điểm đã đồng bộ, ngôn ngữ, cấp độ và ngưỡng tối thiểu.

**Tiền điều kiện:** Người dùng đã đạt điều kiện qua thi hoặc thuộc cấp độ không cần thi.

**Hậu điều kiện:** Hồ sơ lưu thông tin chương trình đã chọn, học phí tương ứng và chuyển sang bước nộp hồ sơ gốc.

**Điểm mở rộng:** Người dùng có thể quay lại xem kết quả thi, đổi chương trình nếu hệ thống còn cho phép hoặc tiếp tục nộp hồ sơ gốc.

## UC08. Nộp hồ sơ gốc

**Mô tả vắn tắt:** Use case này cho phép học viên/phụ huynh đăng ký ngày nộp hồ sơ gốc, chọn nhu cầu mua sách và hoàn tất hồ sơ tuyển sinh.

**Luồng sự kiện:**

Luồng cơ bản:

1. Người dùng mở bước nộp hồ sơ gốc.
2. Giao diện hiển thị thông tin chương trình đã chọn và các trường cần hoàn tất.
3. Người dùng chọn ngày hẹn nộp hồ sơ gốc, nhu cầu mua sách và nhập ghi chú nếu có.
4. Frontend gửi thông tin đến API.
5. Hệ thống sinh mã hồ sơ nếu hồ sơ chưa có mã.
6. Hệ thống cập nhật trạng thái hồ sơ thành hoàn tất và tạo thông báo.
7. Giao diện hiển thị kết quả hoàn tất hồ sơ. Use case kết thúc.

Luồng rẽ nhánh:

1. Nếu thiếu ngày hẹn hoặc dữ liệu không hợp lệ, hệ thống hiển thị lỗi.
2. Nếu hồ sơ đã có mã hồ sơ, hệ thống dùng lại mã cũ và không sinh mã mới.
3. Nếu người dùng chưa chọn chương trình học, hệ thống không cho nộp hồ sơ gốc.
4. Nếu hệ thống lỗi khi tạo thông báo, hồ sơ vẫn được lưu nhưng lỗi được ghi nhận.

**Các yêu cầu đặc biệt:** Mã hồ sơ được sinh ở backend bằng counter, không sinh ở frontend. Hồ sơ chỉ hoàn tất khi đã đủ dữ liệu bắt buộc.

**Tiền điều kiện:** Người dùng đã chọn chương trình đào tạo hợp lệ.

**Hậu điều kiện:** Hồ sơ có mã hồ sơ, ngày hẹn nộp bản gốc và trạng thái hoàn tất.

**Điểm mở rộng:** Người dùng có thể xem hóa đơn, xem thông báo hoặc theo dõi trạng thái xử lý hồ sơ sau khi hoàn tất.

## UC09. Phúc khảo / phỏng vấn

**Mô tả vắn tắt:** Use case này cho phép học viên/phụ huynh gửi yêu cầu phúc khảo, xem lịch phỏng vấn và xác nhận tham gia; quản trị viên xử lý yêu cầu phúc khảo và quản lý lịch phỏng vấn.

**Luồng sự kiện:**

Luồng cơ bản:

1. Người dùng mở chức năng phúc khảo hoặc phỏng vấn.
2. Người dùng gửi yêu cầu phúc khảo hoặc xem lịch phỏng vấn được phân công.
3. Hệ thống lưu yêu cầu hoặc trạng thái phản hồi của người dùng.
4. Quản trị viên xem danh sách yêu cầu phúc khảo hoặc tạo/cập nhật lịch phỏng vấn.
5. Quản trị viên cập nhật kết quả xử lý.
6. Hệ thống thông báo kết quả cho người dùng. Use case kết thúc.

Luồng rẽ nhánh:

1. Nếu đã có yêu cầu phúc khảo đang chờ xử lý cho cùng một đăng ký thi, hệ thống không cho tạo thêm.
2. Nếu lịch phỏng vấn không tồn tại hoặc đã hết hạn phản hồi, hệ thống hiển thị lỗi.
3. Nếu người dùng không thuộc hồ sơ liên quan, hệ thống từ chối truy cập.
4. Nếu admin cập nhật thiếu thông tin kết quả, hệ thống yêu cầu bổ sung.

**Các yêu cầu đặc biệt:** Không cho tạo nhiều yêu cầu phúc khảo đang chờ xử lý cho cùng một đăng ký thi. Lịch phỏng vấn chỉ được phản hồi bởi đúng người dùng liên quan.

**Tiền điều kiện:** Người dùng đã có hồ sơ. Với phúc khảo, người dùng đã có đăng ký thi hoặc kết quả thi cần phúc khảo.

**Hậu điều kiện:** Yêu cầu phúc khảo hoặc trạng thái phỏng vấn được cập nhật. Người dùng nhận được thông báo kết quả khi có thay đổi.

**Điểm mở rộng:** Người dùng có thể xem kết quả thi, theo dõi thông báo hoặc tiếp tục các bước tuyển sinh sau khi xử lý xong.

## UC10. Xem hóa đơn / thông báo

**Mô tả vắn tắt:** Use case này cho phép học viên/phụ huynh hoặc quản trị viên xem hóa đơn, xem thông báo và đánh dấu thông báo đã đọc.

**Luồng sự kiện:**

Luồng cơ bản:

1. Người dùng đăng nhập và mở trang hóa đơn hoặc thông báo.
2. Frontend gửi yêu cầu lấy danh sách dữ liệu tương ứng.
3. Hệ thống xác thực người dùng và truy vấn hóa đơn/thông báo theo tài khoản.
4. Hệ thống trả danh sách về giao diện.
5. Người dùng xem chi tiết hoặc đánh dấu thông báo đã đọc.
6. Hệ thống cập nhật trạng thái đã đọc nếu có thao tác. Use case kết thúc.

Luồng rẽ nhánh:

1. Nếu không có hóa đơn hoặc thông báo, giao diện hiển thị danh sách rỗng.
2. Nếu token hết hạn, hệ thống yêu cầu người dùng đăng nhập lại.
3. Nếu thông báo không thuộc tài khoản hiện tại, hệ thống từ chối truy cập.
4. Nếu cập nhật trạng thái đã đọc thất bại, giao diện hiển thị lỗi.

**Các yêu cầu đặc biệt:** Người dùng chỉ xem hóa đơn và thông báo thuộc tài khoản của mình. Thông báo chưa đọc cần được đếm chính xác.

**Tiền điều kiện:** Người dùng đã đăng nhập.

**Hậu điều kiện:** Danh sách hóa đơn/thông báo được hiển thị. Trạng thái đọc của thông báo có thể được cập nhật.

**Điểm mở rộng:** Người dùng có thể mở chi tiết hóa đơn, quay lại hồ sơ tuyển sinh hoặc xem các thông báo liên quan đến phúc khảo/phỏng vấn.

## UC11. Xem dashboard

**Mô tả vắn tắt:** Use case này cho phép quản trị viên xem thống kê tổng quan về người dùng, hồ sơ tuyển sinh, doanh thu và các số liệu vận hành chính của hệ thống.

**Luồng sự kiện:**

Luồng cơ bản:

1. Quản trị viên đăng nhập và mở trang dashboard.
2. Frontend gửi yêu cầu lấy dữ liệu thống kê.
3. Hệ thống kiểm tra quyền quản trị.
4. Hệ thống tổng hợp số liệu người dùng, hồ sơ, thanh toán và doanh thu.
5. Hệ thống trả dữ liệu thống kê về giao diện.
6. Giao diện hiển thị dashboard cho quản trị viên. Use case kết thúc.

Luồng rẽ nhánh:

1. Nếu người dùng không có quyền admin/super admin, hệ thống trả lỗi không có quyền truy cập.
2. Nếu lỗi truy vấn dữ liệu, giao diện hiển thị thông báo không tải được dashboard.
3. Nếu chưa có dữ liệu thống kê, dashboard hiển thị giá trị bằng 0 hoặc danh sách rỗng.

**Các yêu cầu đặc biệt:** Chỉ admin/super admin được truy cập dashboard. Số liệu thống kê cần được tổng hợp theo dữ liệu mới nhất.

**Tiền điều kiện:** Quản trị viên đã đăng nhập và có quyền admin/super admin.

**Hậu điều kiện:** Dashboard hiển thị số liệu tổng quan mới nhất mà không làm thay đổi dữ liệu hệ thống.

**Điểm mở rộng:** Quản trị viên có thể chuyển sang quản lý người dùng, hồ sơ, thi/điểm hoặc xuất báo cáo.

## UC12. Quản lý người dùng

**Mô tả vắn tắt:** Use case này cho phép quản trị viên xem, tìm kiếm, lọc, khóa/mở khóa tài khoản và thay đổi vai trò người dùng trong hệ thống.

**Luồng sự kiện:**

Luồng cơ bản:

1. Quản trị viên mở trang quản lý người dùng.
2. Frontend gửi yêu cầu lấy danh sách người dùng có phân trang, tìm kiếm hoặc lọc.
3. Hệ thống kiểm tra quyền quản trị và trả danh sách người dùng.
4. Quản trị viên chọn khóa/mở khóa tài khoản hoặc đổi vai trò.
5. Hệ thống validate thao tác và cập nhật thông tin người dùng.
6. Giao diện hiển thị dữ liệu mới sau khi cập nhật. Use case kết thúc.

Luồng rẽ nhánh:

1. Nếu người dùng cần cập nhật không tồn tại, hệ thống hiển thị lỗi.
2. Nếu vai trò mới không hợp lệ, hệ thống từ chối cập nhật.
3. Nếu admin không đủ quyền để thay đổi tài khoản đặc biệt, hệ thống trả lỗi không có quyền.
4. Nếu thao tác cập nhật thất bại, hệ thống giữ nguyên dữ liệu cũ.

**Các yêu cầu đặc biệt:** Không cho đổi sang role không hợp lệ. Không cho thao tác vượt quyền quản trị được cấp.

**Tiền điều kiện:** Quản trị viên đã đăng nhập và có quyền quản lý người dùng.

**Hậu điều kiện:** Danh sách, trạng thái tài khoản hoặc vai trò người dùng được cập nhật nếu thao tác hợp lệ.

**Điểm mở rộng:** Quản trị viên có thể xem chi tiết hồ sơ tuyển sinh của người dùng hoặc gửi thông báo đến nhóm người dùng.

## UC13. Quản lý hồ sơ tuyển sinh

**Mô tả vắn tắt:** Use case này cho phép quản trị viên xem, lọc, tra cứu, cập nhật trạng thái hồ sơ tuyển sinh và xem lịch sử thay đổi của từng hồ sơ.

**Luồng sự kiện:**

Luồng cơ bản:

1. Quản trị viên mở trang quản lý hồ sơ tuyển sinh.
2. Frontend gửi yêu cầu lấy danh sách hồ sơ theo bộ lọc.
3. Hệ thống kiểm tra quyền và trả danh sách hồ sơ.
4. Quản trị viên xem chi tiết hoặc cập nhật trạng thái hồ sơ.
5. Hệ thống cập nhật trạng thái, ghi log thay đổi và tạo thông báo nếu cần.
6. Giao diện hiển thị trạng thái mới của hồ sơ. Use case kết thúc.

Luồng rẽ nhánh:

1. Nếu hồ sơ không tồn tại, hệ thống hiển thị lỗi.
2. Nếu quản trị viên không có quyền, hệ thống trả lỗi 403.
3. Nếu trạng thái chuyển đổi không hợp lệ, hệ thống từ chối cập nhật.
4. Nếu ghi log thất bại, hệ thống cần báo lỗi hoặc không hoàn tất cập nhật trạng thái tùy quy tắc xử lý.

**Các yêu cầu đặc biệt:** Mỗi thay đổi trạng thái quan trọng phải được ghi log. Thông báo cho học viên cần được tạo khi trạng thái hồ sơ thay đổi đáng chú ý.

**Tiền điều kiện:** Quản trị viên đã đăng nhập và có quyền quản lý hồ sơ.

**Hậu điều kiện:** Trạng thái hồ sơ và log thay đổi được cập nhật nếu admin thực hiện chỉnh sửa hợp lệ.

**Điểm mở rộng:** Quản trị viên có thể xem lịch sử hồ sơ, gửi thông báo, xuất danh sách hồ sơ hoặc chuyển sang quản lý thi/điểm.

## UC14. Quản lý thi và điểm

**Mô tả vắn tắt:** Use case này cho phép quản trị viên quản lý lịch thi, phòng thi, xếp thí sinh, sinh mã phách, nhập điểm và đồng bộ điểm thi vào hồ sơ tuyển sinh.

**Luồng sự kiện:**

Luồng cơ bản:

1. Quản trị viên mở chức năng quản lý thi và điểm.
2. Quản trị viên tạo lịch thi, cấu hình phòng thi và chỉ tiêu.
3. Hệ thống lưu lịch thi/phòng thi.
4. Quản trị viên xếp thí sinh vào lịch thi hoặc xếp hàng loạt theo ngày.
5. Quản trị viên công bố phòng thi, sinh số túi/mã phách nếu cần.
6. Quản trị viên nhập hoặc import điểm thi.
7. Hệ thống validate điểm và lưu kết quả.
8. Quản trị viên đồng bộ điểm để cập nhật kết quả vào hồ sơ học viên. Use case kết thúc.

Luồng rẽ nhánh:

1. Nếu lịch thi đã đầy hoặc đã đóng, hệ thống không cho xếp thêm thí sinh.
2. Nếu điểm ngoài khoảng hợp lệ, hệ thống hiển thị lỗi và không lưu.
3. Nếu thí sinh chưa đủ điều kiện thi, hệ thống từ chối xếp lịch.
4. Nếu điểm chưa hợp lệ hoặc chưa đầy đủ, hệ thống không cho đồng bộ.
5. Nếu import file sai định dạng, hệ thống báo lỗi theo từng dòng dữ liệu.

**Các yêu cầu đặc biệt:** Chỉ đồng bộ điểm sau khi có điểm hợp lệ. Ngưỡng đỗ quyết định trạng thái đạt/không đạt. Phòng thi và mã phách cần đảm bảo không trùng lặp theo quy tắc hệ thống.

**Tiền điều kiện:** Quản trị viên đã đăng nhập. Có lịch thi và hồ sơ đủ điều kiện khi xếp thí sinh.

**Hậu điều kiện:** Lịch thi, phòng thi, đăng ký thi hoặc điểm thi được cập nhật. Hồ sơ học viên nhận kết quả khi điểm được đồng bộ.

**Điểm mở rộng:** Quản trị viên có thể xuất danh sách thi, import điểm, xử lý phúc khảo hoặc tạo lịch phỏng vấn.

## UC15. Quản lý chương trình

**Mô tả vắn tắt:** Use case này cho phép quản trị viên tạo, cập nhật, vô hiệu hóa và xem danh sách chương trình đào tạo dùng trong quá trình tuyển sinh.

**Luồng sự kiện:**

Luồng cơ bản:

1. Quản trị viên mở trang quản lý chương trình đào tạo.
2. Giao diện tải danh sách chương trình hiện có.
3. Quản trị viên thêm mới, chỉnh sửa hoặc vô hiệu hóa chương trình.
4. Hệ thống validate dữ liệu chương trình.
5. Hệ thống lưu thay đổi vào cơ sở dữ liệu.
6. Giao diện hiển thị danh sách chương trình mới nhất. Use case kết thúc.

Luồng rẽ nhánh:

1. Nếu thiếu thông tin bắt buộc, hệ thống hiển thị lỗi.
2. Nếu chương trình không tồn tại, hệ thống báo không tìm thấy.
3. Nếu chương trình đang được sử dụng, hệ thống xử lý theo hướng vô hiệu hóa thay vì xóa cứng.
4. Nếu dữ liệu học phí hoặc ngưỡng điểm không hợp lệ, hệ thống từ chối lưu.

**Các yêu cầu đặc biệt:** Chương trình bị xóa theo hướng vô hiệu hóa `is_active`, không xóa cứng. Dữ liệu chương trình phải phù hợp với quy tắc chọn chương trình của hồ sơ tuyển sinh.

**Tiền điều kiện:** Quản trị viên đã đăng nhập và có quyền quản lý chương trình.

**Hậu điều kiện:** Danh sách chương trình đào tạo được cập nhật nếu thao tác hợp lệ.

**Điểm mở rộng:** Quản trị viên có thể import/export chương trình hoặc xem các hồ sơ đang chọn chương trình tương ứng.

## UC16. Import / export dữ liệu

**Mô tả vắn tắt:** Use case này cho phép quản trị viên nhập hoặc xuất dữ liệu CSV cho người dùng, chương trình, lịch thi, điểm thi và hồ sơ tuyển sinh.

**Luồng sự kiện:**

Luồng cơ bản:

1. Quản trị viên mở chức năng import/export dữ liệu.
2. Quản trị viên chọn loại dữ liệu cần import hoặc export.
3. Nếu export, hệ thống truy vấn dữ liệu và trả file CSV.
4. Nếu import, quản trị viên chọn file CSV và gửi lên hệ thống.
5. Hệ thống parse file, validate từng dòng và xử lý tạo mới/cập nhật/bỏ qua.
6. Hệ thống trả kết quả import hoặc file export cho quản trị viên. Use case kết thúc.

Luồng rẽ nhánh:

1. Nếu file import sai định dạng hoặc thiếu cột bắt buộc, hệ thống báo lỗi hoặc bỏ qua dòng không hợp lệ.
2. Nếu một số dòng dữ liệu lỗi, hệ thống xử lý các dòng hợp lệ và trả danh sách lỗi.
3. Nếu không có dữ liệu export, hệ thống trả file CSV chỉ có header hoặc danh sách rỗng.
4. Nếu admin không có quyền, hệ thống từ chối thao tác.

**Các yêu cầu đặc biệt:** Import phải có thống kê `created`, `updated`, `skipped` và `errors`. Dữ liệu import phải được validate trước khi ghi vào hệ thống.

**Tiền điều kiện:** Quản trị viên đã đăng nhập. Với import, file dữ liệu đúng định dạng CSV và thuộc loại dữ liệu được hỗ trợ.

**Hậu điều kiện:** Dữ liệu được xuất thành CSV hoặc được import/cập nhật vào hệ thống theo kết quả xử lý.

**Điểm mở rộng:** Quản trị viên có thể tải template CSV, xem báo cáo lỗi import hoặc tiếp tục chỉnh sửa dữ liệu sau khi import.

## UC17. Gửi thông báo

**Mô tả vắn tắt:** Use case này cho phép quản trị viên gửi thông báo hàng loạt theo vai trò hoặc nhóm người dùng, đồng thời lưu thông báo trong inbox của người nhận.

**Luồng sự kiện:**

Luồng cơ bản:

1. Quản trị viên mở trang gửi thông báo.
2. Quản trị viên nhập tiêu đề, nội dung, loại thông báo và phạm vi người nhận.
3. Hệ thống tìm danh sách người dùng đang hoạt động phù hợp với điều kiện nhận.
4. Hệ thống tạo thông báo cho từng người nhận.
5. Hệ thống gửi email nền nếu có cấu hình.
6. Giao diện hiển thị kết quả gửi thông báo cho quản trị viên. Use case kết thúc.

Luồng rẽ nhánh:

1. Nếu không có người dùng phù hợp, hệ thống ghi nhận số lượng gửi bằng 0.
2. Nếu thiếu tiêu đề hoặc nội dung, hệ thống không cho gửi thông báo.
3. Nếu gửi email lỗi, thông báo vẫn được lưu trong hệ thống và lỗi email được ghi log.
4. Nếu admin không có quyền, hệ thống từ chối gửi.

**Các yêu cầu đặc biệt:** Gửi theo role nếu admin chọn role cụ thể. Không gửi cho tài khoản không hoạt động nếu quy tắc hệ thống yêu cầu chỉ gửi cho user active.

**Tiền điều kiện:** Quản trị viên đã đăng nhập và có tiêu đề, nội dung thông báo hợp lệ.

**Hậu điều kiện:** Thông báo được tạo cho các người dùng phù hợp. Email có thể được gửi nền nếu hệ thống cấu hình gửi email.

**Điểm mở rộng:** Quản trị viên có thể gửi thông báo theo hồ sơ, theo kết quả tuyển sinh hoặc xem trạng thái đọc thông báo.

## UC18. Quản lý nội dung / cấu hình

**Mô tả vắn tắt:** Use case này cho phép quản trị viên quản lý banner, tin tức tuyển sinh và cấu hình hệ thống phục vụ trang công khai và các chức năng vận hành.

**Luồng sự kiện:**

Luồng cơ bản:

1. Quản trị viên mở trang quản lý nội dung hoặc cấu hình.
2. Giao diện tải danh sách banner, tin tức hoặc cấu hình hiện có.
3. Quản trị viên tạo mới, cập nhật, ẩn/lưu trữ nội dung hoặc chỉnh sửa cấu hình.
4. Hệ thống validate dữ liệu đầu vào.
5. Hệ thống lưu thay đổi vào cơ sở dữ liệu.
6. Giao diện hiển thị dữ liệu mới nhất cho quản trị viên. Use case kết thúc.

Luồng rẽ nhánh:

1. Nếu thiếu tiêu đề tin tức, hình ảnh banner hoặc key cấu hình bắt buộc, hệ thống báo lỗi.
2. Nếu bản ghi không tồn tại, hệ thống hiển thị thông báo không tìm thấy.
3. Nếu nội dung đang được công khai nhưng bị ẩn, hệ thống không hiển thị nội dung đó ở trang công khai.
4. Nếu cấu hình sai định dạng, hệ thống từ chối lưu để tránh ảnh hưởng vận hành.

**Các yêu cầu đặc biệt:** Xóa banner/tin tức được xử lý theo hướng ẩn hoặc lưu trữ thay vì xóa cứng. Chỉ banner active và tin tức published được hiển thị công khai.

**Tiền điều kiện:** Quản trị viên đã đăng nhập và có quyền quản lý nội dung/cấu hình.

**Hậu điều kiện:** Banner, tin tức hoặc cấu hình hệ thống được cập nhật nếu dữ liệu hợp lệ.

**Điểm mở rộng:** Quản trị viên có thể xem trước nội dung công khai, thay đổi trạng thái xuất bản hoặc cấu hình các tham số tuyển sinh khác.
