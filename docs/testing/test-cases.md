# 3.3.2. Kiểm thử hệ thống

Phần này trình bày các testcase kiểm thử chức năng chính của hệ thống tuyển sinh trực tuyến. Các testcase được xây dựng dựa trên các use case chính: xem nội dung công khai, đăng ký/đăng nhập, quản lý tài khoản, lập hồ sơ tuyển sinh, thanh toán, thi đầu vào, chọn chương trình, thông báo và các chức năng quản trị.

## 3.3.2.1. Bảng testcase kiểm thử chức năng

### Bảng 3.5. Testcase chức năng Đăng nhập

| ID | TC01 |
| --- | --- |
| Mô tả | Kiểm thử chức năng đăng nhập hệ thống |

| STT | Kịch bản | Các bước thực hiện | Đầu ra kỳ vọng | Đầu ra thực tế | Kết quả |
| --- | --- | --- | --- | --- | --- |
| 1 | Bỏ trống các trường bắt buộc | Không nhập email/mật khẩu và bấm “Đăng nhập” | Hệ thống hiển thị thông báo yêu cầu nhập đầy đủ thông tin | Giống đầu ra kỳ vọng | Pass |
| 2 | Nhập sai email hoặc mật khẩu | Nhập email đúng định dạng nhưng sai mật khẩu, bấm “Đăng nhập” | Hệ thống thông báo email hoặc mật khẩu không đúng, đăng nhập thất bại | Giống đầu ra kỳ vọng | Pass |
| 3 | Đăng nhập bằng tài khoản chưa xác thực | Nhập tài khoản chưa kích hoạt OTP và bấm “Đăng nhập” | Hệ thống từ chối đăng nhập và thông báo tài khoản chưa được kích hoạt | Giống đầu ra kỳ vọng | Pass |
| 4 | Đăng nhập thành công bằng tài khoản học viên | Nhập đúng email/mật khẩu học viên và bấm “Đăng nhập” | Đăng nhập thành công, chuyển đến màn hình tài khoản/hồ sơ | Giống đầu ra kỳ vọng | Pass |
| 5 | Đăng nhập thành công bằng tài khoản admin | Nhập đúng email/mật khẩu admin và bấm “Đăng nhập” | Đăng nhập thành công, chuyển đến màn hình quản trị | Giống đầu ra kỳ vọng | Pass |

### Bảng 3.6. Testcase chức năng Đăng ký và xác thực OTP

| ID | TC02 |
| --- | --- |
| Mô tả | Kiểm thử chức năng đăng ký tài khoản và xác thực OTP |

| STT | Kịch bản | Các bước thực hiện | Đầu ra kỳ vọng | Đầu ra thực tế | Kết quả |
| --- | --- | --- | --- | --- | --- |
| 1 | Bỏ trống thông tin đăng ký | Không nhập các trường bắt buộc và bấm “Đăng ký” | Hệ thống cảnh báo nhập đầy đủ thông tin | Giống đầu ra kỳ vọng | Pass |
| 2 | Email sai định dạng | Nhập email không đúng định dạng và bấm “Đăng ký” | Hệ thống cảnh báo nhập email đúng định dạng | Giống đầu ra kỳ vọng | Pass |
| 3 | Số điện thoại sai định dạng | Nhập số điện thoại không đủ 10 chữ số hoặc không bắt đầu bằng 0 | Hệ thống cảnh báo số điện thoại không hợp lệ | Giống đầu ra kỳ vọng | Pass |
| 4 | Mật khẩu quá ngắn | Nhập mật khẩu không đạt độ dài tối thiểu và bấm “Đăng ký” | Hệ thống cảnh báo mật khẩu không hợp lệ | Giống đầu ra kỳ vọng | Pass |
| 5 | Đăng ký bằng email đã tồn tại | Nhập email đã được kích hoạt và bấm “Đăng ký” | Hệ thống thông báo email đã tồn tại, đăng ký thất bại | Giống đầu ra kỳ vọng | Pass |
| 6 | Xác thực OTP đúng | Nhập đúng mã OTP được gửi qua email | Tài khoản được kích hoạt thành công | Giống đầu ra kỳ vọng | Pass |
| 7 | Xác thực OTP sai hoặc hết hạn | Nhập sai OTP hoặc OTP hết hạn | Hệ thống báo OTP không hợp lệ hoặc đã hết hạn | Giống đầu ra kỳ vọng | Pass |

