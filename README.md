# HỆ THỐNG TUYỂN SINH TRUNG TÂM NGÔN NGỮ APEX

## 1. Giới Thiệu Dự Án

Hệ thống tuyển sinh trực tuyến dành cho Trung tâm ngôn ngữ Apex, hỗ trợ toàn bộ quy trình tuyển sinh từ đăng ký tài khoản, khảo sát năng lực, xét tuyển, thanh toán học phí đến quản lý hồ sơ và báo cáo cho admin.

Hệ thống gồm:

- Website phụ huynh / học sinh
- Website admin quản trị
- Hệ thống thông báo email / SMS / inbox
- Tích hợp thanh toán VNPay
- Quản lý thi tuyển và khảo sát năng lực
- Quản lý hồ sơ gốc và phát sinh học phí
- Dashboard thống kê và xuất Excel

---

# 2. Công Nghệ Sử Dụng

## Frontend

- ReactJS
- Ant Design
- TailwindCSS
- React Router
- Axios
- Redux Toolkit / Zustand
- React Hook Form + Yup/Zod

## Backend

- ExpressJS
- JWT Authentication
- REST API
- Multer Upload
- Nodemailer
- Socket.IO (optional)

## Database

- MySQL

## Cloud / Infrastructure

### AWS Free Tier

- EC2 → deploy backend
- S3 → upload hồ sơ / chữ ký / avatar / hóa đơn
- RDS MySQL Free Tier hoặc Railway/PlanetScale nếu muốn dễ setup
- CloudFront (optional)

## Payment

- VNPay Sandbox

## Other Services

- Redis → OTP / cache / queue
- BullMQ → queue email/sms/export excel
- Cron Job → đồng bộ dữ liệu

---

# 3. Kiến Trúc Hệ Thống

```txt
Client React
    |
REST API
    |
ExpressJS
    |
Service Layer
    |
MySQL Database

Additional Services:
- Redis
- Queue Worker
- AWS S3
- VNPay
- Email Service
```

---

# 4. Cấu Trúc Role

## User

- Đăng ký tài khoản
- Điền hồ sơ
- Thanh toán
- Xem kết quả
- Đăng ký hệ đào tạo
- Phúc khảo
- Nhận thông báo

## Admin

- Quản lý tuyển sinh
- Quản lý tài khoản
- Quản lý kỳ thi
- Quản lý điểm
- Quản lý hồ sơ
- Dashboard thống kê
- Xuất Excel

## Staff

- Kiểm tra hồ sơ
- Kiểm tra giấy tờ
- Nhập điểm
- Hỗ trợ tuyển sinh

---

# 5. Quy Trình Tổng Thể Tuyển Sinh

```txt
Đăng ký tài khoản
    ↓
Xác thực OTP
    ↓
Đăng nhập
    ↓
Ký chính sách tuyển sinh
    ↓
Thanh toán mua hồ sơ
    ↓
Điền hồ sơ tuyển sinh
    ↓
Khảo sát năng lực / Thi
    ↓
Xem kết quả
    ↓
Chọn hệ đào tạo
    ↓
Nộp hồ sơ gốc
    ↓
Hoàn tất nhập học
```

---

# 6. MODULE USER SITE

---

# 6.1 Landing Page / Public Site

## Chức năng

### Giới thiệu trung tâm

- Banner
- Video
- Thành tựu
- Giáo viên
- Cơ sở vật chất
- FAQ

### Thông tin tuyển sinh

- Các hệ đào tạo
- Học phí
- Điều kiện tuyển sinh
- Timeline tuyển sinh

### Tin tức

- Bài viết
- Thông báo
- Hướng dẫn tuyển sinh

### Tra cứu

- Tra cứu hồ sơ
- Tra cứu lịch thi
- Tra cứu kết quả

---

# 6.2 Authentication Module

## Đăng ký

### Flow

```txt
Nhập email + password
    ↓
Chọn ngôn ngữ đăng ký
    ↓
Gửi OTP email
    ↓
Xác thực OTP
    ↓
Tạo tài khoản
```

