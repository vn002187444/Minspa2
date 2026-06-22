# Supabase Feature Inventory

## 🔴 Đã dùng — Không được quên

| Feature | Cách dùng | Files |
|---------|-----------|-------|
| **pg_cron** | Schedule job via SQL (`cron.schedule`), gọi Next.js API qua pg_net | `migrate_v312_auto_seo.sql`, `migrate_p3_16_*.sql`, `migrate_p2_17_*.sql`, `migrate_p2_18_*.sql` |
| **pg_net** | HTTP POST từ database đến Next.js API endpoint | Cùng file với pg_cron + `migrate_p3_17_db_webhook.sql` |
| **pgmq** | Queue `background_tasks` — enqueue/dequeue RPC | `migrate_p3_18_pgmq_queue.sql`, `lib/queue.ts`, `app/api/background-worker/route.ts` |
| **Realtime (Postgres Changes)** | 5 channels: schedule, notifications, staff appointments | `lib/realtime.ts`, `hooks/useNotifications.ts`, `components/NotificationBell.tsx`, `app/staff/page.tsx` |
| **Storage** | Bucket `seo-images` (public) | `app/admin/actions.ts` (upload + getPublicUrl) |
| **Database Functions (RPC)** | 12 functions: increment_blog_view, deduct/refund package, enqueue/dequeue, cleanup, trigger_* | `lib/queue.ts`, `app/api/blog/view/route.ts`, `app/staff/actions.ts`, `app/booking/actions/customer.ts` |
| **Database Triggers** | 2 triggers: appointment webhook, update last_booking | `migrate_p3_17_db_webhook.sql`, `migrate_p2_12_customers_columns.sql` |
| **RLS** | Enabled on all tables (bypassed by SERVICE_ROLE) | `migrate_p2_7_rls_hardening.sql`, `migrate_p7_12_rls_notifications.sql`, `migrate_v312_auto_seo.sql` |

## 🟡 Có sẵn — Chưa dùng, nên cân nhắc

| Feature | Mô tả | Khi nào nên dùng |
|---------|-------|-------------------|
| **Edge Functions** | Serverless Deno functions, không cần Next.js API route | Cron heavy, webhooks từ bên thứ ba, xử lý ảnh nặng |
| **Database Webhooks** | Supabase built-in webhooks (không cần pg_net) | Đơn giản hơn pg_net, HTTP call khi có INSERT/UPDATE/DELETE |
| **GraphQL (pg_graphql)** | Tự động expose schema thành GraphQL | Khi cần query linh hoạt từ client, giảm số lượng REST endpoint |
| **Vault** | Encrypted secrets storage trong database | Lưu API key (MoMo, ZaloPay, Gemini…) an toàn |
| **Wrappers (FDW)** | Foreign Data Wrappers: Stripe, Airtable, ClickHouse… | Tích hợp dữ liệu external (chưa có nhu cầu) |
| **Supabase Auth** | Built-in auth (magic link, OAuth, phone) | Hiện tại dùng custom JWT, có thể migrate sau nếu cần social login |
| **Realtime Broadcast/Presence** | Gửi message realtime không cần DB | Chat, typing indicator, online status |
| **Vector (pgvector)** | Embeddings + similarity search | Khi cần semantic search / AI recommendation nâng cao |
| **Supabase CLI / Local Dev** | `supabase start/stop`, migration versioning | Khi có nhiều dev cùng làm, cần migration history |

## ✅ Rule: Checklist trước khi code tính năng mới

Trước khi viết bất kỳ code nào cho tính năng mới, **phải** kiểm tra:

1. **Có Supabase feature sẵn sàng giải quyết vấn đề này không?**
   - Cần schedule job định kỳ? → **pg_cron + pg_net** (đã có sẵn)
   - Cần queue xử lý bất đồng bộ? → **pgmq** (đã có sẵn)
   - Cần realtime update cho client? → **Realtime Postgres Changes** (đã có sẵn)
   - Cần lưu file ảnh? → **Storage** (đã có bucket)
   - Cần trigger tự động khi data thay đổi? → **Database Trigger + pg_net** (pattern có sẵn)
   - Cần expose API public? → **Supabase Data API + RLS** (đã config sẵn)

2. **Nếu Supabase feature phù hợp → KHÔNG tạo giải pháp mới**
   - Không tự viết cron → dùng pg_cron
   - Không tự viết queue → dùng pgmq
   - Không tự viết webhook → dùng Database Webhooks hoặc pg_net

3. **Migration SQL phải đi kèm với code**
   - Nếu thay đổi schema → có migration file
   - Nếu cần schedule mới → thêm `cron.schedule()` trong migration
   - Nếu cần queue mới → thêm `pgmq.create()` trong migration
   - Nếu cần trigger → thêm trigger function + trigger trong migration
