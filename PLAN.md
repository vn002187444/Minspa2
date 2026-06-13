# 📋 LỘ TRÌNH PHÁT TRIỂN & QUẢN LÝ TÍNH NĂNG - MIN NAIL & HAIR

Chào mừng đến với bảng kế hoạch tổng thể của dự án **Min Nail & Hair**. Tài liệu này ghi nhận hành trình phát triển, trạng thái hoàn thành của từng module và luồng nghiệp vụ (Workflow) cốt lõi của hệ thống.

---

## 🗺️ LỘ TRÌNH 7 GIAI ĐOẠN NÂNG CẤP CỐT LÕI

### 🟢 Giai đoạn 1: Khởi Tạo Hệ Thống & Booking Client (Đặt Lịch Trực Tuyến)
Cung cấp giao diện đặt lịch mượt mà cho khách hàng ngoài trang chủ không cần đăng nhập phức tạp.
- [x] Giao diện Landing Page chuẩn Spa: Sang trọng, ấm cúng và đầy đủ thông tin dịch vụ.
- [x] Module Booking thông minh: Cho phép chọn dịch vụ, chọn nhân viên (hoặc ngẫu nhiên), chọn ngày giờ trực quan.
- [x] Tích hợp kiểm tra thẻ liệu trình chủ động: Khách hàng nhập số điện thoại, hệ thống tự nhận diện các gói liệu trình còn buổi của họ để đề xuất sử dụng ngay khi đặt lịch.
- [x] Tra cứu lịch hẹn (`AppointmentLookup`): Tìm kiếm trạng thái lịch hẹn qua SĐT.

### 🟢 Giai đoạn 2: Hệ Thống Quản Trị Nhân Viên (Staff Portal) & Admin
Phân quyền truy cập bảo mật cao qua phân hệ Admin và Portal cho thợ làm móng/tóc.
- [x] Đăng nhập phân quyền (`ADMIN`, `MANAGER` hoặc `STAFF`).
- [x] Giao diện Quầy Nhân Viên (`/staff`):
  - [x] Chấm công đầu ngày (Chụp ảnh/Check-in vị trí hoặc trạng thái).
  - [x] Quản lý danh sách lịch hẹn được giao trong ngày, cập nhật trạng thái lịch hẹn (`CONFIRMED` -> `IN_PROGRESS` -> `COMPLETED`).
  - [x] Tính toán hoa hồng tức thời dựa trên dịch vụ đã phục vụ và tiền Tip từ khách hàng.
- [x] Giao diện Quản trị viên (`/admin`):
  - [x] Tổng quan tình trạng đặt lịch hôm nay.
  - [x] Quản lý doanh thu, biểu đồ phân bổ trạng thái lịch hẹn.
  - [x] Quản lý dịch vụ (kèm upload/tạo ảnh AI), gói liệu trình, nhân viên.
  - [x] Quản lý lịch tổng (`/admin/schedule`) hiển thị các cột giờ có khách.
  - [x] Quản lý Blog SEO AI, SEO settings, bank settings, banner settings.

### 🟢 Giai đoạn 3: Phân Hệ Blog SEO & Trí Tuệ Nhân Tạo (Creative AI)
Tăng trưởng lượng truy cập tự nhiên (Organic Traffic) nhờ hệ thống viết bài thông minh.
- [x] Trang danh sách Blog công khai (`/blog`) hiển thị đầy đủ tin tức chăm sóc sắc đẹp.
- [x] Trang chi tiết bài viết chuẩn SEO (`/blog/[slug]`) hỗ trợ hiển thị Markdown mềm mại.
- [x] Trình quản trị Blog SEO AI (`/admin?tab=blog` hoặc `/admin/blog`):
  - [x] Viết bài chuẩn SEO tự động bằng Gemini (`gemini-2.5-flash-lite`) tích hợp nghiên cứu thông tin làm đẹp online thời gian thực (Google Search Grounding).
  - [x] Chức năng sinh từ khóa SEO tự động gắn liền với địa danh địa phương (Ví dụ: "gội dưỡng sinh Lavita Charm", "làm móng Thủ Đức").
  - [x] Quản lý lịch sử bài viết đã lưu, cho phép chỉnh sửa bài viết trực tiếp qua giao diện trực quan trước khi phát hành.

### 🟢 Giai đoạn 4: Quản Lý Phân Loại Dịch Vụ & Biểu Phí Khuyến Mãi
- [x] Quản lý danh mục dịch vụ (Móng, Gội dưỡng sinh, Massage, Deal).
- [x] Thiết lập giảm giá (`discount_percentage`) trực tiếp cho từng dịch vụ để tự độ áp dụng vào giá trị hóa đơn.
- [x] Thiết lập ẩn/hiện (`is_active` - Soft Delete) của dịch vụ để không ảnh hưởng đến dữ liệu lịch hẹn cũ.
- [x] Upload ảnh dịch vụ thủ công hoặc AI tạo ảnh dịch vụ, lưu vào Supabase Storage (`seo-images` bucket), hiển thị trên homepage và menu dịch vụ.