## Rules

- OTP hết hạn sau 1 phút
- Không spam resend OTP
- Giới hạn resend 30 giây
- Password hash bằng bcrypt
- JWT access token + refresh token

## Quên mật khẩu

```txt
Nhập email
    ↓
Gửi OTP
    ↓
Verify OTP
    ↓
Reset password
```

## Security

- Rate limit login
- Captcha optional
- Blacklist token khi logout

---

# 6.3 Notification Center

## Loại thông báo

- Inbox notification
- Email
- SMS

## Trigger

- Hoàn thành bước tuyển sinh
- Thanh toán thành công
- Có lịch thi
- Có kết quả
- Có yêu cầu phỏng vấn
- Nhắc lịch nộp hồ sơ

---

# 6.4 STEP 1 — Ký Chính Sách Tuyển Sinh

## Chức năng

- Hiển thị điều khoản
- Ký chữ ký điện tử trực tiếp bằng canvas

## Lưu dữ liệu

- signature_image
- signed_at
- ip_address

## Validate

- Không được bỏ trống chữ ký

---

# 6.5 STEP 2 — Thanh Toán Hồ Sơ

## Flow

```txt
Tạo order
    ↓
Redirect VNPay Sandbox
    ↓
Thanh toán thành công
    ↓
VNPay callback
    ↓
Update payment status
```

## Giá

- 50.000 VNĐ / hồ sơ

## Lưu ý quan trọng

### Không tin callback frontend

Phải verify:

- secure hash
- transaction status
- amount

## Trạng thái thanh toán

```txt
PENDING
SUCCESS
FAILED
EXPIRED
REFUNDED
```

---

# 6.6 STEP 3 — Điền Hồ Sơ Tuyển Sinh

## Thông tin học sinh

- Họ tên
- Ngày sinh
- Giới tính
- CCCD
- Địa chỉ
- Trường hiện tại

## Thông tin phụ huynh

- Họ tên
- SĐT
- Email

## Đăng ký học

- Ngôn ngữ
- Level
- Hệ đào tạo
- Ca học
- Cơ sở học

## Khảo sát năng lực

Nếu chọn lớp cơ bản:

- Không cần thi

Nếu chọn level cao:

- Phải chọn lịch khảo sát

## Upload file

- Học bạ
- CCCD
- Ảnh
- File PDF

## Validate

- Validate frontend + backend
- File size limit
- MIME type validate

---

# 6.7 STEP 4 — Xem Kết Quả

## Sau khi chấm điểm

Học sinh sẽ:

- Xem điểm
- Xem level đạt được
- Được phép phúc khảo

## Logic

```txt
Điểm >= threshold
    ↓
Cho phép chọn hệ tương ứng
```

## Phúc khảo

### Flow

```txt
Gửi yêu cầu phúc khảo
    ↓
Admin xử lý
    ↓
Cập nhật điểm
    ↓
Gửi thông báo
```

---

# 6.8 STEP 5 — Chọn Hệ Đào Tạo

## Chức năng

- Hiển thị hệ phù hợp
- Hiển thị học phí
- Chọn khóa học

## Rule

Chỉ hiển thị hệ phù hợp với kết quả thi.

---

# 6.9 STEP 6 — Nộp Hồ Sơ Gốc

## Chức năng

- Đăng ký ngày đến trung tâm
- Chọn mua sách
- Chọn khóa bổ trợ
- Kiểm tra giấy tờ

## Nếu đổi level

Phát sinh:

- Chênh lệch học phí
- Ghi log thay đổi

## Cần lưu

```txt
old_level
new_level
old_price
new_price
difference_price
updated_by
updated_at
```

---

# 7. MODULE THI TUYỂN

---

# 7.1 Xác Nhận Thi

## User

- Xác nhận có tham gia thi hay không

## Status

```txt
CONFIRMED
ABSENT
PENDING
```

---

# 7.2 Quản Lý Kỳ Thi

## Admin tạo kỳ thi

Thông tin:

