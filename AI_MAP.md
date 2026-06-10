# 🗺️ AI_MAP: BẢN ĐỒ KỸ THUẬT & KIẾN TRÚC DỮ LIỆU - MIN NAIL & HAIR

Chào mừng bạn đến với tài liệu **AI-Map**. Đây là bản đồ chỉ dẫn kỹ thuật, cấu trúc database, sơ đồ định tuyến và các nguyên tắc kiến trúc tối cao của toàn hệ thống **Min Nail & Hair** để đảm bảo quá trình phát triển không bao giờ xảy ra xung đột hoặc lỗi thiết kế.

---

## 💾 SƠ ĐỒ CẤU TRÚC DATABASE (SUPABASE / LOCAL DEMO DB)

Hệ thống sử dụng một bộ lưu trữ đồng nhất, liên kết thông suốt giữa Supabase Postgres thực tế và hệ thống Mock Database tại `/data/demo_db.json` & `/utils/supabase/server.ts` để tối ưu hóa preview lẫn môi trường live.

### 1. Bảng `users` (Quản lý Tài khoản & Phân Quyền)
Lưu trữ thông tin Quản trị viên (ADMIN) và Kỹ thuật viên (STAFF).
- `id` (UUID, Primary Key)
- `role` (VARCHAR - `ADMIN` hoặc `STAFF`)
- `username` (VARCHAR, Unique - Tài khoản đăng nhập)
- `password_hash` (VARCHAR - Mật khẩu đã băm hoặc lưu trữ an toàn)
- `full_name` (VARCHAR - Tên đầy đủ hiển thị trên lịch hẹn)
- `cccd` (VARCHAR, Nullable - Bắt buộc nhập đối với thợ STAFF)
- `notification_token` (JSONB - Lưu thông tin mã thông báo push notification)
- `created_at` (TIMESTAMP)

### 2. Bảng `customers` (Quản lý Hồ Sơ Khách Hàng)
- `id` (UUID, Primary Key)
- `full_name` (VARCHAR - Tên khách hàng)
- `phone` (VARCHAR, Unique - SĐT dùng để tra cứu lịch hẹn và liệu trình)
- `notification_token` (JSONB)
- `created_at` (TIMESTAMP)

### 3. Bảng `services` (Danh Mục Dịch Vụ)
- `id` (UUID hoặc VARCHAR, Primary Key)
- `name` (VARCHAR - Tên dịch vụ, ví dụ: "Gội dưỡng sinh CB1")
- `category` (VARCHAR - Phân loại: `Móng`, `Gội dưỡng sinh`, `Massage`, `Deal`)
- `description` (TEXT - Mô tả chi tiết các bước dịch vụ)
- `price` (DECIMAL - Đơn giá cơ sở)
- `duration` (INT - Thời lượng thực hiện tính bằng phút)
- `image_url` (VARCHAR, Nullable)
- `is_active` (BOOLEAN - Thiết lập ẩn hiện cho Soft Delete)
- `discount_percentage` (DECIMAL - Phần trăm ưu đãi)

### 4. Bảng `appointments` (Quản lý Lịch Hẹn)
- `id` (UUID, Primary Key)
- `customer_id` (UUID, References `customers.id`)
- `staff_id` (UUID, References `users.id` - Người thực hiện, có thể NULL nếu khách chọn ngẫu nhiên `PENDING_RANDOM`)
- `start_time` (TIMESTAMP)
- `end_time` (TIMESTAMP)
- `status` (VARCHAR - Trạng thái: `PENDING_RANDOM`, `CONFIRMED`, `IN_PROGRESS`, `COMPLETED`, `CANCELLED`)
- `tip_amount` (DECIMAL - Tiền Tip cho thợ)
- `total_amount` (DECIMAL - Tổng số tiền thanh toán thực tế)
- `commission_amount` (DECIMAL - Hoa hồng được tính cho nhân viên phục vụ)
- `created_at` (TIMESTAMP)

### 5. Bảng `appointment_services` (Bảng trung gian Lịch Hẹn - Dịch Vụ)
- `appointment_id` (UUID, References `appointments.id`)
- `service_id` (UUID, References `services.id`)
* Khóa chính kép: `(appointment_id, service_id)`

### 6. Bảng `reviews` (Đánh Giá Dịch Vụ)
- `id` (UUID, Primary Key)
- `appointment_id` (UUID, References `appointments.id`)
- `rating` (INT - Điểm số từ 1 đến 5)
- `quick_tags` (JSONB - Các nhãn nhanh, ví dụ: ["Chu đáo", "Tay nghề cao", "Sạch sẽ"])
- `comment` (TEXT - Bình luận tự do của khách hàng)
- `created_at` (TIMESTAMP)

### 7. Bảng `attendance` (Chấm Công Ngày)
- `id` (UUID, Primary Key)
- `staff_id` (UUID, References `users.id`)
- `date` (DATE)
- `status` (VARCHAR - `PRESENT` hoặc `ABSENT`)
- `check_in_time` (TIMESTAMP)
* Ràng buộc duy nhất: `UNIQUE(staff_id, date)`

