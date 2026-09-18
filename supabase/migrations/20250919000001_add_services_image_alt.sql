-- Add image_alt to services for GEO/AEO pipeline
-- Deploy 1 gộp PR1+PR2 — cho phép AI tìm ảnh auto bổ sung alt
alter table public.services add column if not exists image_alt text;
comment on column public.services.image_alt is 'Alt text SEO auto-gen: {name} - {category} tại Min Nail & Hair Lavita Charm Thủ Đức, enforce GEO';

-- Index for audit null/empty alts
create index if not exists idx_services_image_alt_null on public.services ((image_alt is null or image_alt = ''));

-- Backfill existing rows where null/empty (1-time, idempotent)
update public.services
set image_alt = (name || case when category is not null and category <> '' then ' - ' || category else '' end || ' tại Min Nail & Hair Lavita Charm Thủ Đức')
where image_alt is null or btrim(image_alt) = '';