- Tên kỳ thi
- Ngày thi
- Phòng thi
- Hình thức online/offline

---

# 7.3 Xếp Thí Sinh

## Logic

Dựa trên:

- Ngày đăng ký
- Ngôn ngữ
- Level đăng ký

---

# 7.4 Thi Online

Nếu online:

- Gửi link thi
- Có thời gian hiệu lực

---

# 7.5 Biên Bản Thi

## Trạng thái

```txt
PRESENT
ABSENT
VIOLATION
```

---

# 7.6 Đánh Số Túi / Mã Phách

## Rule quan trọng

- Chỉ sinh mã phách cho học sinh có thi
- Mã phách unique
- Random tránh lộ danh tính

---

# 7.7 Nhập Điểm

## Rule

- Chỉ nhập cho học sinh có mã phách
- Điểm thuộc đúng kỳ thi

---

# 7.8 Đồng Bộ Điểm

## Flow

```txt
Nhập điểm
    ↓
Admin bấm đồng bộ
    ↓
Update kết quả học sinh
    ↓
Trigger notification
```

---

# 8. MODULE ADMIN

---

# 8.1 Dashboard

## Báo cáo

- Theo ngày
- Theo tuần
- Theo tháng
- Theo chiến dịch

## Thống kê

- Tổng hồ sơ
- Hồ sơ hoàn thành
- Doanh thu
- Tỷ lệ đậu
- Hệ được chọn nhiều nhất

---

# 8.2 Quản Lý Tài Khoản

## Chức năng

- CRUD
- Filter
- Search
- Export Excel
- Khóa tài khoản

---

# 8.3 Quản Lý Hồ Sơ Tuyển Sinh

## Chức năng

- Xem chi tiết
- Theo dõi step hiện tại
- Admin edit hồ sơ
- History log

## Audit Log

Mọi chỉnh sửa phải lưu:

```txt
old_value
new_value
updated_by
updated_at
```

---

# 8.4 Hồ Sơ Hủy

## Rule

Nếu học sinh hủy:

- Bắt buộc ký xác nhận
- Lưu lý do hủy
- Không được xóa cứng dữ liệu

## Status

```txt
ACTIVE
CANCELLED
ARCHIVED
```

---

# 8.5 Nộp Hồ Sơ Gốc

## Chức năng

- Sinh số thứ tự nộp hồ sơ
- Check giấy tờ đã nộp

## Rule cực kỳ quan trọng

### Số thứ tự KHÔNG được trùng

Phải dùng:

- Database transaction
- Atomic increment
- Counter table

## Ví dụ bảng counter

```txt
counter_key = ORIGINAL_DOCUMENT
current_value = 1001
```

## Không được generate ở frontend

Generate tại backend.

---

# 8.6 Quản Lý Đơn Đăng Ký Hệ

## Chức năng

- Tổng hợp hệ đã đăng ký
- Thống kê số lượng học sinh theo hệ
- Theo dõi chuyển hệ

---

# 8.7 Quản Lý Kết Quả Thi

## Chức năng

- Danh sách điểm
- Import Excel
- Export Excel
- Filter theo kỳ thi

---

# 8.8 Gửi Thông Báo Chung

## Chức năng

- Gửi email all user
- Gửi inbox notification
- Lưu lịch sử gửi

## Queue

Phải dùng queue tránh spam mail server.

---

# 8.9 Phúc Khảo

## Flow

```txt
User gửi yêu cầu
    ↓
Admin duyệt
    ↓
Chấm lại
    ↓
Update điểm
    ↓
Gửi kết quả
```

---

# 8.10 Cấu Hình Hệ Đào Tạo

## Chức năng

- CRUD hệ đào tạo
- Giá tiền
- Level
- Thời gian học
- Chỉ tiêu

---

# 8.11 Quản Lý Phỏng Vấn

## Chức năng

- Tạo lịch phỏng vấn
- Gửi thư mời
- User xác nhận tham gia

## User

Nếu được mời:

- Hiển thị nút xác nhận phỏng vấn

---

# 8.12 Quản Lý Banner / Nội Dung