### 8. Bảng `treatment_packages` (Gói Liệu Trình Gốc)
- `id` (VARCHAR hoặc UUID, Primary Key, ví dụ: "pkg-1")
- `name` (VARCHAR - Tên gói liệu trình, ví dụ: "Combo 5 Buổi Gội An Yên")
- `service_id` (UUID/VARCHAR, References `services.id` - Dịch vụ được bao gồm)
- `buy_count` (INT - Số buổi mua thực phẩm)
- `free_count` (INT - Số buổi tặng thêm)
- `price` (DECIMAL - Đơn giá trọn gói)
- `total_sessions` (INT - Tổng số buổi được hưởng = buy_count + free_count)
- `created_at` (TIMESTAMP)

### 9. Bảng `customer_packages` (Gói Sở Hữu Của Khách Hàng)
- `id` (UUID, Primary Key)
- `customer_id` (UUID, References `customers.id`)
- `package_id` (VARCHAR/UUID, References `treatment_packages.id`)
- `remaining_sessions` (INT - Số buổi còn lại chưa sử dụng)
- `purchased_at` (TIMESTAMP)
- `status` (VARCHAR)

### 10. Bảng `package_usage_logs` (Nhật Ký Sử Dụng Gói)
- `id` (UUID, Primary Key)
- `customer_package_id` (UUID, References `customer_packages.id`)
- `appointment_id` (UUID, References `appointments.id`)
- `staff_id` (UUID, References `users.id` - Kỹ thuật viên thực hiện trừ buổi)
- `used_at` (TIMESTAMP - Ngày giờ thực hiện trừ buổi)

### 11. Bảng `blogs` (Bản Tin SEO AI)
- `id` (VARCHAR/UUID, Primary Key)
- `title` (VARCHAR - Tiêu đề bài viết)
- `slug` (VARCHAR, Unique - Tên đường dẫn chuẩn SEO, không dấu, ngăn cách bằng dấu gạch ngang)
- `summary` (TEXT - Chuỗi mô tả tóm tắt ngắn bài đăng)
- `content` (TEXT - Nội dung bài viết dưới dạng Markdown)
- `image_url` (VARCHAR - Ảnh minh họa bài viết)
- `created_at` (TIMESTAMP)

---

## 🛠️ CÁC QUY TẮC KỸ THUẬT VÀ QUY ƯỚC CODE (REQUIRED)

1. **Không sử dụng `SELECT *`**: Luôn định rõ các trường cần lấy thông tin để tiết kiệm băng thông và tăng tốc độ kết xuất dữ liệu của Postgres/Supabase.
2. **Ưu tiên Client-side Filtering**: Đối với các màn hình quản trị và dashboard phức tạp, tải dữ liệu tổng quan một lần và phân loại lọc bằng cấu trúc React State thay vì liên tục gọi API lên server.
3. **Quy tắc Soft Delete**: Không được xóa trực tiếp bản dịch vụ (`services`) hoặc nhân viên (`users`). Bắt buộc cập nhật trạng thái `is_active = false` để giữ vững tính toàn vẹn dữ liệu cho các bảng lịch hẹn cũ liên quan.
4. **Mô-đun Web Push API & PWA**: Sử dụng cấu hình web push thông qua service worker thuần tích hợp trong thư mục `/public` để đảm bảo nhận thông báo ổn định nhất trên thiết bị di động của nhân viên mà không cần thư viện cồng kềnh.
5. **Đào tạo bài viết bằng Gemini 3.5 Flash**: Mọi truy vấn viết bài AI bắt buộc phải chạy qua proxy của server-side `/api/*` để giữ bí mật khóa API, đồng thời tích hợp hướng dẫn tìm kiếm online để liên tục cập nhật thông tin chuẩn xác.

---

## 🗺️ BẢN ĐỒ ROUTES CHÍNH CỦA ỨNG DỤNG

- **Trang chủ & Landing Page (`/`)**: Trình bày dịch vụ, feedback và nút đặt hẹn.
- **Trang Đặt Lịch Trực Tuyến (`/booking`)**: Luồng đặt lịch hẹn, kiểm tra thẻ liệu trình tích hợp.
- **Trang Đăng Nhập Hệ Thống (`/app/login`)**: Giao diện đăng nhập an toàn cho quản lý và nhân viên.
- **Trang Quản Trị Admin (`/app/admin`)**: Quản lý lịch hẹn, CRM, doanh thu, chăm sóc khách hàng, quản trị Blog SEO AI.
- **Trang Portal Nhân Viên (`/app/staff`)**: Điểm chấm công, xem lịch cá nhân, thực hiện trừ buổi liệu trình cho khách.
- **Trang Kiến Thức & Blog (`/blog/*`)**: Danh sách bài viết tin tức và chi tiết blog chuẩn SEO mượt mà.

---

## ⚠️ QUY CHẾ VẬN HÀNH (CYCLE PROTOCOL - BẮT BUỘC)

Với mỗi lượt tiếp nhận yêu cầu từ người dùng, bạn phải tuân thủ nghiêm ngặt 3 bước sau:
1. **Đọc kỹ `PLAN.md` và `AI_MAP.md`** để liên hệ bối cảnh thực tại.
2. **Tiến hành viết code** khoa học, tối ưu nhất.
3. **Tự động cập nhật hồ sơ lưu trữ** (`PLAN.md` - dấu tick `[x]`, `AI_MAP.md` nếu có cập nhật mới) và báo cáo rõ trạng thái cập nhật thành công lên màn hình phản hồi cho người dùng.
