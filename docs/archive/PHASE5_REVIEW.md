# Phase 5 Review — Cron Job Edge Function

## Hiện trạng Problem

```
PwaSupport.tsx → poll mỗi 30s → /api/cron-check → runRemindersCheck()
                                                         ↓
                                              Query 7 bảng (users, appointments, attendance, 4 log tables)
                                                         ↓
                                              Xử lý 4 rules + gửi push notification
```

### Vấn đề hiện tại:
- **30s polling từ client** — quá密集, tạo load không cần thiết
- **Query toàn bộ data mỗi 30s** — inefficient (O(n)), load DB mỗi lần
- **Client-side polling** — không tối ưu cho mobile users, tốn battery/bandwidth
- **PLAN.md ghi hoàn thành nhưng code chưa đúng** — cần fix

---

## Các tùy chọn trên Supabase

| Tính năng | **pg_cron + pg_net** | **Supabase Cron (UI)** | **Vercel Cron** | **Supabase Queues** |
|-----------|---------------------|----------------------|----------------|---------------------|
| Khả năng | Schedule SQL + HTTP | Same, qua Dashboard | Schedule API route | Message queue |
| Chi phí | Free | Free | Free plan bị hạn chế | Free |
| Setup | SQL query | Dashboard clicks | `vercel.json` | Cần consumer |
| Retry | ❌ Fire-and-forget | ❌ Fire-and-forget | ❌ | ✅ Có |
| Monitoring | `cron.job_run_details` | Dashboard | Vercel Logs | Dashboard |
| Phù hợp | ✅ | ✅ | ⚠️ Free plan hạn chế | ❌ Không phù hợp |

**Supabase Queues KHÔNG phù hợp** vì cần consumer để pull message, không phải scheduler.

---

## Đề xuất: pg_cron + Edge Function (Recommended)

### Tại sao:
1. `sendPushNotification()` dùng `web-push` library + gọi Supabase REST API — cần runtime có HTTP
2. Edge Function có 150s timeout (free plan) — đủ cho logic 4 rules
3. pg_cron schedule mỗi 5-10 phút — thay thế client polling 30s
4. **Miễn phí**, chạy trên Supabase, không phụ thuộc Vercel

### Architecture mới:

```
pg_cron (schedule mỗi 5 phút)
    ↓ pg_net
Edge Function "cron-reminders"
    ↓
Query Supabase + xử lý 4 rules + gửi push notification
    ↓
Không cần client-side polling nữa
```

### Các bước thực hiện:

| Bước | Chi tiết |
|------|----------|
| 1. Enable extensions | `pg_cron` + `pg_net` trên Supabase Dashboard |
| 2. Tạo Edge Function | `supabase/functions/cron-reminders/index.ts` — copy logic từ `utils/reminders.ts` |
| 3. Schedule | pg_cron mỗi 5 phút gọi Edge Function qua `net.http_post()` |
| 4. Xóa client polling | Xóa `setInterval` 30s trong `PwaSupport.tsx` (dòng 76) |
| 5. Cleanup | Giữ `/api/cron-check` route làm fallback hoặc xóa |

### Ưu điểm:
- Miễn phí — pg_cron, pg_net, Edge Function đều free tier
- Không cần client polling — giảm bandwidth, battery mobile
- Chạy trên Supabase — không phụ thuộc Vercel
- Monitoring qua `cron.job_run_details`

### Hạn chế:
- pg_net là fire-and-forget (không retry) — nhưng reminder không cần retry mạnh
- Edge Function free plan limit: 500,000 invocations/tháng (đủ dùng)
- Cần rewrite logic từ `utils/reminders.ts` sang Deno/Edge Function

---

## Code cần sửa nếu chọn pg_cron + Edge Function

### Files cần tạo:
- `supabase/functions/cron-reminders/index.ts` — logic reminders (copy từ `utils/reminders.ts`)

### Files cần sửa:
- `components/PwaSupport.tsx` — xóa polling `setInterval` 30s (dòng 52-81)
- `vercel.json` — xóa hoặc giữ cron config (nếu không dùng Vercel Cron)

### Files giữ nguyên:
- `app/api/cron-check/route.ts` — giữ làm fallback (optional)
- `app/api/cron/reminders/route.ts` — giữ nếu muốn gọi manual

---

## Alternative: pg_cron + pg_net gọi Next.js API

Nếu không muốn deploy Edge Function:
1. Giữ nguyên logic trong `utils/reminders.ts`
2. pg_cron + pg_net gọi `/api/cron-check` từ database
3. Vẫn xóa client polling

**Ưu điểm:** Không cần deploy thêm service mới
**Nhược điểm:** Vẫn phụ thuộc Next.js server, không chạy trên edge

---

## Alternative: Vercel Cron

Nếu dùng Vercel Pro:
1. Sửa `vercel.json` schedule: `*/5 * * * *`
2. Xóa client polling

**Ưu điểm:** Đơn giản nhất
**Nhược điểm:** Free plan bị giới hạn (1 job/ngày trên Hobby)

---

## Tổng kết

| Phương án | Chi phí | Độ phức tạp | Tối ưu |
|-----------|---------|------------|--------|
| pg_cron + Edge Function | Free | Trung bình | ⭐⭐⭐ |
| pg_cron + pg_net → API | Free | Thấp | ⭐⭐ |
| Vercel Cron | Pro plan | Thấp | ⭐ |

**Recommendation:** pg_cron + Edge Function — tối ưu nhất về chi phí, performance, và independence.