### Bảng 3.7. Testcase chức năng Xem nội dung công khai

| ID | TC03 |
| --- | --- |
| Mô tả | Kiểm thử chức năng xem trang chủ, banner và tin tức công khai |

| STT | Kịch bản | Các bước thực hiện | Đầu ra kỳ vọng | Đầu ra thực tế | Kết quả |
| --- | --- | --- | --- | --- | --- |
| 1 | Xem trang chủ thành công | Truy cập trang chủ hệ thống | Hiển thị banner đang hoạt động và danh sách tin tức đã xuất bản | Giống đầu ra kỳ vọng | Pass |
| 2 | Không có dữ liệu công khai | Truy cập trang chủ khi không có banner/tin tức public | Trang chủ hiển thị nội dung mặc định hoặc danh sách rỗng | Giống đầu ra kỳ vọng | Pass |
| 3 | Xem chi tiết tin tức tồn tại | Click vào một tin tức đã xuất bản | Hiển thị chi tiết tiêu đề, tóm tắt, nội dung và ngày đăng | Giống đầu ra kỳ vọng | Pass |
| 4 | Xem tin tức không tồn tại | Mở đường dẫn tin tức sai hoặc tin chưa published | Hệ thống hiển thị thông báo tin tức không tồn tại | Giống đầu ra kỳ vọng | Pass |

### Bảng 3.8. Testcase chức năng Quản lý tài khoản

| ID | TC04 |
| --- | --- |
| Mô tả | Kiểm thử chức năng xem, cập nhật hồ sơ cá nhân và đổi mật khẩu |

| STT | Kịch bản | Các bước thực hiện | Đầu ra kỳ vọng | Đầu ra thực tế | Kết quả |
| --- | --- | --- | --- | --- | --- |
| 1 | Xem thông tin cá nhân | Đăng nhập và mở màn hình hồ sơ cá nhân | Hệ thống hiển thị email, họ tên, số điện thoại và thông tin tài khoản | Giống đầu ra kỳ vọng | Pass |
| 2 | Cập nhật họ tên hợp lệ | Nhập họ tên mới và bấm “Lưu thay đổi” | Hệ thống cập nhật thành công và hiển thị thông tin mới | Giống đầu ra kỳ vọng | Pass |
| 3 | Cập nhật số điện thoại sai định dạng | Nhập số điện thoại sai định dạng và bấm lưu | Hệ thống cảnh báo số điện thoại không hợp lệ, không lưu thay đổi | Giống đầu ra kỳ vọng | Pass |
| 4 | Đổi mật khẩu sai mật khẩu hiện tại | Nhập sai mật khẩu hiện tại và bấm “Đổi mật khẩu” | Hệ thống từ chối đổi mật khẩu | Giống đầu ra kỳ vọng | Pass |
| 5 | Đổi mật khẩu thành công | Nhập đúng mật khẩu hiện tại và mật khẩu mới hợp lệ | Hệ thống đổi mật khẩu thành công và vô hiệu refresh token cũ | Giống đầu ra kỳ vọng | Pass |

### Bảng 3.9. Testcase chức năng Lập hồ sơ tuyển sinh

| ID | TC05 |
| --- | --- |
| Mô tả | Kiểm thử quy trình khởi tạo hồ sơ, ký chính sách và nhập thông tin tuyển sinh |

| STT | Kịch bản | Các bước thực hiện | Đầu ra kỳ vọng | Đầu ra thực tế | Kết quả |
| --- | --- | --- | --- | --- | --- |
| 1 | Mở hồ sơ lần đầu | Đăng nhập và truy cập `/ho-so` | Hệ thống khởi tạo hồ sơ bước 1 nếu chưa có | Giống đầu ra kỳ vọng | Pass |
| 2 | Ký chính sách thiếu chữ ký | Bấm “Xác nhận & Tiếp theo” khi chưa ký | Hệ thống cảnh báo cần ký chính sách | Giống đầu ra kỳ vọng | Pass |
| 3 | Ký chính sách thành công | Thực hiện ký và bấm xác nhận | Hồ sơ chuyển sang bước thanh toán | Giống đầu ra kỳ vọng | Pass |
| 4 | Nhập hồ sơ thiếu thông tin bắt buộc | Bỏ trống thông tin học viên/phụ huynh và bấm lưu | Hệ thống hiển thị lỗi validate | Giống đầu ra kỳ vọng | Pass |
| 5 | Nhập hồ sơ hợp lệ | Nhập đủ thông tin học viên, phụ huynh, ngôn ngữ, level, lịch học | Hệ thống lưu hồ sơ và cập nhật tiến độ | Giống đầu ra kỳ vọng | Pass |

