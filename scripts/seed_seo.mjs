import { createClient } from '@supabase/supabase-js';
import { config } from 'dotenv';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
config({ path: resolve(__dirname, '../.env.local') });

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!url || !key) {
  console.error('Missing SUPABASE env vars.');
  console.error('NEXT_PUBLIC_SUPABASE_URL:', url ? 'OK' : 'MISSING');
  console.error('SUPABASE_SERVICE_ROLE_KEY:', key ? 'OK' : 'MISSING');
  process.exit(1);
}

const supabase = createClient(url, key);

const articles = [
  {
    id: 'goi-duong-sinh-thu-duc',
    topic: 'Gội đầu dưỡng sinh tại Thủ Đức',
    keywords: 'gội dưỡng sinh Thủ Đức, gội đầu thảo dược, massage đầu',
    article: `# Gội Đầu Dưỡng Sinh Tại Thủ Đức – Trải Nghiệm Thư Giãn Đỉnh Cao

## Gội Đầu Dưỡng Sinh Là Gì?
Gội đầu dưỡng sinh là phương pháp chăm sóc tóc và da đầu kết hợp massage ấn huyệt, sử dụng các loại thảo dược thiên nhiên. Không chỉ làm sạch tóc, phương pháp này còn giúp lưu thông khí huyết, giảm căng thẳng.

## Tại Sao Nên Chọn Gội Đầu Dưỡng Sinh Tại Min Nail & Hair?
Tọa lạc tại **Chung cư Lavita Charm, Đường số 1, Trường Thọ, Thủ Đức**, Min Nail & Hair tự hào mang đến dịch vụ gội đầu dưỡng sinh cao cấp với thảo dược tự nhiên và massage ấn huyệt chuyên sâu.

## Các Combo Gội Đầu Dưỡng Sinh Tại Min
- **Gội nhanh** (30 phút – 65.000đ)
- **Gội thư giãn** (30 phút – 69.000đ)
- **Combo 1 – An Yên** (60 phút – 149.000đ)
- **Combo 2 – Tầm Trung** (70 phút – 199.000đ)
- **Combo 3 – Chuyên Sâu** (80 phút – 279.000đ)
- **Combo 4 – Thượng Hạng** (90 phút – 379.000đ)

## Đặt Lịch Ngay Hôm Nay
Đặt lịch online tại Min Nail & Hair để nhận ưu đãi giảm 5% và được lựa chọn kỹ thuật viên yêu thích!`
  },
  {
    id: 'nail-art-thu-duc',
    topic: 'Nail Art đẹp tại Thủ Đức',
    keywords: 'nail art Thủ Đức, sơn gel, vẽ móng, nối móng',
    article: `# Nail Art Đẹp – Chất Lượng Cao Tại Min Nail & Hair Thủ Đức

## Xu Hướng Nail Art 2026
Nail art không chỉ là tô điểm cho bộ móng mà còn là cách thể hiện phong cách cá nhân. Các xu hướng nổi bật: móng đơn sắc pastel, móng mắt mèo ánh kim, móng Hàn Quốc tối giản.

## Dịch Vụ Nail Tại Min
- **Sơn gel** (30 phút – 110.000đ)
- **Nối móng úp** (45 phút – 150.000đ)
- **Tráng gương / Mắt mèo** (45 phút – 150.000đ)
- **Combo Sơn Gel + cắt da** (45 phút – 99.000đ)
- **Combo Sơn Thạch + cắt da** (45 phút – 119.000đ)
- **Combo Mắt mèo + cắt da** (45 phút – 139.000đ)

## Tại Sao Chọn Min?
- Sơn gel organic cao cấp, an toàn cho móng
- Kỹ thuật viên tay nghề cao, cập nhật xu hướng mới
- Vệ sinh tiệt trùng dụng cụ đảm bảo an toàn

Hãy đến Min Nail & Hair – Chung cư Lavita Charm, Thủ Đức để trải nghiệm dịch vụ nail chuyên nghiệp!`
  },
  {
    id: 'massage-body-thu-duc',
    topic: 'Massage Body thư giãn tại Thủ Đức',
    keywords: 'massage body Thủ Đức, massage trị liệu, xoa bóp giảm đau',
    article: `# Massage Body Thư Giãn – Trị Liệu Tại Min Nail & Hair Thủ Đức

## Lợi Ích Của Massage Body
Massage body giúp giảm đau nhức cơ bắp, cải thiện tuần hoàn máu, giảm căng thẳng và hỗ trợ giấc ngủ.

## Các Gói Massage Tại Min
- **Body 60 phút** – 285.000đ (giảm còn từ 300.000đ)
- **Body 75 phút** – 356.000đ
- **Body 90 phút** – 404.000đ
- **Body 120 phút** – 499.000đ

## Kỹ Thuật Massage Đặc Trưng
Massage Thụy Điển, ấn huyệt, đá nóng – kết hợp tinh dầu thiên nhiên.

Không gian spa tại Chung cư Lavita Charm với ánh sáng ấm, nhạc thiền du dương. Đặt lịch ngay để nhận ưu đãi 5%!`
  },
  {
    id: 'cham-soc-toc-thu-duc',
    topic: 'Chăm sóc tóc chuyên sâu tại Thủ Đức',
    keywords: 'chăm sóc tóc Thủ Đức, dưỡng tóc, trị gàu, giảm rụng tóc',
    article: `# Chăm Sóc Tóc Chuyên Sâu Tại Min Nail & Hair Thủ Đức

## Các Vấn Đề Tóc Thường Gặp
- **Tóc khô xơ**: Thiếu dưỡng chất – Giải pháp: dưỡng tóc thảo dược
- **Rụng tóc**: Stress, nội tiết – Giải pháp: massage ấn huyệt + gội thảo dược
- **Gàu – ngứa**: Nấm da đầu – Giải pháp: gội thảo dược kháng khuẩn

## Liệu Trình Tại Min
- **Combo 1 – An Yên** (60 ph – 149.000đ): Gội thảo dược + massage đầu + ủ tóc
- **Combo 2 – Tầm Trung** (70 ph – 199.000đ): + massage vai gáy + xông hơi
- **Combo 3 – Chuyên Sâu** (80 ph – 279.000đ): + massage toàn thân + mặt nạ tóc
- **Combo 4 – Thượng Hạng** (90 ph – 379.000đ): Full service cao cấp

Liên hệ Min Nail & Hair – Lavita Charm, Thủ Đức để được tư vấn!`
  },
  {
    id: 'combo-goi-massage-lavita',
    topic: 'Combo gội đầu massage tại Lavita Charm Thủ Đức',
    keywords: 'Lavita Charm Thủ Đức, gội massage, làm đẹp Trường Thọ',
    article: `# Trải Nghiệm Combo Gội Đầu Massage Tại Lavita Charm – Thủ Đức

Min Nail & Hair tọa lạc tại **Chung cư Lavita Charm, Đường số 1, phường Trường Thọ, Thủ Đức** – vị trí thuận lợi, dễ dàng di chuyển.

## Combo Gội Đầu + Massage
- **Combo Tiết Kiệm** (60 ph – 149.000đ): Gội thảo dược + massage đầu + sấy
- **Combo Thư Giãn** (75 ph – 199.000đ): + massage cổ vai gáy + chườm nóng
- **Combo Cao Cấp** (90 ph – 279.000đ): + massage body 30 ph + đắp mặt nạ

## Tiện Ích
- Chỗ đậu xe rộng rãi
- Không gian máy lạnh
- Phục vụ theo giờ hẹn, không chờ đợi

Giảm 5% khi đặt online. Cư dân Lavita Charm được ưu tiên giờ hẹn linh hoạt!`
  },
  {
    id: 'son-gel-dep-thu-duc',
    topic: 'Sơn gel đẹp bền lâu tại Thủ Đức',
    keywords: 'sơn gel Thủ Đức, sơn móng tay đẹp, làm móng Thủ Đức',
    article: `# Sơn Gel Đẹp – Bền Màu – An Toàn Tại Min Nail & Hair Thủ Đức

Sơn gel là lựa chọn số một nhờ độ bền màu 2-3 tuần, bề mặt bóng đẹp. Tại Min, chúng tôi dùng sơn gel organic cao cấp.

## Bảng Giá
- Sơn gel: 110.000đ
- Tráng gương / Mắt mèo: 150.000đ
- Combo Sơn Gel + cắt da: 99.000đ
- Combo Sơn Thạch + cắt da: 119.000đ
- Combo Mắt mèo + cắt da: 139.000đ

## Quy Trình Chuẩn
Vệ sinh → cắt da → dũa tạo dáng → phủ gel nền → sơn màu → phủ bóng → dưỡng dầu

## Mẹo Giữ Sơn Gel Lâu
Tránh hóa chất mạnh, đeo găng tay khi rửa chén, dưỡng dầu biểu bì mỗi ngày.

Ghé Min Nail & Hair – Lavita Charm, Thủ Đức ngay hôm nay!`
  },
  {
    id: 'goi-thao-duoc-tai-nha',
    topic: 'Công thức gội đầu thảo dược tại nhà',
    keywords: 'gội đầu thảo dược, công thức bồ kết, nấu nước gội đầu',
    article: `# Công Thức Nấu Nước Gội Đầu Thảo Dược Tại Nhà

## 1. Nước Gội Bồ Kết – Sả Chanh
Nguyên liệu: 10 quả bồ kết nướng, 5 củ sả, 3 quả chanh, vỏ bưởi
Cách nấu: Bồ kết nướng thơm, đập dập cùng sả. Đun với 2 lít nước 20 phút. Lọc bỏ bã.

## 2. Nước Gội Hương Nhu – Tía Tô
Công dụng: Giảm ngứa da đầu, kháng khuẩn, trị gàu.

## 3. Nước Gội Lá Dâu Tằm
Công dụng: Kích thích mọc tóc, giảm rụng tóc.

Nếu không có thời gian nấu, hãy đến Min Nail & Hair – Lavita Charm, Thủ Đức để trải nghiệm dịch vụ gội đầu dưỡng sinh cao cấp!`
  },
  {
    id: 'cham-soc-mong-tai-nha',
    topic: 'Cách chăm sóc móng tay móng chân tại nhà',
    keywords: 'chăm sóc móng, dưỡng móng, cắt da móng, làm móng tại nhà',
    article: `# Hướng Dẫn Chăm Sóc Móng Tay – Móng Chân Tại Nhà

## Các Bước Chăm Sóc Móng
1. **Vệ sinh**: Ngâm nước ấm pha muối 5-10 phút, chải nhẹ
2. **Cắt – dũa**: Cắt theo đường cong tự nhiên, dũa một chiều
3. **Dưỡng ẩm**: Thoa dầu dưỡng biểu bì hàng ngày

## Khi Nào Nên Đến Salon?
Đến Min Nail & Hair định kỳ 2-3 tuần/lần để cắt da chuyên sâu, đổi màu sơn mới, kiểm tra sức khỏe móng.

## Dịch Vụ Tại Min
- Nhặt da lẻ: 45.000đ
- Phá sơn gel: 20.000đ
- Tháo móng bột: 40.000đ
- Chà gót chân 5 bước: 149.000đ

Đến ngay Min Nail & Hair – Chung cư Lavita Charm, Thủ Đức!`
  },
  {
    id: 'uu-dai-lam-dep-online',
    topic: 'Ưu đãi làm đẹp khi đặt lịch online tại Min',
    keywords: 'đặt lịch online, ưu đãi làm đẹp, giảm giá nail gội đầu',
    article: `# Ưu Đãi Đặc Biệt Khi Đặt Lịch Online Tại Min Nail & Hair

## Tiện Lợi
- Chọn ngày giờ (9:00-20:30)
- Chọn kỹ thuật viên yêu thích
- Xem trước giá dịch vụ
- Giảm ngay **5%** tổng hóa đơn

## Cách Đặt
1. Chọn ngày và khung giờ
2. Chọn dịch vụ (có thể chọn nhiều)
3. Nhập thông tin cá nhân
4. Xác nhận – nhận mã giảm 5%

## FAQ
- **Hủy lịch?** Có, trước 2 giờ.
- **Chọn thợ?** Có, hoặc chọn ngẫu nhiên.
- **Ưu đãi 5%?** Áp dụng mọi dịch vụ.

Đặt lịch ngay tại Min Nail & Hair – Lavita Charm, Thủ Đức!`
  },
  {
    id: 'deal-combo-tiet-kiem',
    topic: 'Combo deal tiết kiệm nail gội massage tại Thủ Đức',
    keywords: 'combo tiết kiệm, deal nail gội đầu, giảm giá làm đẹp Thủ Đức',
    article: `# Combo Deal Tiết Kiệm – Nail, Gội, Massage Giá Tốt Tại Thủ Đức

## Combo Deal Siêu Tiết Kiệm
- **Combo Sơn Gel + cắt da**: 99.000đ
- **Combo Sơn Thạch + cắt da**: 119.000đ
- **Combo Mắt mèo + cắt da**: 139.000đ
- **Chà gót chân theo combo**: 99.000đ

## Deal Massage Giảm Đến 5%
- Body 60 ph: 285.000đ
- Body 90 ph: 404.000đ
- Body 120 ph: 499.000đ

Đặt lịch online để nhận thêm ưu đãi 5% tổng hóa đơn!

📍 Chung cư Lavita Charm, Đường số 1, Trường Thọ, Thủ Đức
📞 Hotline: 0934 323 878`
  },
];

function normalizeNFC(obj) {
  if (typeof obj === 'string') return obj.normalize('NFC');
  if (Array.isArray(obj)) return obj.map(normalizeNFC);
  if (obj && typeof obj === 'object') {
    const n = {};
    for (const k in obj) { if (Object.prototype.hasOwnProperty.call(obj, k)) n[k] = normalizeNFC(obj[k]); }
    return n;
  }
  return obj;
}

for (const article of articles) {
  const { error } = await supabase.from('seo_articles').upsert(normalizeNFC(article), { onConflict: 'id' });
  if (error) {
    console.error(`❌ ${article.id}: ${error.message}`);
  } else {
    console.log(`✅ ${article.id}`);
  }
}

console.log(`\nDone! ${articles.length} articles inserted.`);
