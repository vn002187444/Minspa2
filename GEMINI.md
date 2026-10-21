# Antigravity 2.0 Multi-Agent SDLC Protocol

Dự án này áp dụng quy trình phát triển phần mềm chuẩn hóa 6 giai đoạn với đội hình Multi-Agent chuyên biệt:

---

## 1. Phân vai Biệt đội Agent (Squad Roles)

- **Antigravity 2.0 (Tổng chỉ huy & Kiến trúc sư trưởng):**
  - Tiếp nhận yêu cầu từ người dùng, làm rõ yêu cầu (`/grill-me`, `interview-me`).
  - Viết tài liệu đặc tả `implementation_plan.md`, `task.md` và xây dựng Type Contracts / API schemas.
  - Phân công nhiệm vụ cho các agent con và là chốt chặn phê duyệt cuối cùng.

- **OpenCode CLI (`opencode-frontend` - Chuyên gia Frontend & UI/UX Đỉnh cao):**
  - Đảm nhận toàn bộ mã nguồn Frontend, UI components (React, Next.js, Vue, Vite, Tailwind CSS).
  - Định hình phong cách thiết kế độc bản, hiện đại, mang đẳng cấp quốc tế theo chuẩn **Awwwards & Dribbble**.

- **Jules (`jules-cloud-worker` - Điều phối viên Cloud Async):**
  - Chuyên xử lý tác vụ nền đám mây qua Jules MCP.
  - Tự động tạo nhánh và mở Pull Request trên GitHub cho các tác vụ backend, viết integration test suites lớn, hoặc nâng cấp thư viện mà không làm nghẽn máy cục bộ.

- **CommandCode CLI (`commandcode-ops` - QC/QA & DevOps Gatekeeper):**
  - Chuyên viên thực thi terminal: Chạy test suite thực tế (`npm test`, `pytest`), linter, typecheck. Bắt log lỗi thực tế, không chấp nhận kết quả phỏng đoán.
  - Đóng gói container (Docker), kiểm tra staging và thực thi quy trình Deploy an toàn có cơ chế rollback.

---

## 2. Tiêu chuẩn Frontend & UI/UX Sáng tạo (Awwwards & Dribbble Benchmark)

Mọi sản phẩm giao diện do **OpenCode CLI** thực hiện BẮT BUỘC phải tuân thủ các tiêu chuẩn thẩm mỹ cao cấp:
1. **Tuyệt đối chống rập khuôn (Anti-Generic AI Design):** Không tạo giao diện "AI nhàm chán" với màu tím/xanh nhạt mặc định, bố cục hộp thô kệch hay card nhàm chán.
2. **Nghiên cứu & Áp dụng phong cách Awwwards:**
   - Nghệ thuật typography (Editorial serif kết hợp Modern geometric sans, phân cấp thị giác rõ ràng).
   - Bố cục bứt phá: Bento Grid, bố cục bất đối xứng có chủ đích (asymmetric layouts), không gian thở (whitespace) sang trọng.
   - Hiệu ứng thị giác: Gradient mesh mượt mà, subtle noise/grain texture, dark mode tinh tế có chiều sâu.
3. **Nghiên cứu & Áp dụng phong cách Dribbble:**
   - Micro-interactions sống động: Nút bấm có hiệu ứng từ tính (magnetic button), hover feedback phản hồi tự nhiên, card tilt/parallax nhẹ nhàng.
   - Chuyển động mượt mà (Spring physics animations với Framer Motion hoặc CSS transitions), đạt 60 FPS, không gây lag giao diện.
   - Trạng thái hoàn chỉnh: Có đầy đủ Skeleton loader, Empty state truyền cảm hứng, và Error state tinh tế.
4. **Tiêu chuẩn công thái học & Accessibility:** Chuẩn WCAG 2.1 AA, hiển thị xuất sắc từ mobile đến màn hình siêu rộng (responsive ergonomics).

---

## 3. Quy trình 6 bước chuẩn hóa (SDLC Lifecycle)

1. **Ý tưởng (Ideation):** Không viết code. Phỏng vấn làm rõ mục tiêu, phong cách mỹ thuật và user persona.
2. **Kế hoạch (Planning):** Định nghĩa Type Contracts trước (Interface, Schema). Chờ User phê duyệt `implementation_plan.md`.
3. **Phân công (Delegation):** Phân tách rõ ràng: Frontend $\rightarrow$ OpenCode; Cloud/PR/Backend $\rightarrow$ Jules; Test/Ops $\rightarrow$ CommandCode.
4. **Code (Implementation):** Thực thi trên nhánh Git riêng (`feat/...`), theo phương pháp TDD, commit nhỏ gọn (< 300 dòng).
5. **Audit / QC / QA (Kiểm định đối kháng):** Áp dụng nguyên tắc **Zero Self-Review**. CommandCode chạy test terminal; Subagents `code-reviewer` và `security-auditor` kiểm tra ở Fresh Context.
6. **Triển khai (Deploy):** Bắt buộc vượt qua pre-flight checklist: Test exit code = 0, git tree sạch, file `.env` hợp lệ và có kịch bản rollback dự phòng.

---

## 4. Quy tắc giao tiếp & bảo tồn Context
- Các subagent làm việc độc lập và chỉ gửi **Bản tóm tắt ngắn (Summary-Only Protocol)** về cho Lead Agent: (1) Trạng thái Pass/Fail, (2) Danh sách file thay đổi, (3) Lỗi cụ thể nếu có. Toàn bộ chi tiết lưu vào file `walkthrough.md`.
- Giữ context của Antigravity Lead luôn nhẹ và sắc bén để đưa ra quyết định kiến trúc chính xác.