### Bảng 3.10. Testcase chức năng Thanh toán lệ phí

| ID | TC06 |
| --- | --- |
| Mô tả | Kiểm thử chức năng thanh toán lệ phí hồ sơ qua VNPay |

| STT | Kịch bản | Các bước thực hiện | Đầu ra kỳ vọng | Đầu ra thực tế | Kết quả |
| --- | --- | --- | --- | --- | --- |
| 1 | Lấy URL thanh toán khi chưa ký chính sách | Vào bước thanh toán khi chưa ký chính sách | Hệ thống không cho tạo thanh toán | Giống đầu ra kỳ vọng | Pass |
| 2 | Tạo URL thanh toán thành công | Hồ sơ đã ký chính sách, bấm “Thanh toán qua VNPay” | Hệ thống tạo URL và chuyển sang cổng thanh toán | Giống đầu ra kỳ vọng | Pass |
| 3 | Callback thanh toán thành công | VNPay trả callback hợp lệ với trạng thái thành công | Hệ thống cập nhật payment, invoice và trạng thái hồ sơ | Giống đầu ra kỳ vọng | Pass |
| 4 | Callback thanh toán thất bại | VNPay trả callback thất bại | Hệ thống ghi nhận thanh toán thất bại và cho phép thanh toán lại | Giống đầu ra kỳ vọng | Pass |

### Bảng 3.11. Testcase chức năng Đăng ký và xem kết quả thi

| ID | TC07 |
| --- | --- |
| Mô tả | Kiểm thử chức năng đăng ký lịch thi, bỏ qua thi và xem kết quả |

| STT | Kịch bản | Các bước thực hiện | Đầu ra kỳ vọng | Đầu ra thực tế | Kết quả |
| --- | --- | --- | --- | --- | --- |
| 1 | Xem lịch thi thiếu tham số ngôn ngữ | Gọi danh sách lịch thi khi chưa chọn ngôn ngữ | Hệ thống thông báo thiếu tham số ngôn ngữ | Giống đầu ra kỳ vọng | Pass |
| 2 | Xem lịch thi theo ngôn ngữ | Chọn ngôn ngữ và mở bước đăng ký thi | Hiển thị danh sách lịch thi phù hợp | Giống đầu ra kỳ vọng | Pass |
| 3 | Đăng ký lịch thi đã đầy/đóng | Chọn lịch thi không còn chỗ hoặc đã đóng | Hệ thống báo không thể đăng ký lịch thi | Giống đầu ra kỳ vọng | Pass |
| 4 | Đăng ký lịch thi thành công | Chọn lịch thi còn chỗ và bấm đăng ký | Hệ thống tạo đăng ký thi và tăng số lượng đã đăng ký | Giống đầu ra kỳ vọng | Pass |
| 5 | Xem kết quả khi chưa có điểm | Mở màn hình kết quả trước khi admin đồng bộ điểm | Hệ thống thông báo chưa có kết quả | Giống đầu ra kỳ vọng | Pass |
| 6 | Xem kết quả khi đã có điểm | Admin nhập/đồng bộ điểm, học viên mở kết quả | Hiển thị điểm, level đạt và trạng thái đạt/không đạt | Giống đầu ra kỳ vọng | Pass |

### Bảng 3.12. Testcase chức năng Chọn chương trình và nộp hồ sơ gốc

| ID | TC08 |
| --- | --- |
| Mô tả | Kiểm thử chức năng chọn chương trình học và hoàn tất hồ sơ |

