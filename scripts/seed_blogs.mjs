import { createClient } from '@supabase/supabase-js';
import { config } from 'dotenv';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
config({ path: resolve(__dirname, '../.env.local') });

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
if (!url || !key) { console.error('Missing env vars'); process.exit(1); }

const supabase = createClient(url, key);

const posts = [
  {
    title: 'Gội Đầu Dưỡng Sinh Tại Thủ Đức – Trải Nghiệm Thư Giãn Đỉnh Cao',
    slug: 'goi-dau-duong-sinh-tai-thu-duc',
    summary: 'Khám phá dịch vụ gội đầu dưỡng sinh thảo dược tại Min Nail & Hair – Lavita Charm Thủ Đức. Combo thư giãn, massage ấn huyệt, giá chỉ từ 65.000đ.',
    content: `# Gội Đầu Dưỡng Sinh Tại Thủ Đức – Trải Nghiệm Thư Giãn Đỉnh Cao

## Gội Đầu Dưỡng Sinh Là Gì?
Gội đầu dưỡng sinh là phương pháp chăm sóc tóc và da đầu kết hợp massage ấn huyệt, sử dụng các loại thảo dược thiên nhiên như bồ kết, sả, chanh, vỏ bưởi. Không chỉ làm sạch tóc, phương pháp này còn giúp lưu thông khí huyết, giảm căng thẳng và mang lại giấc ngủ sâu.

## Tại Sao Nên Chọn Gội Đầu Dưỡng Sinh Tại Min Nail & Hair?
Tọa lạc tại **Chung cư Lavita Charm, Đường số 1, Trường Thọ, Thủ Đức**, Min Nail & Hair tự hào mang đến dịch vụ gội đầu dưỡng sinh cao cấp với:

- **Nguyên liệu thảo dược tự nhiên**: Bồ kết, sả chanh, vỏ bưởi được nấu theo công thức gia truyền.
- **Massage ấn huyệt chuyên sâu**: Tác động lên các huyệt đạo vùng đầu, cổ, vai gáy giúp giảm đau nhức và mệt mỏi.
- **Không gian spa sang trọng**: Thiết kế ấm cúng, tinh dầu thơm dịu nhẹ tạo cảm giác thư thái.

## Các Combo Gội Đầu Dưỡng Sinh Tại Min

| Combo | Thời gian | Giá |
|-------|-----------|-----|
| Gội nhanh | 30 phút | 65.000đ |
| Gội thư giãn | 30 phút | 69.000đ |
| Combo 1 – An Yên | 60 phút | 149.000đ |
| Combo 2 – Tầm Trung | 70 phút | 199.000đ |
| Combo 3 – Chuyên Sâu | 80 phút | 279.000đ |
| Combo 4 – Thượng Hạng | 90 phút | 379.000đ |

## Đặt Lịch Ngay Hôm Nay
Đừng bỏ lỡ cơ hội trải nghiệm dịch vụ gội đầu dưỡng sinh tuyệt vời tại Min Nail & Hair. **Đặt lịch online ngay** để nhận ưu đãi giảm 5% và được lựa chọn kỹ thuật viên yêu thích!`,
    image_url: 'https://images.unsplash.com/photo-1519699047748-de8e457a634e?w=800&auto=format&fit=crop'
  },
  {
    title: 'Nail Art Đẹp – Chất Lượng Cao Tại Min Nail & Hair Thủ Đức',
    slug: 'nail-art-dep-tai-thu-duc',
    summary: 'Cập nhật xu hướng nail art 2026 với sơn gel organic, vẽ móng nghệ thuật, nối móng úp. Dịch vụ nail chuyên nghiệp tại Thủ Đức.',
    content: `# Nail Art Đẹp – Chất Lượng Cao Tại Min Nail & Hair Thủ Đức

## Xu Hướng Nail Art 2026
Nail art không chỉ là tô điểm cho bộ móng mà còn là cách thể hiện phong cách cá nhân. Các xu hướng nail art nổi bật bao gồm móng đơn sắc tông pastel, móng mắt mèo ánh kim, và móng Hàn Quốc tối giản.

## Dịch Vụ Nail Tại Min

| Dịch vụ | Thời gian | Giá |
|---------|-----------|-----|
| Sơn gel | 30 phút | 110.000đ |
| Nối móng úp | 45 phút | 150.000đ |
| Tráng gương / Mắt mèo | 45 phút | 150.000đ |
| Combo Sơn Gel + cắt da | 45 phút | 99.000đ |
| Combo Mắt mèo + cắt da | 45 phút | 139.000đ |

## Tại Sao Chọn Min Nail & Hair?
- **Sơn gel organic cao cấp**: An toàn cho móng, không gây xơ vàng
- **Kỹ thuật viên tay nghề cao**: Được đào tạo bài bản
- **Vệ sinh – tiệt trùng dụng cụ**: Đảm bảo an toàn tuyệt đối

Hãy đến **Min Nail & Hair – Chung cư Lavita Charm, Thủ Đức** để trải nghiệm!`,
    image_url: 'https://images.unsplash.com/photo-1604654894610-df63bc536371?w=800&auto=format&fit=crop'
  },
  {
    title: 'Massage Body Thư Giãn – Trị Liệu Tại Min Nail & Hair Thủ Đức',
    slug: 'massage-body-thu-gian-tai-thu-duc',
    summary: 'Dịch vụ massage body chuyên nghiệp tại Thủ Đức. Giảm đau nhức, cải thiện tuần hoàn máu, giảm căng thẳng. Giá từ 285.000đ.',
    content: `# Massage Body Thư Giãn – Trị Liệu Tại Min Nail & Hair Thủ Đức

## Lợi Ích Của Massage Body
- **Giảm đau nhức cơ bắp**: Giải phóng axit lactic tích tụ sau ngày dài làm việc
- **Cải thiện tuần hoàn máu**: Tăng cường oxy đến các mô cơ
- **Giảm căng thẳng, lo âu**: Kích thích sản sinh endorphin
- **Hỗ trợ giấc ngủ**: Thư giãn hệ thần kinh

## Các Gói Massage Tại Min
- Body 60 phút: 285.000đ (giảm từ 300.000đ)
- Body 75 phút: 356.000đ
- Body 90 phút: 404.000đ
- Body 120 phút: 499.000đ

**Đặt lịch massage ngay** để nhận ưu đãi 5% khi đặt online!`,
    image_url: 'https://images.unsplash.com/photo-1544161515-4ab6ce6db874?w=800&auto=format&fit=crop'
  },
  {
    title: 'Chăm Sóc Tóc Chuyên Sâu Với Thảo Dược Thiên Nhiên',
    slug: 'cham-soc-toc-chuyen-sau',
    summary: 'Giải pháp cho tóc khô xơ, rụng tóc, gàu ngứa. Liệu trình gội đầu dưỡng sinh thảo dược tại Min Nail & Hair Thủ Đức.',
    content: `# Chăm Sóc Tóc Chuyên Sâu Với Thảo Dược Thiên Nhiên

## Các Vấn Đề Tóc Thường Gặp
- **Tóc khô xơ**: Thiếu dưỡng chất – Giải pháp: dưỡng tóc thảo dược
- **Rụng tóc**: Stress, nội tiết – Giải pháp: massage ấn huyệt + gội thảo dược
- **Gàu – ngứa**: Nấm da đầu – Giải pháp: gội thảo dược kháng khuẩn

## Liệu Trình Tại Min
- **Combo 1 – An Yên** (60 ph – 149.000đ)
- **Combo 2 – Tầm Trung** (70 ph – 199.000đ)
- **Combo 3 – Chuyên Sâu** (80 ph – 279.000đ)
- **Combo 4 – Thượng Hạng** (90 ph – 379.000đ)

Hãy đến **Min Nail & Hair** để được tư vấn liệu trình phù hợp nhất!`,
    image_url: 'https://images.unsplash.com/photo-1560066984-138dadb4c035?w=800&auto=format&fit=crop'
  },
  {
    title: 'Combo Gội Đầu Massage Tại Lavita Charm – Thủ Đức',
    slug: 'combo-goi-dau-massage-lavita-charm',
    summary: 'Trải nghiệm gội đầu dưỡng sinh kết hợp massage tại Min Nail & Hair. Vị trí thuận lợi tại chung cư Lavita Charm, Thủ Đức.',
    content: `# Combo Gội Đầu Massage Tại Lavita Charm – Thủ Đức

Min Nail & Hair tọa lạc tại **Chung cư Lavita Charm, Đường số 1, phường Trường Thọ, Thủ Đức**.

## Combo Gội Đầu + Massage
- **Combo Tiết Kiệm** (60 ph – 149.000đ)
- **Combo Thư Giãn** (75 ph – 199.000đ)
- **Combo Cao Cấp** (90 ph – 279.000đ)

## Tiện Ích
- Chỗ đậu xe rộng rãi
- Không gian máy lạnh
- Giảm 5% khi đặt online

**Hotline: 0934 323 878**`,
    image_url: 'https://images.unsplash.com/photo-1591343395082-e120e004c565?w=800&auto=format&fit=crop'
  },
  {
    title: 'Sơn Gel Đẹp – Bền Màu – An Toàn Tại Min Nail & Hair',
    slug: 'son-gel-dep-ben-mau',
    summary: 'Sơn gel organic cao cấp, bền màu 2-3 tuần. Bảng giá chi tiết và quy trình làm móng chuẩn tại Min Nail & Hair Thủ Đức.',
    content: `# Sơn Gel Đẹp – Bền Màu – An Toàn Tại Min Nail & Hair

## Bảng Giá Sơn Gel
- Sơn gel: 110.000đ
- Tráng gương / Mắt mèo: 150.000đ
- Combo Sơn Gel + cắt da: 99.000đ
- Combo Mắt mèo + cắt da: 139.000đ

## Quy Trình Chuẩn
Vệ sinh → cắt da → dũa tạo dáng → phủ gel nền → sơn màu → phủ bóng → dưỡng dầu

## Mẹo Giữ Sơn Gel Lâu
Tránh hóa chất mạnh, đeo găng tay khi rửa chén.

Ghé **Min Nail & Hair – Lavita Charm, Thủ Đức** ngay hôm nay!`,
    image_url: 'https://images.unsplash.com/photo-1610992015732-2449b76344bc?w=800&auto=format&fit=crop'
  },
  {
    title: 'Công Thức Nấu Nước Gội Đầu Thảo Dược Tại Nhà',
    slug: 'cong-thuc-nau-nuoc-goi-dau-thao-duoc',
    summary: 'Hướng dẫn nấu nước gội đầu thảo dược từ bồ kết, sả chanh, vỏ bưởi. Đơn giản, tiết kiệm, hiệu quả cho tóc chắc khỏe.',
    content: `# Công Thức Nấu Nước Gội Đầu Thảo Dược Tại Nhà

## Nước Gội Bồ Kết – Sả Chanh
Nguyên liệu: 10 quả bồ kết nướng, 5 củ sả, 3 quả chanh, vỏ bưởi. Đun với 2 lít nước 20 phút.

## Nước Gội Hương Nhu – Tía Tô
Công dụng: Giảm ngứa da đầu, kháng khuẩn, trị gàu.

## Nước Gội Lá Dâu Tằm
Công dụng: Kích thích mọc tóc, giảm rụng tóc.

Nếu không có thời gian nấu, hãy đến **Min Nail & Hair** để trải nghiệm dịch vụ gội đầu dưỡng sinh cao cấp!`,
    image_url: 'https://images.unsplash.com/photo-1556228578-0d85b1a4d571?w=800&auto=format&fit=crop'
  },
  {
    title: 'Hướng Dẫn Chăm Sóc Móng Tay – Móng Chân Tại Nhà',
    slug: 'huong-dan-cham-soc-mong',
    summary: 'Bí quyết chăm sóc móng tay, móng chân tại nhà đơn giản. Kết hợp dịch vụ nail chuyên nghiệp tại Min Nail & Hair Thủ Đức.',
    content: `# Hướng Dẫn Chăm Sóc Móng Tay – Móng Chân Tại Nhà

## Các Bước Chăm Sóc Móng
1. **Vệ sinh**: Ngâm nước ấm pha muối 5-10 phút
2. **Cắt – dũa**: Cắt theo đường cong tự nhiên, dũa một chiều
3. **Dưỡng ẩm**: Thoa dầu dưỡng biểu bì hàng ngày

## Khi Nào Nên Đến Salon?
Đến Min định kỳ 2-3 tuần/lần để cắt da chuyên sâu.

## Dịch Vụ Tại Min
- Nhặt da lẻ: 45.000đ
- Phá sơn gel: 20.000đ
- Chà gót chân 5 bước: 149.000đ

Đến ngay **Min Nail & Hair – Chung cư Lavita Charm, Thủ Đức**!`,
    image_url: 'https://images.unsplash.com/photo-1607779097040-26e80aa78e66?w=800&auto=format&fit=crop'
  },
  {
    title: 'Ưu Đãi Đặc Biệt Khi Đặt Lịch Online Tại Min Nail & Hair',
    slug: 'uu-dai-dat-lich-online',
    summary: 'Giảm ngay 5% khi đặt lịch online tại Min Nail & Hair. Chọn ngày giờ, chọn kỹ thuật viên, xem giá dịch vụ dễ dàng.',
    content: `# Ưu Đãi Đặc Biệt Khi Đặt Lịch Online Tại Min Nail & Hair

## Tiện Lợi Khi Đặt Online
- Chọn ngày giờ (9:00-20:30)
- Chọn kỹ thuật viên yêu thích
- Giảm ngay **5%** tổng hóa đơn

## Cách Đặt
1. Chọn ngày và khung giờ
2. Chọn dịch vụ
3. Nhập thông tin
4. Xác nhận – nhận mã giảm 5%

## Câu Hỏi Thường Gặp
- **Có thể hủy lịch?** Có, trước 2 giờ.
- **Có thể chọn thợ?** Có, hoặc chọn ngẫu nhiên.
- **Ưu đãi 5%?** Áp dụng mọi dịch vụ.

Đặt lịch ngay!`,
    image_url: 'https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=800&auto=format&fit=crop'
  },
  {
    title: 'Combo Deal Tiết Kiệm Nail – Gội – Massage Tại Thủ Đức',
    slug: 'combo-deal-tiet-kiem',
    summary: 'Combo ưu đãi nail, gội đầu, massage giá tốt tại Min Nail & Hair. Sơn Gel + cắt da chỉ 99.000đ. Giảm thêm 5% khi đặt online.',
    content: `# Combo Deal Tiết Kiệm Nail – Gội – Massage Tại Thủ Đức

## Combo Deal Siêu Tiết Kiệm
- **Combo Sơn Gel + cắt da**: 99.000đ
- **Combo Sơn Thạch + cắt da**: 119.000đ
- **Combo Mắt mèo + cắt da**: 139.000đ
- **Chà gót chân theo combo**: 99.000đ

## Deal Massage
- Body 60 ph: 285.000đ
- Body 90 ph: 404.000đ
- Body 120 ph: 499.000đ

Đặt online để nhận thêm ưu đãi 5%!

📍 Chung cư Lavita Charm, Đường số 1, Trường Thọ, Thủ Đức
📞 Hotline: 0934 323 878`,
    image_url: 'https://images.unsplash.com/photo-1540555700478-4be289fbec6d?w=800&auto=format&fit=crop'
  },
];

for (const post of posts) {
  const { error } = await supabase.from('blogs').insert(post);
  if (error) {
    if (error.code === '23505') {
      console.log(`⚠️ ${post.slug} đã tồn tại (skip)`);
    } else {
      console.error(`❌ ${post.slug}: ${error.message}`);
    }
  } else {
    console.log(`✅ ${post.slug}`);
  }
}

console.log(`\nDone! ${posts.length} blog posts processed.`);
