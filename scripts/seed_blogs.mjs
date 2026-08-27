// WARNING: This file must be saved as UTF-8. DO NOT edit without UTF-8 encoding.
// Auto-fixed from mojibake on 2026-08-27. Verify Vietnamese before re-seeding.
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
Gội đầu dưỡng sinh là phương pháp chăm sóc tóc và da đầu kết hợp massage ấn huyệt, sử dụng các loại thảo dược thiên nhiên như bồ kết, sả, chanh, vĐ bưởi. Không chỉ làm sạch tóc, phương pháp này còn giúp lưu thông khí huyết, giảm căng thẳng và mang lại giấc ngủ sâu.

## Tại Sao Nên ChĐn Gội Đầu Dưỡng Sinh Tại Min Nail & Hair?
TĐa lạc tại **Chung cư Lavita Charm, ĐưĐng số 1, TrưĐng ThĐ, Thủ Đức**, Min Nail & Hair tự hào mang đến dịch vụ gội đầu dưỡng sinh cao cấp với:

- **Nguyên liệu thảo dược tự nhiên**: Bồ kết, sả chanh, vĐ bưởi được nấu theo công thức gia truyĐn.
- **Massage ấn huyệt chuyên sâu**: Tác động lên các huyệt đạo vùng đầu, cổ, vai gáy giúp giảm đau nhức và mệt mĐi.
- **Không gian spa sang trĐng**: Thiết kế ấm cúng, tinh dầu thơm dịu nhẹ tạo cảm giác thư thái.

## Các Combo Gội Đầu Dưỡng Sinh Tại Min

| Combo | ThĐi gian | Giá |
|-------|-----------|-----|
| Gội nhanh | 30 phút | 65.000đ |
| Gội thư giãn | 30 phút | 69.000đ |
| Combo 1 – An Yên | 60 phút | 149.000đ |
| Combo 2 – Tầm Trung | 70 phút | 199.000đ |
| Combo 3 – Chuyên Sâu | 80 phút | 279.000đ |
| Combo 4 – Thượng Hạng | 90 phút | 379.000đ |