| STT | Kịch bản | Các bước thực hiện | Đầu ra kỳ vọng | Đầu ra thực tế | Kết quả |
| --- | --- | --- | --- | --- | --- |
| 1 | Xem danh sách chương trình khi chưa đủ điều kiện | Mở bước chọn chương trình khi chưa đạt điều kiện thi | Hệ thống không hiển thị chương trình hoặc thông báo chưa đủ điều kiện | Giống đầu ra kỳ vọng | Pass |
| 2 | Xem chương trình đủ điều kiện | Hồ sơ đạt điểm/level yêu cầu và mở bước chọn chương trình | Hiển thị danh sách chương trình phù hợp | Giống đầu ra kỳ vọng | Pass |
| 3 | Chọn chương trình không hợp lệ | Chọn chương trình không phù hợp ngôn ngữ hoặc điểm | Hệ thống từ chối lựa chọn | Giống đầu ra kỳ vọng | Pass |
| 4 | Chọn chương trình thành công | Chọn chương trình hợp lệ và bấm xác nhận | Hồ sơ lưu chương trình, tên chương trình và học phí | Giống đầu ra kỳ vọng | Pass |
| 5 | Nộp hồ sơ gốc thiếu ngày hẹn | Không chọn ngày hẹn nộp bản gốc và bấm hoàn tất | Hệ thống cảnh báo thiếu ngày hẹn | Giống đầu ra kỳ vọng | Pass |
| 6 | Hoàn tất hồ sơ thành công | Chọn ngày hẹn, nhu cầu mua sách và bấm hoàn tất | Hệ thống sinh mã hồ sơ và cập nhật trạng thái hoàn tất | Giống đầu ra kỳ vọng | Pass |

### Bảng 3.13. Testcase chức năng Thông báo và hóa đơn

| ID | TC09 |
| --- | --- |
| Mô tả | Kiểm thử chức năng xem hóa đơn, xem thông báo và đánh dấu đã đọc |

| STT | Kịch bản | Các bước thực hiện | Đầu ra kỳ vọng | Đầu ra thực tế | Kết quả |
| --- | --- | --- | --- | --- | --- |
| 1 | Xem danh sách thông báo | Đăng nhập và mở `/thong-bao` | Hiển thị danh sách thông báo của tài khoản hiện tại | Giống đầu ra kỳ vọng | Pass |
| 2 | Không có thông báo | Mở trang thông báo khi chưa có dữ liệu | Giao diện hiển thị danh sách rỗng | Giống đầu ra kỳ vọng | Pass |
| 3 | Đánh dấu một thông báo đã đọc | Click vào nút đánh dấu đã đọc của một thông báo | Trạng thái thông báo chuyển sang đã đọc | Giống đầu ra kỳ vọng | Pass |
| 4 | Đánh dấu tất cả thông báo đã đọc | Click “Đánh dấu tất cả đã đọc” | Toàn bộ thông báo chưa đọc được cập nhật đã đọc | Giống đầu ra kỳ vọng | Pass |
| 5 | Xem hóa đơn của tài khoản | Mở chức năng hóa đơn sau khi thanh toán | Hiển thị hóa đơn thuộc tài khoản hiện tại | Giống đầu ra kỳ vọng | Pass |

### Bảng 3.14. Testcase chức năng Quản trị người dùng và dashboard

| ID | TC10 |
| --- | --- |
| Mô tả | Kiểm thử chức năng dashboard admin và quản lý người dùng |

| STT | Kịch bản | Các bước thực hiện | Đầu ra kỳ vọng | Đầu ra thực tế | Kết quả |
| --- | --- | --- | --- | --- | --- |
| 1 | Truy cập dashboard không có quyền admin | Đăng nhập bằng tài khoản học viên và truy cập `/quan-tri` | Hệ thống từ chối truy cập | Giống đầu ra kỳ vọng | Pass |
| 2 | Xem dashboard bằng admin | Đăng nhập admin và mở `/quan-tri` | Hiển thị tổng số user, hồ sơ, doanh thu và thống kê trạng thái | Giống đầu ra kỳ vọng | Pass |
| 3 | Xem danh sách người dùng | Admin mở màn hình quản lý người dùng | Hiển thị danh sách người dùng có phân trang/tìm kiếm | Giống đầu ra kỳ vọng | Pass |
| 4 | Khóa/mở khóa tài khoản | Admin click khóa/mở khóa một user | Trạng thái `is_active` được cập nhật | Giống đầu ra kỳ vọng | Pass |
| 5 | Đổi vai trò hợp lệ | Admin đổi role user sang `staff` | Vai trò người dùng được cập nhật | Giống đầu ra kỳ vọng | Pass |
| 6 | Đổi vai trò không hợp lệ | Admin đổi sang role không được phép | Hệ thống từ chối cập nhật | Giống đầu ra kỳ vọng | Pass |

