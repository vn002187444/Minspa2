# Khôi Phục Cơ Sở Dữ Liệu — Min Nail & Hair

## Yêu Cầu
- Supabase CLI (`npm install -g supabase`)
- Quyền truy cập project Supabase (Project ID + DB Password)
- File backup `.sql` từ `scripts/backup.sh`

## Các Bước Khôi Phục

### 1. Xác định file backup
Các file backup nằm trong `./backups/` với định dạng `backup_YYYYMMDD_HHMMSS.sql`.
Chọn file gần nhất hoặc theo thời điểm mong muốn.

### 2. Khôi phục (Dry Run — kiểm tra trước)
```bash
supabase db diff --project-ref "$SUPABASE_PROJECT_ID" --file "./backups/backup_20250101_120000.sql"
```

### 3. Khôi phục thật
```bash
supabase db push --project-ref "$SUPABASE_PROJECT_ID" --db-password "$SUPABASE_DB_PASSWORD" < "./backups/backup_20250101_120000.sql"
```
Hoặc dùng `psql` trực tiếp:
```bash
psql "postgresql://postgres:$SUPABASE_DB_PASSWORD@$SUPABASE_HOST:5432/postgres" < "./backups/backup_20250101_120000.sql"
```

### 4. Sau khi khôi phục
- Kiểm tra số lượng bản ghi: `scripts/verify-backup.sh`
- Kiểm tra login admin hoạt động
- Kiểm tra booking flow
- Kiểm tra cron job (nếu có)

## Phục Hồi Khẩn Cấp (Point-in-Time Recovery)
Supabase Pro plan hỗ trợ PITR 7 ngày. Liên hệ Supabase Dashboard → Database → Backups → Restore.

## Lưu Ý
- Backup chỉ chứa schema + data (không chứa storage files)
- Storage (ảnh) cần backup riêng qua Supabase Dashboard → Storage → Backup
- Luôn kiểm tra file backup trước khi xóa bản cũ