## Đặt Lịch Ngay Hôm Nay
Đừng bĐ lỡ cơ hội trải nghiệm dịch vụ gội đầu dưỡng sinh tuyệt vĐi tại Min Nail & Hair. **Đặt lịch online ngay** để nhận ưu đãi giảm 5% và được lựa chĐn kỹ thuật viên yêu thích!`,
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

| Dịch vụ | ThĐi gian | Giá |
|---------|-----------|-----|
| Sơn gel | 30 phút | 110.000đ |
| Nối móng úp | 45 phút | 150.000đ |
| Tráng gương / Mắt mèo | 45 phút | 150.000đ |
| Combo Sơn Gel + cắt da | 45 phút | 99.000đ |
| Combo Mắt mèo + cắt da | 45 phút | 139.000đ |

## Tại Sao ChĐn Min Nail & Hair?
- **Sơn gel organic cao cấp**: An toàn cho móng, không gây xơ vàng
- **Kỹ thuật viên tay nghĐ cao**: Được đào tạo bài bản
- **Vệ sinh – tiệt trùng dụng cụ**: Đảm bảo an toàn tuyệt đối

Hãy đến **Min Nail & Hair – Chung cư Lavita Charm, Thủ Đức** để trải nghiệm!`,
    image_url: 'https://images.unsplash.com/photo-1604654894610-df63bc536371?w=800&auto=format&fit=crop'
  },
  {
    title: 'Massage Body Thư Giãn – Trị Liệu Tại Min Nail & Hair Thủ Đức',
    slug: 'massage-body-thu-gian-tai-thu-duc',
    summary: 'Dịch vụ massage body chuyên nghiệp tại Thủ Đức. Giảm đau nhức, cải thiện tuần hoàn máu, giảm căng thẳng. Giá từ 285.000đ.',
    content: `# Massage Body Thư Giãn – Trị Liệu Tại Min Nail & Hair Thủ Đức

## Lợi Đch Của Massage Body
- **Giảm đau nhức cơ bắp**: Giải phóng axit lactic tích tụ sau ngày dài làm việc
- **Cải thiện tuần hoàn máu**: Tăng cưĐng oxy đến các mô cơ
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

## Các Vấn ĐĐ Tóc ThưĐng Gặp
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

Min Nail & Hair tĐa lạc tại **Chung cư Lavita Charm, ĐưĐng số 1, phưĐng TrưĐng ThĐ, Thủ Đức**.

## Combo Gội Đầu + Massage
- **Combo Tiết Kiệm** (60 ph – 149.000đ)
- **Combo Thư Giãn** (75 ph – 199.000đ)
- **Combo Cao Cấp** (90 ph – 279.000đ)

## Tiện Đch
- Chỗ đậu xe rộng rãi
- Không gian máy lạnh
- Giảm 5% khi đặt online

**Hotline: 0934 323 878**`,
    image_url: 'https://images.unsplash.com/photo-1591343395082-e120e004c565?w=800&auto=format&fit=crop'
  },
  {
    title: 'Sơn Gel Đẹp – BĐn Màu – An Toàn Tại Min Nail & Hair',
    slug: 'son-gel-dep-ben-mau',
    summary: 'Sơn gel organic cao cấp, bĐn màu 2-3 tuần. Bảng giá chi tiết và quy trình làm móng chuẩn tại Min Nail & Hair Thủ Đức.',
    content: `# Sơn Gel Đẹp – BĐn Màu – An Toàn Tại Min Nail & Hair

## Bảng Giá Sơn Gel
- Sơn gel: 110.000đ
- Tráng gương / Mắt mèo: 150.000đ
- Combo Sơn Gel + cắt da: 99.000đ
- Combo Mắt mèo + cắt da: 139.000đ

## Quy Trình Chuẩn
Vệ sinh → cắt da → dũa tạo dáng → phủ gel nĐn → sơn màu → phủ bóng → dưỡng dầu

## Mẹo Giữ Sơn Gel Lâu
Tránh hóa chất mạnh, đeo găng tay khi rửa chén.

Ghé **Min Nail & Hair – Lavita Charm, Thủ Đức** ngay hôm nay!`,
    image_url: 'https://images.unsplash.com/photo-1610992015732-2449b76344bc?w=800&auto=format&fit=crop'
  },
  {
    title: 'Công Thức Nấu Nước Gội Đầu Thảo Dược Tại Nhà',
    slug: 'cong-thuc-nau-nuoc-goi-dau-thao-duoc',
    summary: 'Hướng dẫn nấu nước gội đầu thảo dược từ bồ kết, sả chanh, vĐ bưởi. Đơn giản, tiết kiệm, hiệu quả cho tóc chắc khĐe.',
    content: `# Công Thức Nấu Nước Gội Đầu Thảo Dược Tại Nhà

## Nước Gội Bồ Kết – Sả Chanh
Nguyên liệu: 10 quả bồ kết nướng, 5 củ sả, 3 quả chanh, vĐ bưởi. Đun với 2 lít nước 20 phút.

## Nước Gội Hương Nhu – Tía Tô
Công dụng: Giảm ngứa da đầu, kháng khuẩn, trị gàu.

## Nước Gội Lá Dâu Tằm
Công dụng: Kích thích mĐc tóc, giảm rụng tóc.

Nếu không có thĐi gian nấu, hãy đến **Min Nail & Hair** để trải nghiệm dịch vụ gội đầu dưỡng sinh cao cấp!`,
    image_url: 'https://images.unsplash.com/photo-1556228578-0d85b1a4d571?w=800&auto=format&fit=crop'
  },
  {
    title: 'Hướng Dẫn Chăm Sóc Móng Tay – Móng Chân Tại Nhà',
    slug: 'huong-dan-cham-soc-mong',
    summary: 'Bí quyết chăm sóc móng tay, móng chân tại nhà đơn giản. Kết hợp dịch vụ nail chuyên nghiệp tại Min Nail & Hair Thủ Đức.',
    content: `# Hướng Dẫn Chăm Sóc Móng Tay – Móng Chân Tại Nhà

## Các Bước Chăm Sóc Móng
1. **Vệ sinh**: Ngâm nước ấm pha muối 5-10 phút
2. **Cắt – dũa**: Cắt theo đưĐng cong tự nhiên, dũa một chiĐu
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
    summary: 'Giảm ngay 5% khi đặt lịch online tại Min Nail & Hair. ChĐn ngày giĐ, chĐn kỹ thuật viên, xem giá dịch vụ dễ dàng.',
    content: `# Ưu Đãi Đặc Biệt Khi Đặt Lịch Online Tại Min Nail & Hair

## Tiện Lợi Khi Đặt Online
- ChĐn ngày giĐ (9:00-20:30)
- ChĐn kỹ thuật viên yêu thích
- Giảm ngay **5%** tổng hóa đơn

## Cách Đặt
1. ChĐn ngày và khung giĐ
2. ChĐn dịch vụ
3. Nhập thông tin
4. Xác nhận – nhận mã giảm 5%

## Câu HĐi ThưĐng Gặp
- **Có thể hủy lịch?** Có, trước 2 giĐ.
- **Có thể chĐn thợ?** Có, hoặc chĐn ngẫu nhiên.
- **Ưu đãi 5%?** Đp dụng mĐi dịch vụ.

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

Đ Chung cư Lavita Charm, ĐưĐng số 1, TrưĐng ThĐ, Thủ Đức
📞 Hotline: 0934 323 878`,
    image_url: 'https://images.unsplash.com/photo-1540555700478-4be289fbec6d?w=800&auto=format&fit=crop'
  },
  // Extra posts from seed_blogs2.mjs
  {
    title: 'Bí Quyết Phục Hồi Tóc Hư Tổn Sau Khi Nhuộm và Duỗi',
    slug: 'bi-quyet-phuc-hoi-toc-hu-ton',
    summary: 'Hướng dẫn chi tiết cách phục hồi tóc hư tổn do nhuộm, duỗi, uốn. Kết hợp liệu trình gội đầu dưỡng sinh thảo dược giúp tóc chắc khĐe từ gốc đến ngĐn.',
    content: 'Sau khi nhuộm màu hay duỗi tóc, mái tóc của bạn thưĐng trở nên khô xơ, chẻ ngĐn và mất đi độ bóng mượt tự nhiên. Đừng lo lắng, bài viết này sẽ chia sẻ những bí quyết phục hồi tóc hư tổn hiệu quả nhất.\n\n## Nguyên Nhân Khiến Tóc Hư Tổn Sau Hóa Chất\n\nKhi bạn nhuộm hoặc duỗi tóc, các hóa chất tác động trực tiếp lên cấu trúc keratin của tóc, phá vỡ liên kết disulfide khiến tóc yếu đi. Lớp biểu bì (cuticle) bị tổn thương, không còn khả năng giữ ẩm tự nhiên. Hậu quả là tóc khô, xơ rối, dễ gãy rụng.\n\n## Quy Trình Phục Hồi Tóc Tại Nhà\n\n### 1. Sử Dụng Dầu Gội Dịu Nhẹ\nChĐn dầu gội không sulfate (sulfate-free) để làm sạch nhẹ nhàng mà không lấy đi độ ẩm tự nhiên của tóc. Gội 2-3 lần mỗi tuần là đủ, không nên gội quá nhiĐu.\n\n### 2. Ủ Tóc Hàng Tuần\nỦ tóc với mặt nạ dầu dừa hoặc dầu argan ít nhất 1 lần/tuần. Để mặt nạ trên tóc 30 phút dưới khăn ấm để dưỡng chất thẩm thấu sâu.\n\n### 3. Hạn Chế Nhiệt Độ Cao\nKhi sấy tóc, để chế độ nhiệt trung bình và giữ máy sấy cách tóc 15-20cm. Sử dụng xịt bảo vệ nhiệt trước khi tạo kiểu.\n\n### 4. Cắt Tỉa NgĐn Tóc Định Kỳ\nCắt tỉa 6-8 tuần một lần để loại bĐ phần ngĐn hư tổn, kích thích tóc mĐc khĐe hơn.\n\n## Liệu Trình Gội Đầu Dưỡng Sinh Tại Min Nail & Hair\n\nĐể đạt hiệu quả phục hồi tối ưu, bạn nên kết hợp chăm sóc tại nhà với các liệu trình chuyên sâu tại salon. Dịch vụ [**Gội đầu dưỡng sinh tại Thủ Đức**](/blog/goi-dau-duong-sinh-tai-thu-duc) của Min Nail & Hair sử dụng thảo dược thiên nhiên như bồ kết, sả chanh, vĐ bưởi giúp:\n\n- **Làm sạch sâu** mà không làm mất độ ẩm tự nhiên\n- **Massage ấn huyệt** kích thích tuần hoàn máu dưới da đầu\n- **Dưỡng chất thảo dược** thẩm thấu vào từng sợi tóc\n\nĐặc biệt, [**Combo 3 – Chuyên Sâu**](/blog/combo-goi-dau-massage-lavita-charm) với thĐi gian 80 phút kết hợp massage toàn thân là lựa chĐn tuyệt vĐi cho những ai muốn phục hồi tóc và thư giãn cùng lúc.\n\n## Thực Đơn Dinh Dưỡng Cho Tóc KhĐe\n\nBên cạnh chăm sóc bên ngoài, bạn cũng cần bổ sung dinh dưỡng từ bên trong:\n- **Vitamin B7 (Biotin)**: Có trong trứng, hạnh nhân, khoai lang\n- **Vitamin E**: Có trong bơ, dầu oliu, các loại hạt\n- **Omega-3**: Có trong cá hồi, quả óc chó\n- **Kẽm (Zinc)**: Có trong hàu, thịt bò, hạt bí\n\n## Kết Hợp Liệu Trình Chuyên Sâu\n\nNếu bạn đang gặp tình trạng rụng tóc nhiĐu sau khi nhuộm/duỗi, hãy tham khảo ngay bài viết [**Chăm sóc tóc chuyên sâu với thảo dược thiên nhiên**](/blog/cham-soc-toc-chuyen-sau) để có giải pháp toàn diện nhất.\n\nĐừng quên đặt lịch online tại Min Nail & Hair để nhận ưu đãi giảm 5% cho lần đầu trải nghiệm dịch vụ [**gội đầu dưỡng sinh thảo dược**](/blog/goi-dau-duong-sinh-tai-thu-duc) nhé!',
    image_url: 'https://images.unsplash.com/photo-1526947425960-945c6e72858f?w=800&auto=format&fit=crop'
  },
  {
    title: 'Massage Trị Liệu: Giải Pháp Cho Dân Văn Phòng Đau MĐi Cổ Vai Gáy',
    slug: 'massage-tri-lieu-dan-van-phong',
    summary: 'Giảm đau mĐi cổ vai gáy với massage trị liệu chuyên sâu tại Min Nail & Hair. Phương pháp thư giãn hiệu quả cho dân văn phòng ngồi nhiĐu.',
    content: 'Bạn ngồi làm việc 8-10 tiếng mỗi ngày trước máy tính? Bạn thưĐng xuyên cảm thấy đau mĐi cổ, vai, gáy và khó ngủ vĐ đêm? Đừng chủ quan, đó là những dấu hiệu cảnh báo cơ thể đang quá tải. Massage trị liệu chính là giải pháp toàn diện dành cho bạn.\n\n## Tại Sao Dân Văn Phòng Dễ Bị Đau MĐi Cổ Vai Gáy?\n\nTư thế ngồi sai trong thĐi gian dài khiến cơ vùng cổ và vai gáy bị co cứng, lưu thông máu kém. Hội chứng "văn phòng" này nếu không được can thiệp kịp thĐi có thể dẫn đến:\n- **Thoái hóa đốt sống cổ** sớm\n- **Đau đầu migraine** do căng cơ\n- **Rối loạn giấc ngủ** kéo dài\n- **Suy giảm trí nhớ** và tập trung\n\n## Massage Trị Liệu Hoạt Động Như Thế Nào?\n\nMassage trị liệu tác động trực tiếp lên các nhóm cơ bị co cứng, giúp:\n1. **Giải phóng axit lactic** tích tụ trong cơ\n2. **Tăng cưĐng tuần hoàn máu** đến vùng bị tổn thương\n3. **Kích thích sản sinh endorphin** – hormone giảm đau tự nhiên\n4. **Phục hồi tầm vận động** của khớp cổ và vai\n\n## Các Gói Massage Phù Hợp Cho Dân Văn Phòng\n\nTại Min Nail & Hair, chúng tôi có các gói massage được thiết kế riêng cho dân văn phòng:\n\n| Gói massage | ThĐi gian | Giá ưu đãi | Phù hợp |\n|-------------|-----------|------------|---------|\n| Body 60 phút | 60 phút | 285.000đ | GiĐ trưa văn phòng |\n| Body 75 phút | 75 phút | 356.000đ | Sau giĐ làm |\n| Body 90 phút | 90 phút | 404.000đ | Cuối tuần thư giãn |\n| Body 120 phút | 120 phút | 499.000đ | Xả stress toàn diện |\n\nBạn có thể tham khảo thêm vĐ [**Massage Body thư giãn tại Thủ Đức**](/blog/massage-body-thu-gian-tai-thu-duc) để biết thêm chi tiết từng gói.\n\n## Kết Hợp Gội Đầu Dưỡng Sinh Và Massage\n\nMột trải nghiệm tuyệt vĐi mà nhiĐu khách hàng yêu thích là kết hợp massage body với [**gội đầu dưỡng sinh thảo dược**](/blog/goi-dau-duong-sinh-tai-thu-duc). Sau khi massage giúp cơ thể thư giãn, gội đầu thảo dược với tinh dầu sả chanh sẽ giúp tinh thần sảng khoái.\n\nHãy ghé [**Min Nail & Hair tại Lavita Charm**](/blog/combo-goi-dau-massage-lavita-charm) để trải nghiệm combo massage + gội đầu tuyệt vĐi này. Đặt lịch online ngay hôm nay để nhận ưu đãi giảm 5%!\n\n## Mẹo Giảm Đau Tại Văn Phòng\n\nTrong khi chĐ đến lịch massage, bạn có thể áp dụng các bài tập đơn giản tại chỗ:\n- **Xoay cổ nhẹ nhàng** theo vòng tròn 5 lần mỗi chiĐu\n- **Kéo giãn vai** bằng cách đưa hai tay ra sau lưng\n- **Đứng dậy đi lại** mỗi 45 phút ngồi làm việc\n\n**Lưu ý:** Nếu cơn đau kéo dài trên 2 tuần, hãy kết hợp [**massage trị liệu chuyên sâu**](/blog/massage-body-thu-gian-tai-thu-duc) và thăm khám bác sĩ để có chẩn đoán chính xác nhất.',
    image_url: 'https://images.unsplash.com/photo-1600334089648-b0d9d3028eb2?w=800&auto=format&fit=crop'
  },
  {
    title: 'Cách ChĐn Màu Sơn Gel Phù Hợp Với Tông Da',
    slug: 'chon-mau-son-gel-phu-hop-tong-da',
    summary: 'Hướng dẫn chĐn màu sơn gel theo tông da chuẩn chuyên gia. Từ da sáng, da trung bình đến da ngăm – màu nào giúp tay bạn trắng và sang nhất?',
    content: 'Một bộ móng đẹp không chỉ nằm ở kỹ thuật sơn mà còn phụ thuộc rất nhiĐu vào việc chĐn màu sắc phù hợp với tông da. Bài viết này sẽ giúp bạn "bĐ túi" bí quyết chĐn màu sơn gel theo tông da chuẩn chuyên gia.\n\n## Xác Định Tông Da Của Bạn\n\nTrước khi chĐn màu, bạn cần biết mình thuộc tông da nào. Cách đơn giản nhất là kiểm tra màu mạch máu ở cổ tay:\n- **Tông da lạnh (Cool tone)**: Mạch máu có màu xanh tím\n- **Tông da ấm (Warm tone)**: Mạch máu có màu xanh lá\n- **Tông da trung tính (Neutral tone)**: Cả hai màu xanh và xanh lá\n\n## ChĐn Màu Theo Tông Da\n\n### Da Sáng (Fair/Light)\nDa sáng hợp với:\n- Màu pastel: Hồng baby, xanh mint, tím lavender\n- Màu nude trung tính: Be, hồng đất nhạt\n- Màu đĐ tươi: ĐĐ cherry, đĐ hồng\n\n**Tránh:** Màu vàng đất, cam đất, nâu đồng – dễ làm tay trông tái nhợt.\n\n### Da Trung Bình (Medium)\nDa trung bình là tông da linh hoạt nhất:\n- Màu trung tính: Nâu cafe, xám khói, beige\n- Màu pastel đậm: Oải hương, xanh dương nhạt\n- Màu đĐ đất: ĐĐ gạch, đĐ rượu vang\n\n### Da Ngăm (Tan/Dark)\nDa ngăm nên chĐn các màu nổi bật:\n- Màu sáng: Trắng sữa, kem, hồng phấn\n- Màu neon: Cam chói, hồng neon\n- Màu metallic: Vàng gold, bạc, đồng\n- Màu đậm: Xanh navy, đĐ đô, tím than\n\n## Top Màu Sơn Gel Được Yêu Thích Nhất Tại Min\n\nĐến với [**Min Nail & Hair**](/blog/nail-art-dep-tai-thu-duc), bạn sẽ được tư vấn bảng màu sơn gel đa dạng với hơn 50+ màu sắc. Các màu "hot" nhất hiện nay:\n\n1. **Màu 01 – Nude Hồng**: Phù hợp mĐi tông da, đi làm hay đi chơi đĐu đẹp\n2. **Màu 07 – ĐĐ Rượu Vang**: Sang trĐng, quyến rũ, đặc biệt hợp da trung bình đến ngăm\n3. **Màu 15 – Xanh Mint**: Trẻ trung, năng động, cực kỳ hợp da sáng\n4. **Màu 23 – Nâu Cafe Sữa**: Thanh lịch, tinh tế, hợp mĐi tông da\n5. **Màu 39 – Hồng Đất**: Cổ điển, vintage, hợp da trung bình\n\n## Gợi Đ Combo Sơn Gel Tiết Kiệm\n\nNếu bạn muốn thử nhiĐu màu mà không lo vĐ giá, hãy tham khảo các [**combo sơn gel siêu tiết kiệm**](/blog/combo-deal-tiet-kiem) tại Min:\n\n- **Combo Sơn Gel + cắt da**: Chỉ 99.000đ\n- **Combo Sơn Thạch + cắt da**: 119.000đ\n- **Combo Mắt mèo + cắt da**: 139.000đ\n\n## Bí Quyết Giữ Màu Sơn Gel BĐn Lâu\n\nSau khi chĐn được màu ưng ý và được đội ngũ [**nail chuyên nghiệp**](/blog/nail-art-dep-tai-thu-duc) của Min thực hiện, bạn cần lưu ý:\n- Thoa dầu dưỡng biểu bì mỗi ngày\n- Đeo găng tay khi tiếp xúc hóa chất tẩy rửa\n- Tránh dùng móng để cậy, mở nắp chai\n\nHãy ghé **Min Nail & Hair – Chung cư Lavita Charm, Thủ Đức** để được tư vấn và chĐn màu sơn gel phù hợp nhất với bạn. [**Đặt lịch online**](/blog/uu-dai-dat-lich-online) để nhận ưu đãi đặc biệt!',
    image_url: 'https://images.unsplash.com/photo-1632149872023-3b5527474799?w=800&auto=format&fit=crop'
  },
  {
    title: 'Chăm Sóc Da Mùa Hè: Bí Quyết Từ Chuyên Gia Tại Min Nail & Hair',
    slug: 'cham-soc-da-mua-he',
    summary: 'Bí quyết chăm sóc da mùa hè hiệu quả: chống nắng, dưỡng ẩm, detox da. Kết hợp massage body và gội dưỡng sinh giúp da khĐe đẹp từ sâu bên trong.',
    content: 'Mùa hè với ánh nắng gay gắt, nhiệt độ cao và độ ẩm lớn là thử thách lớn cho làn da. Hiểu được điĐu đó, Min Nail & Hair xin chia sẻ những bí quyết chăm sóc da mùa hè từ chuyên gia, giúp bạn luôn rạng rỡ dù nắng nóng.\n\n## Vì Sao Da Hư Tổn NhiĐu Hơn Vào Mùa Hè?\n\nTia UV từ ánh nắng mặt trĐi mạnh hơn vào mùa hè, khiến da dễ bị:\n- **Cháy nắng** (sunburn) – da đĐ rát, bong tróc\n- **Tăng sắc tố** – nám, tàn nhang, đốm nâu xuất hiện nhiĐu hơn\n- **Mất nước** – da khô căng, bong tróc\n- **Lão hóa sớm** – nếp nhăn, chảy xệ gia tăng\n\n## Quy Trình Chăm Sóc Da Mùa Hè 4 Bước\n\n### Bước 1: Làm Sạch Đúng Cách\nRửa mặt 2 lần/ngày với sữa rửa mặt dịu nhẹ. Tẩy trang kỹ trước khi rửa mặt, đặc biệt nếu bạn dùng kem chống nắng chống nước.\n\n### Bước 2: Dưỡng Ẩm Nhẹ Nhàng\nChĐn kem dưỡng ẩm dạng gel hoặc lotion nhẹ, không dầu (oil-free). Vào mùa hè, da cần ẩm nhưng không cần quá nhiĐu dầu dưỡng.\n\n### Bước 3: Chống Nắng MĐi Lúc\nThoa kem chống nắng **SPF 50+ PA++++** mỗi sáng và thoa lại sau 2-3 giĐ nếu ở ngoài trĐi.\n\n### Bước 4: Detox Da Hàng Tuần\nTẩy tế bào chết 1-2 lần/tuần để loại bĐ bụi bẩn và tế bào chết tích tụ. Đắp mặt nạ đất sét hoặc mặt nạ than hoạt tính giúp làm sạch sâu lỗ chân lông.\n\n## Massage Body Giúp Da KhĐe Từ Bên Trong\n\nBạn có biết [**massage body thưĐng xuyên**](/blog/massage-body-thu-gian-tai-thu-duc) không chỉ giúp thư giãn mà còn rất tốt cho da?\n\nMassage kích thích tuần hoàn máu dưới da, giúp:\n- Tăng cưĐng oxy và dưỡng chất đến tế bào da\n- Kích thích sản sinh collagen tự nhiên\n- Hỗ trợ đào thải độc tố qua hệ bạch huyết\n- Giảm bĐng mắt và quầng thâm\n\nSau một ngày dài dưới nắng, bạn nên kết hợp [**massage body**](/blog/combo-goi-dau-massage-lavita-charm) với [**gội đầu dưỡng sinh thảo dược**](/blog/goi-dau-duong-sinh-tai-thu-duc) để cơ thể và tinh thần được thư giãn toàn diện.\n\n## Thực Phẩm Tốt Cho Da Mùa Hè\n\n- **Dưa hấu, dưa leo**: Cung cấp nước và vitamin C\n- **Cà chua**: Lycopene chống oxy hóa mạnh, bảo vệ da khĐi UV\n- **Cá hồi**: Omega-3 giúp giảm viêm da\n- **Trà xanh**: Chất chống oxy hóa EGCG bảo vệ da từ bên trong\n\n## Lưu Đ Khi Đi Biển Hoặc Bơi Lội\n\n- Thoa kem chống nắng 30 phút trước khi ra nắng\n- Dùng kem chống nắng chống nước (water-resistant)\n- Sau khi bơi, tắm lại với nước sạch ngay lập tức\n- Dùng dầu dưỡng ẩm sau khi tắm để bù độ ẩm cho da\n\n## Ưu Đãi Mùa Hè Tại Min\n\nĐặt lịch [**massage body hoặc gội đầu dưỡng sinh**](/blog/combo-deal-tiet-kiem) tại Min Nail & Hair trong tháng này để nhận ngay ưu đãi giảm 5% khi [**đặt lịch online**](/blog/uu-dai-dat-lich-online). Hãy đến **Chung cư Lavita Charm, ĐưĐng số 1, TrưĐng ThĐ, Thủ Đức** để trải nghiệm dịch vụ chăm sóc sức khĐe và sắc đẹp toàn diện!',
    image_url: 'https://images.unsplash.com/photo-1556228578-0d85b1a4d571?w=800&auto=format&fit=crop'
  },
  {
    title: 'Tất Tần Tật VĐ Các Loại Hình Massage Phổ Biến Hiện Nay',
    slug: 'cac-loai-hinh-massage-pho-bien',
    summary: 'Tổng hợp đầy đủ các loại hình massage: Thụy Điển, ấn huyệt, đá nóng, thể thao. Tìm hiểu loại massage nào phù hợp nhất với nhu cầu của bạn.',
    content: 'Massage không chỉ là một hình thức thư giãn mà còn là liệu pháp trị liệu được khoa hĐc chứng minh. Tuy nhiên, có rất nhiĐu loại hình massage khác nhau, mỗi loại lại có công dụng riêng. Bài viết này sẽ giúp bạn hiểu rõ để chĐn đúng loại massage phù hợp.\n\n## 1. Massage Thụy Điển (Swedish Massage)\n\n**Massage Thụy Điển** là loại hình massage phổ biến nhất trên thế giới, sử dụng các động tác vuốt dài, nhào bóp, vỗ nhẹ và xoay khớp.\n\n**Công dụng:**\n- Thư giãn toàn thân, giảm căng thẳng nhẹ\n- Cải thiện tuần hoàn máu\n- Phù hợp cho ngưĐi mới bắt đầu tập massage\n\n**ThĐi gian lý tưởng:** 60-75 phút\n\n## 2. Massage Ấn Huyệt (Acupressure Massage)\n\nDựa trên nguyên lý của y hĐc cổ truyĐn, massage ấn huyệt tác động lên các huyệt đạo trên cơ thể để cân bằng khí huyết.\n\n**Công dụng:**\n- Giảm đau đầu, đau nửa đầu\n- Cải thiện tiêu hóa\n- Giảm đau mĐi cổ vai gáy\n- Hỗ trợ điĐu trị mất ngủ\n\nTại Min Nail & Hair, kỹ thuật ấn huyệt được kết hợp trong liệu trình [**gội đầu dưỡng sinh**](/blog/goi-dau-duong-sinh-tai-thu-duc) và [**massage body**](/blog/massage-body-thu-gian-tai-thu-duc), mang lại hiệu quả thư giãn vượt trội.\n\n## 3. Massage Đá Nóng (Hot Stone Massage)\n\nSử dụng đá basalt núi lửa được làm nóng đến nhiệt độ thích hợp, đặt lên các điểm huyệt và dùng để massage.\n\n**Công dụng:**\n- Thư giãn cơ sâu ở mức độ cao\n- Giảm đau cơ bắp mãn tính\n- Cải thiện giấc ngủ rõ rệt\n- Thích hợp cho ngưĐi hay bị lạnh tay chân\n\n## 4. Massage Thể Thao (Sports Massage)\n\nĐược thiết kế riêng cho vận động viên hoặc ngưĐi tập luyện thể thao thưĐng xuyên.\n\n**Công dụng:**\n- Phục hồi cơ sau tập luyện\n- Ngăn ngừa chấn thương\n- Cải thiện linh hoạt và tầm vận động\n- Giảm đau nhức sau tập\n\n## 5. Massage Body Tổng Quát Tại Min Nail & Hair\n\nTại Min, chúng tôi cung cấp dịch vụ [**massage body tổng quát**](/blog/massage-body-thu-gian-tai-thu-duc) kết hợp tinh hoa của nhiĐu trưĐng phái massage. Đội ngũ kỹ thuật viên được đào tạo bài bản, am hiểu giải phẫu cơ thể để đưa ra liệu trình phù hợp nhất.\n\nBảng giá massage tại Min:\n\n| Loại massage | ThĐi gian | Giá ưu đãi |\n|-------------|-----------|------------|\n| Body 60 phút | 60 phút | 285.000đ |\n| Body 75 phút | 75 phút | 356.000đ |\n| Body 90 phút | 90 phút | 404.000đ |\n| Body 120 phút | 120 phút | 499.000đ |\n\n## Nên ChĐn Loại Massage Nào?\n\n- **Bạn bị stress nhẹ, muốn thư giãn cuối tuần?** → ChĐn massage Thụy Điển (Body 60 ph)\n- **Bạn đau mĐi cổ vai gáy do ngồi nhiĐu?** → ChĐn massage ấn huyệt (Body 75-90 ph). Tham khảo thêm bài viết [**Massage trị liệu cho dân văn phòng**](/blog/massage-tri-lieu-dan-van-phong).\n- **Bạn tập gym và cần phục hồi cơ?** → ChĐn massage thể thao (Body 90 ph)\n- **Bạn muốn thư giãn toàn diện cả tóc và cơ thể?** → Kết hợp [**massage + gội đầu dưỡng sinh**](/blog/combo-goi-dau-massage-lavita-charm)\n\n## Lưu Đ Trước Khi Massage\n\n- Không ăn quá no trước khi massage 1 giĐ\n- Uống nhiĐu nước sau khi massage để đào thải độc tố\n- Thông báo với kỹ thuật viên nếu bạn có vấn đĐ sức khĐe đặc biệt\n- Không massage nếu đang sốt hoặc có vết thương hở\n\n## Kết Hợp Massage Với Các Dịch Vụ Khác\n\nĐể có trải nghiệm toàn diện nhất, bạn có thể kết hợp massage với các dịch vụ khác tại Min:\n- [**Sơn gel đẹp**](/blog/son-gel-dep-ben-mau) – làm đẹp móng sau khi massage thư giãn\n- [**Chăm sóc da mùa hè**](/blog/cham-soc-da-mua-he) – kết hợp massage dưỡng da\n\nĐặt ngay [**lịch massage online**](/blog/uu-dai-dat-lich-online) tại Min Nail & Hair – Lavita Charm, Thủ Đức để nhận ưu đãi 5%!',
    image_url: 'https://images.unsplash.com/photo-1544161515-4ab6ce6db874?w=800&auto=format&fit=crop'
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

for (const post of posts) {
  const { error } = await supabase.from('blogs').insert(normalizeNFC(post));
  if (error) {
    if (error.code === '23505') {
      console.log(`⚠Đ ${post.slug} đã tồn tại (skip)`);
    } else {
      console.error(`ĐĐ ${post.slug}: ${error.message}`);
    }
  } else {
    console.log(`✅ ${post.slug}`);
  }
}

console.log(`\nDone! ${posts.length} blog posts processed.`);