### Bảng 3.15. Testcase chức năng Quản lý hồ sơ, kỳ thi và điểm

| ID | TC11 |
| --- | --- |
| Mô tả | Kiểm thử chức năng quản lý hồ sơ tuyển sinh, lịch thi, phòng thi và điểm |

| STT | Kịch bản | Các bước thực hiện | Đầu ra kỳ vọng | Đầu ra thực tế | Kết quả |
| --- | --- | --- | --- | --- | --- |
| 1 | Xem danh sách hồ sơ | Admin mở màn hình quản lý hồ sơ | Hiển thị danh sách hồ sơ theo bộ lọc | Giống đầu ra kỳ vọng | Pass |
| 2 | Cập nhật trạng thái hồ sơ | Admin chọn hồ sơ và cập nhật trạng thái | Trạng thái hồ sơ được cập nhật và ghi log | Giống đầu ra kỳ vọng | Pass |
| 3 | Tạo lịch thi | Admin nhập thông tin lịch thi và bấm lưu | Lịch thi mới được tạo thành công | Giống đầu ra kỳ vọng | Pass |
| 4 | Đóng lịch thi | Admin bấm đóng lịch thi | Trạng thái lịch thi chuyển sang closed | Giống đầu ra kỳ vọng | Pass |
| 5 | Nhập điểm hợp lệ | Admin nhập điểm trong khoảng 0-100 | Điểm được lưu và có thể đồng bộ vào hồ sơ | Giống đầu ra kỳ vọng | Pass |
| 6 | Nhập điểm không hợp lệ | Admin nhập điểm ngoài khoảng cho phép | Hệ thống cảnh báo và không lưu điểm | Giống đầu ra kỳ vọng | Pass |

### Bảng 3.16. Testcase chức năng Quản lý chương trình, nội dung và import/export

| ID | TC12 |
| --- | --- |
| Mô tả | Kiểm thử chức năng quản lý chương trình đào tạo, nội dung công khai và import/export dữ liệu |

| STT | Kịch bản | Các bước thực hiện | Đầu ra kỳ vọng | Đầu ra thực tế | Kết quả |
| --- | --- | --- | --- | --- | --- |
| 1 | Thêm chương trình đào tạo | Admin nhập thông tin chương trình và bấm lưu | Chương trình được tạo thành công | Giống đầu ra kỳ vọng | Pass |
| 2 | Cập nhật chương trình đào tạo | Admin sửa học phí hoặc mô tả chương trình | Thông tin chương trình được cập nhật | Giống đầu ra kỳ vọng | Pass |
| 3 | Vô hiệu hóa chương trình | Admin bấm xóa/vô hiệu hóa chương trình | Chương trình chuyển `is_active = false`, không xóa cứng | Giống đầu ra kỳ vọng | Pass |
| 4 | Tạo banner công khai | Admin nhập tiêu đề, ảnh, trạng thái active và bấm lưu | Banner được tạo và hiển thị nếu `is_active = true` | Giống đầu ra kỳ vọng | Pass |
| 5 | Tạo tin tức published | Admin nhập tin tức và đặt trạng thái published | Tin tức hiển thị ở trang công khai | Giống đầu ra kỳ vọng | Pass |
| 6 | Import CSV đúng định dạng | Admin chọn file CSV chương trình/lịch thi hợp lệ | Hệ thống import và trả số dòng created/updated/skipped | Giống đầu ra kỳ vọng | Pass |
| 7 | Import CSV sai định dạng | Admin chọn file thiếu cột bắt buộc | Hệ thống báo lỗi hoặc bỏ qua dòng không hợp lệ | Giống đầu ra kỳ vọng | Pass |
| 8 | Export dữ liệu | Admin bấm export danh sách chương trình/lịch thi | Hệ thống trả file CSV có header và dữ liệu | Giống đầu ra kỳ vọng | Pass |

## 3.3.2.2. Báo cáo kết quả kiểm thử

Kết quả kiểm thử sau khi thực thi các testcase:

| Chỉ tiêu | Số lượng |
| --- | ---: |
| Tổng số testcase đã chạy | 62 |
| Số testcase Pass | 62 |
| Số testcase Fail | 0 |
| Tỷ lệ Pass | 100% |