### 🟢 Giai đoạn 5: Phân Hệ CRM Khách Hàng & Quản Lý Gói Liệu Trình (Treatment Packages)
Hỗ trợ Spa giữ chân khách hàng (Retention Rate) thông qua các gói mua trước sử dụng sau.
- [x] Quản lý hồ sơ khách hàng đầy đủ tại mục Admin & Staff (Xem lịch sử đặt hẹn, tổng chi tiêu, đánh giá dịch vụ).
- [x] Quản lý gói liệu trình gốc (`treatment_packages`): Định nghĩa gói (Ví dụ: Mua 5 tặng 1, mua 10 tặng 2) kèm theo dịch vụ áp dụng và đơn giá.
- [x] Soft delete cho gói liệu trình (`is_active`): Ẩn gói thay vì xóa cứng, hiển thị "Đã ẩn" trong admin, filter `is_active=true` cho public.
- [x] Cấp phát gói cho khách hàng (`customer_packages`): Thêm gói trực tiếp cho khách hàng tại màn hình Quản trị/Nhân viên khi họ mua trực tiếp tại quầy.
- [x] Quản lý lịch sử trừ buổi (`package_usage_logs`): Ghi log chi tiết mỗi khi trừ buổi (Ai trừ, lúc nào, lịch hẹn nào).

### 🟢 Giai đoạn 6: Tính Năng PWA, Web Push & Nhắc Lịch Tự Động (Reminders Cron)
Tối ưu hóa khả năng liên quan đến chăm sóc khách hàng và chấm công nhân sự.
- [x] Hỗ trợ cài đặt ứng dụng dạng PWA (`InstallPWA.tsx`) trên cả thiết bị iOS (Safari) và Android.
- [x] Chạy nền theo lịch trình thông minh `/api/cron-check` và `/api/cron/reminders` để tự động thực hiện các hành động:
  - [x] **Cảnh báo chấm công (Attendance Reminders Log)**: Nhắc nhở nhân viên chưa chấm công check-in mỗi sáng.
  - [x] **Nhắc lịch hẹn ngẫu nhiên (Random Booking Reminders)**: Gửi thông báo đến Admin khi có lịch hẹn được đặt ngẫu nhiên nhân viên chưa được gán.
  - [x] **Nhắc duyệt lịch (Unaccepted Booking Reminders)**: Cảnh báo khi có lịch hẹn trạng thái PENDING quá lâu chưa được đổi sang CONFIRMED.
  - [x] **Nhắc hoàn thành lịch (Uncompleted Booking Reminders)**: Tự động cảnh báo các đơn đặt lịch đã qua thời gian hẹn nhưng nhân viên chưa chuyển thành COMPLETED.

### 🟡 Giai đoạn 7: Hệ Thống KPI, Chấm Công Nâng Cao & Tối Ưu Hiệu Năng
- [/] Tinh chỉnh hệ thống log reminders background để tối ưu hóa tần suất chạy hạn chế quá tải bộ nhớ.
- [x] Quản lý bảng chấm công (`attendance`) theo ngày cho toàn bộ nhân sự spa.
- [ ] Tích hợp tính toán nợ lương/thưởng nâng cao tự động gửi báo cáo cuối tháng hóa đơn.

---

## 🔄 WORKFLOWS (LUỒNG QUY TRÌNH VẬN HÀNH PHỨC TẠP)

### 1. Luồng mua và trừ buổi Gói Liệu Trình (Treatment Package Flow)
```
[ Khách hàng đến tiệm ] ──> Kỹ thuật viên tư vấn bán gói liệu trình (Ví dụ: "Combo 5 Gội An Yên")
          │
          ▼
[ Admin/Staff cấp gói ] ──> Thêm mới bản ghi vào `customer_packages` (remaining_sessions = 6)
          │
          ▼
[ Khách hàng đặt lịch hẹn tiếp theo ]
          │
      ┌───┴─── Khách đặt qua Landing Page hoặc gọi trực tiếp 
      ▼
[ Hệ thống kiểm tra SĐT ] ──> Nhận diện gói liệu trình còn buổi ──> Đề xuất "Sử dụng 1 buổi"
          │
          ▼
[ Trị liệu hoàn tất ] ──> Nhân viên bấm "Hoàn thành Lịch Hẹn" (COMPLETED)
          │
          ▼
[ Hệ thống trừ buổi tự động ] ──> Trừ remaining_sessions và khởi tạo 1 bản ghi vào `package_usage_logs` để đối soát sau này.
```

### 2. Luồng phân quyền Nhân Viên (Admin & Staff Portal Flow)
- **ADMIN**:
  - Có toàn quyền truy cập toàn bộ hệ thống (`/app/admin`).
  - Quản lý doanh thu, cấu hình dịch vụ, thiết lập gói liệu trình, thêm tài khoản nhân viên, xem lịch sử nhật ký.
- **STAFF**:
  - Chỉ được phép truy cập cổng nhân viên `/app/staff` (nếu cố tình vào `/app/admin` sẽ bị Next.js Middleware hoặc logic chuyển hướng chặn lại).
  - Chỉ xem các lịch hẹn được giao cho cá nhân hoặc các lịch hẹn chung chờ phân bổ.
  - Được quyền check-in chấm công hàng ngày cho chính mình.
  - Được quyền trừ buổi gói liệu trình của khách hàng khi khách hàng đến làm đẹp tại quầy phục vụ của họ.

---

*Tài liệu này sẽ liên tục được cập nhật song hành cùng sự tiến bộ của dự án!*