## Chức năng

- CRUD banner
- CRUD tin tức
- CRUD hướng dẫn tuyển sinh

---

# 8.13 Phân Quyền

## Gợi ý Role

```txt
SUPER_ADMIN
ADMIN
STAFF
ACCOUNTANT
EXAMINER
CONSULTANT
```

## Permission

- CRUD theo module
- Dynamic permission
- Middleware check permission

---

# 8.14 Xuất Hóa Đơn

## Chức năng

- Xuất PDF hóa đơn
- Lưu lịch sử thanh toán
- Download invoice

---

# 9. DATABASE DESIGN GỢI Ý

## Các bảng chính

```txt
users
roles
permissions

enrollment_forms
enrollment_steps
enrollment_logs

payments
payment_transactions

otp_codes

notifications
notification_histories

exams
exam_rooms
exam_candidates
exam_scores

recheck_requests

training_programs

interviews

system_configs

banners
news

invoices

counters
```

---

# 10. BEST PRACTICE QUAN TRỌNG

## 1. Không xử lý business logic ở frontend

Toàn bộ validate quan trọng phải ở backend.

---

## 2. Không generate số thứ tự ở frontend

Generate tại backend bằng transaction.

---

## 3. Mọi thay đổi dữ liệu cần log

Ví dụ:

- đổi level
- sửa điểm
- sửa hồ sơ
- đổi hệ

---

## 4. Upload file lên S3

Không lưu file trực tiếp trong server local.

---

## 5. Queue cho email/sms/export

Không gửi trực tiếp trong request API.

---

## 6. Soft Delete

Không xóa cứng dữ liệu tuyển sinh.

---

## 7. Permission Middleware

Mọi API admin phải check permission.

---

## 8. Validate cả frontend và backend

Frontend chỉ để improve UX.

Backend mới là validate chính.

---

# 11. TESTING REQUIREMENTS

## Unit Test

- Auth
- Payment
- OTP
- Permission
- Counter generator

## Integration Test

- Flow tuyển sinh
- Payment callback
- Đồng bộ điểm

## Stress Test

- 10 admin generate số thứ tự cùng lúc
- 1000 email queue
- Upload đồng thời

## Security Test

- SQL Injection
- XSS
- JWT fake
- OTP brute force

---

# 12. API MODULE GỢI Ý

```txt
/api/auth
/api/users
/api/enrollments
/api/payments
/api/exams
/api/scores
/api/rechecks
/api/interviews
/api/notifications
/api/configs
/api/banners
/api/news
/api/invoices
```

---

# 13. FOLDER STRUCTURE GỢI Ý

## Backend

```txt
src/
 ├── modules
 ├── middlewares
 ├── services
 ├── repositories
 ├── utils
 ├── queues
 ├── jobs
 ├── configs
 ├── validations
 ├── uploads
 └── tests
```

## Frontend

```txt
src/
 ├── pages
 ├── components
 ├── layouts
 ├── services
 ├── hooks
 ├── store
 ├── routes
 ├── utils
 ├── constants
 └── validations
```

---

# 14. ROADMAP DEVELOPMENT

## Phase 1

- Auth
- OTP
- Landing page
- Enrollment form
- Payment

## Phase 2

- Exam module
- Result module
- Notification

## Phase 3

- Admin dashboard
- Excel export
- Permission system

## Phase 4

- Interview
- Invoice
- Advanced statistics

---

# 15. KẾT LUẬN

Hệ thống tuyển sinh cần tập trung vào:

- Tính ổn định
- Đồng bộ dữ liệu chính xác
- Không trùng số thứ tự
- Audit log đầy đủ
- Permission chặt chẽ
- Queue xử lý background
- Transaction cho các nghiệp vụ quan trọng
- Security cho payment / OTP / authentication

Đây là hệ thống có nhiều workflow nghiệp vụ nên cần:

- Thiết kế DB tốt ngay từ đầu
- Chia module rõ ràng
- Validate chặt chẽ
- Logging đầy đủ
- Test concurrency kỹ càng