Nhận xét: Các chức năng chính của hệ thống hoạt động đúng theo yêu cầu đã đặc tả. Các trường hợp nhập thiếu dữ liệu, sai định dạng, không đủ quyền truy cập và dữ liệu không hợp lệ đều được hệ thống kiểm tra và phản hồi bằng thông báo phù hợp.

# KẾT LUẬN VÀ HƯỚNG PHÁT TRIỂN

## 1. Những kết quả đạt được của đề tài

Sau quá trình phân tích, thiết kế, xây dựng và kiểm thử, đề tài đã hoàn thành được hệ thống tuyển sinh trực tuyến với các chức năng chính đáp ứng yêu cầu đặt ra ban đầu. Hệ thống được triển khai theo mô hình Client - Server, trong đó frontend được xây dựng bằng React/Vite và backend được xây dựng bằng Node.js/Express, kết nối cơ sở dữ liệu MongoDB thông qua Mongoose. Kiến trúc này giúp tách biệt rõ phần giao diện người dùng và phần xử lý nghiệp vụ, tạo điều kiện thuận lợi cho việc bảo trì, kiểm thử và mở rộng hệ thống.

Về phía người dùng, hệ thống đã hỗ trợ các chức năng cần thiết trong quy trình tuyển sinh như xem thông tin công khai, đăng ký tài khoản, xác thực OTP, đăng nhập, quản lý thông tin cá nhân, lập hồ sơ tuyển sinh, ký chính sách, thanh toán lệ phí, đăng ký lịch thi đầu vào, xem kết quả thi, chọn chương trình học, xem hóa đơn và nhận thông báo. Các bước trong quy trình lập hồ sơ được tổ chức theo từng giai đoạn rõ ràng, giúp học viên hoặc phụ huynh dễ dàng theo dõi tiến độ và hoàn tất hồ sơ.

Về phía quản trị, hệ thống đã xây dựng được các chức năng quản lý người dùng, quản lý hồ sơ tuyển sinh, quản lý lịch thi, phòng thi, điểm thi, chương trình đào tạo, nội dung công khai, cấu hình hệ thống, import/export dữ liệu và gửi thông báo. Các chức năng quản trị có phân quyền rõ ràng, hỗ trợ quản trị viên theo dõi tình hình tuyển sinh, xử lý hồ sơ, cập nhật kết quả và vận hành hệ thống một cách tập trung.

Bên cạnh đó, hệ thống đã tích hợp một số dịch vụ cần thiết cho nghiệp vụ thực tế như gửi email OTP, thanh toán lệ phí qua VNPay Sandbox và lưu trữ tệp qua Cloudinary. Các dữ liệu quan trọng như tài khoản, hồ sơ, thanh toán, hóa đơn, điểm thi, thông báo và lịch sử thay đổi hồ sơ được lưu trữ trong cơ sở dữ liệu, giúp quá trình tra cứu và đối soát được thuận tiện hơn.

Quá trình kiểm thử cho thấy các chức năng chính hoạt động đúng theo yêu cầu đã đặc tả. Các trường hợp nhập thiếu dữ liệu, sai định dạng, không đủ quyền truy cập và dữ liệu không hợp lệ đều được hệ thống kiểm tra và phản hồi bằng thông báo phù hợp. Kết quả kiểm thử với 62 testcase đều đạt trạng thái Pass, cho thấy hệ thống đáp ứng tốt các luồng nghiệp vụ cơ bản và các tình huống xử lý lỗi thường gặp.

## 2. Những hạn chế của đề tài

Mặc dù hệ thống đã hoàn thành các chức năng chính, đề tài vẫn còn một số hạn chế nhất định. Trước hết, hệ thống mới dừng ở mức phục vụ quy trình tuyển sinh trực tuyến cơ bản, chưa triển khai đầy đủ các nghiệp vụ phức tạp như xét tuyển tự động theo nhiều tiêu chí, quản lý nhiều đợt tuyển sinh song song hoặc tự động xếp lớp sau khi học viên trúng tuyển.

Các chức năng thanh toán, gửi email và lưu trữ tệp đã được tích hợp nhưng chủ yếu phục vụ môi trường thử nghiệm. Khi triển khai thực tế, hệ thống cần được cấu hình bảo mật chặt chẽ hơn, kiểm tra giao dịch với dữ liệu thật, đồng thời bổ sung cơ chế ghi log, cảnh báo và đối soát để giảm rủi ro trong quá trình vận hành.

Ngoài ra, giao diện hệ thống đã đáp ứng các thao tác cơ bản nhưng vẫn có thể tiếp tục cải thiện về trải nghiệm người dùng, đặc biệt ở các màn hình có nhiều dữ liệu như quản lý hồ sơ, quản lý điểm thi, import/export và dashboard thống kê. Một số chức năng báo cáo hiện mới dừng ở mức tổng quan, chưa có các biểu đồ phân tích chuyên sâu phục vụ việc ra quyết định của nhà trường.

Về kiểm thử, hệ thống đã có các testcase chức năng chính, tuy nhiên vẫn cần bổ sung thêm kiểm thử hiệu năng, kiểm thử bảo mật, kiểm thử khả năng chịu tải và kiểm thử trên nhiều trình duyệt, thiết bị khác nhau. Điều này đặc biệt quan trọng nếu hệ thống được đưa vào sử dụng trong các kỳ tuyển sinh có số lượng truy cập lớn.

## 3. Hướng phát triển và mở rộng trong tương lai

Trong tương lai, hệ thống có thể được phát triển theo hướng hoàn thiện hơn quy trình tuyển sinh và nâng cao khả năng vận hành thực tế. Trước hết, có thể bổ sung chức năng quản lý nhiều đợt tuyển sinh, nhiều cơ sở đào tạo, nhiều chương trình học và nhiều nhóm đối tượng học viên. Việc này giúp hệ thống phù hợp hơn với các đơn vị giáo dục có quy mô lớn hoặc có nhiều chương trình đào tạo khác nhau.

Hệ thống cũng có thể mở rộng chức năng xét tuyển tự động dựa trên điểm thi, trình độ đầu vào, số lượng chỉ tiêu, điều kiện chương trình và trạng thái hồ sơ. Sau khi học viên đạt yêu cầu, hệ thống có thể tự động đề xuất chương trình học, xếp lớp, gửi thông báo nhập học và sinh các giấy tờ cần thiết như phiếu báo nhập học hoặc biên nhận hồ sơ.

Về phía quản trị, cần phát triển thêm hệ thống báo cáo và thống kê nâng cao. Các báo cáo có thể bao gồm số lượng hồ sơ theo trạng thái, tỷ lệ hoàn tất hồ sơ, tỷ lệ thanh toán thành công, doanh thu theo thời gian, số lượng thí sinh theo lịch thi, tỷ lệ đạt đầu vào và hiệu quả của từng chương trình đào tạo. Các biểu đồ trực quan sẽ giúp quản trị viên theo dõi tình hình tuyển sinh nhanh hơn và đưa ra quyết định chính xác hơn.

Về bảo mật và vận hành, hệ thống nên bổ sung xác thực hai lớp cho tài khoản quản trị, cơ chế phân quyền chi tiết hơn theo từng nhóm chức năng, nhật ký hoạt động đầy đủ, cảnh báo khi có thao tác bất thường và chính sách sao lưu dữ liệu định kỳ. Đồng thời, cần tối ưu hiệu năng API, tối ưu truy vấn cơ sở dữ liệu và bổ sung cơ chế cache cho các dữ liệu công khai như banner, tin tức và chương trình đào tạo.

Ngoài ra, hệ thống có thể phát triển thêm các kênh thông báo như SMS, Zalo hoặc push notification để tăng khả năng tiếp cận học viên. Việc bổ sung phiên bản mobile app hoặc tối ưu giao diện trên thiết bị di động cũng là một hướng mở rộng cần thiết, vì nhiều phụ huynh và học viên thường sử dụng điện thoại trong quá trình đăng ký tuyển sinh.

Nhìn chung, đề tài đã xây dựng được nền tảng ban đầu cho một hệ thống tuyển sinh trực tuyến có khả năng ứng dụng thực tế. Với các hướng phát triển nêu trên, hệ thống có thể tiếp tục được hoàn thiện để đáp ứng tốt hơn nhu cầu quản lý tuyển sinh, nâng cao trải nghiệm người dùng và hỗ trợ nhà trường vận hành quy trình tuyển sinh một cách hiện đại, minh bạch và hiệu quả.
