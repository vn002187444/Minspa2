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
    title: 'Bí Quyết Phục Hồi Tóc Hư Tổn Sau Khi Nhuộm và Duỗi',
    slug: 'bi-quyet-phuc-hoi-toc-hu-ton',
    summary: 'Hướng dẫn chi tiết cách phục hồi tóc hư tổn do nhuộm, duỗi, uốn. Kết hợp liệu trình gội đầu dưỡng sinh thảo dược giúp tóc chắc khỏe từ gốc đến ngọn.',
    content: `Sau khi nhuộm màu hay duỗi tóc, mái tóc của bạn thường trở nên khô xơ, chẻ ngọn và mất đi độ bóng mượt tự nhiên. Đừng lo lắng, bài viết này sẽ chia sẻ những bí quyết phục hồi tóc hư tổn hiệu quả nhất.

## Nguyên Nhân Khiến Tóc Hư Tổn Sau Hóa Chất

Khi bạn nhuộm hoặc duỗi tóc, các hóa chất tác động trực tiếp lên cấu trúc keratin của tóc, phá vỡ liên kết disulfide khiến tóc yếu đi. Lớp biểu bì (cuticle) bị tổn thương, không còn khả năng giữ ẩm tự nhiên. Hậu quả là tóc khô, xơ rối, dễ gãy rụng.

## Quy Trình Phục Hồi Tóc Tại Nhà

### 1. Sử Dụng Dầu Gội Dịu Nhẹ
Chọn dầu gội không sulfate (sulfate-free) để làm sạch nhẹ nhàng mà không lấy đi độ ẩm tự nhiên của tóc. Gội 2-3 lần mỗi tuần là đủ, không nên gội quá nhiều.

### 2. Ủ Tóc Hàng Tuần
Ủ tóc với mặt nạ dầu dừa hoặc dầu argan ít nhất 1 lần/tuần. Để mặt nạ trên tóc 30 phút dưới khăn ấm để dưỡng chất thẩm thấu sâu.

### 3. Hạn Chế Nhiệt Độ Cao
Khi sấy tóc, để chế độ nhiệt trung bình và giữ máy sấy cách tóc 15-20cm. Sử dụng xịt bảo vệ nhiệt trước khi tạo kiểu.

### 4. Cắt Tỉa Ngọn Tóc Định Kỳ
Cắt tỉa 6-8 tuần một lần để loại bỏ phần ngọn hư tổn, kích thích tóc mọc khỏe hơn.

## Liệu Trình Gội Đầu Dưỡng Sinh Tại Min Nail & Hair

Để đạt hiệu quả phục hồi tối ưu, bạn nên kết hợp chăm sóc tại nhà với các liệu trình chuyên sâu tại salon. Dịch vụ [**Gội đầu dưỡng sinh tại Thủ Đức**](/blog/goi-dau-duong-sinh-tai-thu-duc) của Min Nail & Hair sử dụng thảo dược thiên nhiên như bồ kết, sả chanh, vỏ bưởi giúp:

- **Làm sạch sâu** mà không làm mất độ ẩm tự nhiên
- **Massage ấn huyệt** kích thích tuần hoàn máu dưới da đầu
- **Dưỡng chất thảo dược** thẩm thấu vào từng sợi tóc

Đặc biệt, [**Combo 3 – Chuyên Sâu**](/blog/combo-goi-dau-massage-lavita-charm) với thời gian 80 phút kết hợp massage toàn thân là lựa chọn tuyệt vời cho những ai muốn phục hồi tóc và thư giãn cùng lúc.

## Thực Đơn Dinh Dưỡng Cho Tóc Khỏe

Bên cạnh chăm sóc bên ngoài, bạn cũng cần bổ sung dinh dưỡng từ bên trong:
- **Vitamin B7 (Biotin)**: Có trong trứng, hạnh nhân, khoai lang
- **Vitamin E**: Có trong bơ, dầu oliu, các loại hạt
- **Omega-3**: Có trong cá hồi, quả óc chó
- **Kẽm (Zinc)**: Có trong hàu, thịt bò, hạt bí

## Kết Hợp Liệu Trình Chuyên Sâu

Nếu bạn đang gặp tình trạng rụng tóc nhiều sau khi nhuộm/duỗi, hãy tham khảo ngay bài viết [**Chăm sóc tóc chuyên sâu với thảo dược thiên nhiên**](/blog/cham-soc-toc-chuyen-sau) để có giải pháp toàn diện nhất.

Đừng quên đặt lịch online tại Min Nail & Hair để nhận ưu đãi giảm 5% cho lần đầu trải nghiệm dịch vụ [**gội đầu dưỡng sinh thảo dược**](/blog/goi-dau-duong-sinh-tai-thu-duc) nhé!`,
    image_url: 'https://images.unsplash.com/photo-1526947425960-945c6e72858f?w=800&auto=format&fit=crop'
  },
  {
    title: 'Massage Trị Liệu: Giải Pháp Cho Dân Văn Phòng Đau Mỏi Cổ Vai Gáy',
    slug: 'massage-tri-lieu-dan-van-phong',
    summary: 'Giảm đau mỏi cổ vai gáy với massage trị liệu chuyên sâu tại Min Nail & Hair. Phương pháp thư giãn hiệu quả cho dân văn phòng ngồi nhiều.',
    content: `Bạn ngồi làm việc 8-10 tiếng mỗi ngày trước máy tính? Bạn thường xuyên cảm thấy đau mỏi cổ, vai, gáy và khó ngủ về đêm? Đừng chủ quan, đó là những dấu hiệu cảnh báo cơ thể đang quá tải. Massage trị liệu chính là giải pháp toàn diện dành cho bạn.

## Tại Sao Dân Văn Phòng Dễ Bị Đau Mỏi Cổ Vai Gáy?

Tư thế ngồi sai trong thời gian dài khiến cơ vùng cổ và vai gáy bị co cứng, lưu thông máu kém. Hội chứng "văn phòng" này nếu không được can thiệp kịp thời có thể dẫn đến:
- **Thoái hóa đốt sống cổ** sớm
- **Đau đầu migraine** do căng cơ
- **Rối loạn giấc ngủ** kéo dài
- **Suy giảm trí nhớ** và tập trung

## Massage Trị Liệu Hoạt Động Như Thế Nào?

Massage trị liệu tác động trực tiếp lên các nhóm cơ bị co cứng, giúp:
1. **Giải phóng axit lactic** tích tụ trong cơ
2. **Tăng cường tuần hoàn máu** đến vùng bị tổn thương
3. **Kích thích sản sinh endorphin** – hormone giảm đau tự nhiên
4. **Phục hồi tầm vận động** của khớp cổ và vai

## Các Gói Massage Phù Hợp Cho Dân Văn Phòng

Tại Min Nail & Hair, chúng tôi có các gói massage được thiết kế riêng cho dân văn phòng:

| Gói massage | Thời gian | Giá ưu đãi | Phù hợp |
|-------------|-----------|------------|---------|
| Body 60 phút | 60 phút | 285.000đ | Giờ trưa văn phòng |
| Body 75 phút | 75 phút | 356.000đ | Sau giờ làm |
| Body 90 phút | 90 phút | 404.000đ | Cuối tuần thư giãn |
| Body 120 phút | 120 phút | 499.000đ | Xả stress toàn diện |

Bạn có thể tham khảo thêm về [**Massage Body thư giãn tại Thủ Đức**](/blog/massage-body-thu-gian-tai-thu-duc) để biết thêm chi tiết từng gói.

## Kết Hợp Gội Đầu Dưỡng Sinh Và Massage

Một trải nghiệm tuyệt vời mà nhiều khách hàng yêu thích là kết hợp massage body với [**gội đầu dưỡng sinh thảo dược**](/blog/goi-dau-duong-sinh-tai-thu-duc). Sau khi massage giúp cơ thể thư giãn, gội đầu thảo dược với tinh dầu sả chanh sẽ giúp tinh thần sảng khoái.

Hãy ghé [**Min Nail & Hair tại Lavita Charm**](/blog/combo-goi-dau-massage-lavita-charm) để trải nghiệm combo massage + gội đầu tuyệt vời này. Đặt lịch online ngay hôm nay để nhận ưu đãi giảm 5%!

## Mẹo Giảm Đau Tại Văn Phòng

Trong khi chờ đến lịch massage, bạn có thể áp dụng các bài tập đơn giản tại chỗ:
- **Xoay cổ nhẹ nhàng** theo vòng tròn 5 lần mỗi chiều
- **Kéo giãn vai** bằng cách đưa hai tay ra sau lưng
- **Đứng dậy đi lại** mỗi 45 phút ngồi làm việc

**Lưu ý:** Nếu cơn đau kéo dài trên 2 tuần, hãy kết hợp [**massage trị liệu chuyên sâu**](/blog/massage-body-thu-gian-tai-thu-duc) và thăm khám bác sĩ để có chẩn đoán chính xác nhất.`,
    image_url: 'https://images.unsplash.com/photo-1600334089648-b0d9d3028eb2?w=800&auto=format&fit=crop'
  },
  {
    title: 'Cách Chọn Màu Sơn Gel Phù Hợp Với Tông Da',
    slug: 'chon-mau-son-gel-phu-hop-tong-da',
    summary: 'Hướng dẫn chọn màu sơn gel theo tông da chuẩn chuyên gia. Từ da sáng, da trung bình đến da ngăm – màu nào giúp tay bạn trắng và sang nhất?',
    content: `Một bộ móng đẹp không chỉ nằm ở kỹ thuật sơn mà còn phụ thuộc rất nhiều vào việc chọn màu sắc phù hợp với tông da. Bài viết này sẽ giúp bạn "bỏ túi" bí quyết chọn màu sơn gel theo tông da chuẩn chuyên gia.

## Xác Định Tông Da Của Bạn

Trước khi chọn màu, bạn cần biết mình thuộc tông da nào. Cách đơn giản nhất là kiểm tra màu mạch máu ở cổ tay:
- **Tông da lạnh (Cool tone)**: Mạch máu có màu xanh tím
- **Tông da ấm (Warm tone)**: Mạch máu có màu xanh lá
- **Tông da trung tính (Neutral tone)**: Cả hai màu xanh và xanh lá

## Chọn Màu Theo Tông Da

### Da Sáng (Fair/Light)
Da sáng hợp với:
- Màu pastel: Hồng baby, xanh mint, tím lavender
- Màu nude trung tính: Be, hồng đất nhạt
- Màu đỏ tươi: Đỏ cherry, đỏ hồng

**Tránh:** Màu vàng đất, cam đất, nâu đồng – dễ làm tay trông tái nhợt.

### Da Trung Bình (Medium)
Da trung bình là tông da linh hoạt nhất:
- Màu trung tính: Nâu cafe, xám khói, beige
- Màu pastel đậm: Oải hương, xanh dương nhạt
- Màu đỏ đất: Đỏ gạch, đỏ rượu vang

### Da Ngăm (Tan/Dark)
Da ngăm nên chọn các màu nổi bật:
- Màu sáng: Trắng sữa, kem, hồng phấn
- Màu neon: Cam chói, hồng neon
- Màu metallic: Vàng gold, bạc, đồng
- Màu đậm: Xanh navy, đỏ đô, tím than

## Top Màu Sơn Gel Được Yêu Thích Nhất Tại Min

Đến với [**Min Nail & Hair**](/blog/nail-art-dep-tai-thu-duc), bạn sẽ được tư vấn bảng màu sơn gel đa dạng với hơn 50+ màu sắc. Các màu "hot" nhất hiện nay:

1. **Màu 01 – Nude Hồng**: Phù hợp mọi tông da, đi làm hay đi chơi đều đẹp
2. **Màu 07 – Đỏ Rượu Vang**: Sang trọng, quyến rũ, đặc biệt hợp da trung bình đến ngăm
3. **Màu 15 – Xanh Mint**: Trẻ trung, năng động, cực kỳ hợp da sáng
4. **Màu 23 – Nâu Cafe Sữa**: Thanh lịch, tinh tế, hợp mọi tông da
5. **Màu 39 – Hồng Đất**: Cổ điển, vintage, hợp da trung bình

## Gợi Ý Combo Sơn Gel Tiết Kiệm

Nếu bạn muốn thử nhiều màu mà không lo về giá, hãy tham khảo các [**combo sơn gel siêu tiết kiệm**](/blog/combo-deal-tiet-kiem) tại Min:

- **Combo Sơn Gel + cắt da**: Chỉ 99.000đ
- **Combo Sơn Thạch + cắt da**: 119.000đ
- **Combo Mắt mèo + cắt da**: 139.000đ

## Bí Quyết Giữ Màu Sơn Gel Bền Lâu

Sau khi chọn được màu ưng ý và được đội ngũ [**nail chuyên nghiệp**](/blog/nail-art-dep-tai-thu-duc) của Min thực hiện, bạn cần lưu ý:
- Thoa dầu dưỡng biểu bì mỗi ngày
- Đeo găng tay khi tiếp xúc hóa chất tẩy rửa
- Tránh dùng móng để cậy, mở nắp chai

Hãy ghé **Min Nail & Hair – Chung cư Lavita Charm, Thủ Đức** để được tư vấn và chọn màu sơn gel phù hợp nhất với bạn. [**Đặt lịch online**](/blog/uu-dai-dat-lich-online) để nhận ưu đãi đặc biệt!`,
    image_url: 'https://images.unsplash.com/photo-1632149872023-3b5527474799?w=800&auto=format&fit=crop'
  },
  {
    title: 'Chăm Sóc Da Mùa Hè: Bí Quyết Từ Chuyên Gia Tại Min Nail & Hair',
    slug: 'cham-soc-da-mua-he',
    summary: 'Bí quyết chăm sóc da mùa hè hiệu quả: chống nắng, dưỡng ẩm, detox da. Kết hợp massage body và gội dưỡng sinh giúp da khỏe đẹp từ sâu bên trong.',
    content: `Mùa hè với ánh nắng gay gắt, nhiệt độ cao và độ ẩm lớn là thử thách lớn cho làn da. Hiểu được điều đó, Min Nail & Hair xin chia sẻ những bí quyết chăm sóc da mùa hè từ chuyên gia, giúp bạn luôn rạng rỡ dù nắng nóng.

## Vì Sao Da Hư Tổn Nhiều Hơn Vào Mùa Hè?

Tia UV từ ánh nắng mặt trời mạnh hơn vào mùa hè, khiến da dễ bị:
- **Cháy nắng** (sunburn) – da đỏ rát, bong tróc
- **Tăng sắc tố** – nám, tàn nhang, đốm nâu xuất hiện nhiều hơn
- **Mất nước** – da khô căng, bong tróc
- **Lão hóa sớm** – nếp nhăn, chảy xệ gia tăng

## Quy Trình Chăm Sóc Da Mùa Hè 4 Bước

### Bước 1: Làm Sạch Đúng Cách
Rửa mặt 2 lần/ngày với sữa rửa mặt dịu nhẹ. Tẩy trang kỹ trước khi rửa mặt, đặc biệt nếu bạn dùng kem chống nắng chống nước.

### Bước 2: Dưỡng Ẩm Nhẹ Nhàng
Chọn kem dưỡng ẩm dạng gel hoặc lotion nhẹ, không dầu (oil-free). Vào mùa hè, da cần ẩm nhưng không cần quá nhiều dầu dưỡng.

### Bước 3: Chống Nắng Mọi Lúc
Đây là bước quan trọng nhất. Thoa kem chống nắng **SPF 50+ PA++++** mỗi sáng và thoa lại sau 2-3 giờ nếu ở ngoài trời.

### Bước 4: Detox Da Hàng Tuần
Tẩy tế bào chết 1-2 lần/tuần để loại bỏ bụi bẩn và tế bào chết tích tụ. Đắp mặt nạ đất sét hoặc mặt nạ than hoạt tính giúp làm sạch sâu lỗ chân lông.

## Massage Body Giúp Da Khỏe Từ Bên Trong

Bạn có biết [**massage body thường xuyên**](/blog/massage-body-thu-gian-tai-thu-duc) không chỉ giúp thư giãn mà còn rất tốt cho da?

Massage kích thích tuần hoàn máu dưới da, giúp:
- Tăng cường oxy và dưỡng chất đến tế bào da
- Kích thích sản sinh collagen tự nhiên
- Hỗ trợ đào thải độc tố qua hệ bạch huyết
- Giảm bọng mắt và quầng thâm

Sau một ngày dài dưới nắng, bạn nên kết hợp [**massage body**](/blog/combo-goi-dau-massage-lavita-charm) với [**gội đầu dưỡng sinh thảo dược**](/blog/goi-dau-duong-sinh-tai-thu-duc) để cơ thể và tinh thần được thư giãn toàn diện.

## Thực Phẩm Tốt Cho Da Mùa Hè

- **Dưa hấu, dưa leo**: Cung cấp nước và vitamin C
- **Cà chua**: Lycopene chống oxy hóa mạnh, bảo vệ da khỏi UV
- **Cá hồi**: Omega-3 giúp giảm viêm da
- **Trà xanh**: Chất chống oxy hóa EGCG bảo vệ da từ bên trong

## Lưu Ý Khi Đi Biển Hoặc Bơi Lội

- Thoa kem chống nắng 30 phút trước khi ra nắng
- Dùng kem chống nắng chống nước (water-resistant)
- Sau khi bơi, tắm lại với nước sạch ngay lập tức
- Dùng dầu dưỡng ẩm sau khi tắm để bù độ ẩm cho da

## Ưu Đãi Mùa Hè Tại Min

Đặt lịch [**massage body hoặc gội đầu dưỡng sinh**](/blog/combo-deal-tiet-kiem) tại Min Nail & Hair trong tháng này để nhận ngay ưu đãi giảm 5% khi [**đặt lịch online**](/blog/uu-dai-dat-lich-online). Hãy đến **Chung cư Lavita Charm, Đường số 1, Trường Thọ, Thủ Đức** để trải nghiệm dịch vụ chăm sóc sức khỏe và sắc đẹp toàn diện!`,
    image_url: 'https://images.unsplash.com/photo-1556228578-0d85b1a4d571?w=800&auto=format&fit=crop'
  },
  {
    title: 'Tất Tần Tật Về Các Loại Hình Massage Phổ Biến Hiện Nay',
    slug: 'cac-loai-hinh-massage-pho-bien',
    summary: 'Tổng hợp đầy đủ các loại hình massage: Thụy Điển, ấn huyệt, đá nóng, thể thao. Tìm hiểu loại massage nào phù hợp nhất với nhu cầu của bạn.',
    content: `Massage không chỉ là một hình thức thư giãn mà còn là liệu pháp trị liệu được khoa học chứng minh. Tuy nhiên, có rất nhiều loại hình massage khác nhau, mỗi loại lại có công dụng riêng. Bài viết này sẽ giúp bạn hiểu rõ để chọn đúng loại massage phù hợp.

## 1. Massage Thụy Điển (Swedish Massage)

**Massage Thụy Điển** là loại hình massage phổ biến nhất trên thế giới, sử dụng các động tác vuốt dài, nhào bóp, vỗ nhẹ và xoay khớp.

**Công dụng:**
- Thư giãn toàn thân, giảm căng thẳng nhẹ
- Cải thiện tuần hoàn máu
- Phù hợp cho người mới bắt đầu tập massage

**Thời gian lý tưởng:** 60-75 phút

## 2. Massage Ấn Huyệt (Acupressure Massage)

Dựa trên nguyên lý của y học cổ truyền, massage ấn huyệt tác động lên các huyệt đạo trên cơ thể để cân bằng khí huyết.

**Công dụng:**
- Giảm đau đầu, đau nửa đầu
- Cải thiện tiêu hóa
- Giảm đau mỏi cổ vai gáy
- Hỗ trợ điều trị mất ngủ

Tại Min Nail & Hair, kỹ thuật ấn huyệt được kết hợp trong liệu trình [**gội đầu dưỡng sinh**](/blog/goi-dau-duong-sinh-tai-thu-duc) và [**massage body**](/blog/massage-body-thu-gian-tai-thu-duc), mang lại hiệu quả thư giãn vượt trội.

## 3. Massage Đá Nóng (Hot Stone Massage)

Sử dụng đá basalt núi lửa được làm nóng đến nhiệt độ thích hợp, đặt lên các điểm huyệt và dùng để massage.

**Công dụng:**
- Thư giãn cơ sâu ở mức độ cao
- Giảm đau cơ bắp mãn tính
- Cải thiện giấc ngủ rõ rệt
- Thích hợp cho người hay bị lạnh tay chân

## 4. Massage Thể Thao (Sports Massage)

Được thiết kế riêng cho vận động viên hoặc người tập luyện thể thao thường xuyên.

**Công dụng:**
- Phục hồi cơ sau tập luyện
- Ngăn ngừa chấn thương
- Cải thiện linh hoạt và tầm vận động
- Giảm đau nhức sau tập

## 5. Massage Body Tổng Quát Tại Min Nail & Hair

Tại Min, chúng tôi cung cấp dịch vụ [**massage body tổng quát**](/blog/massage-body-thu-gian-tai-thu-duc) kết hợp tinh hoa của nhiều trường phái massage. Đội ngũ kỹ thuật viên được đào tạo bài bản, am hiểu giải phẫu cơ thể để đưa ra liệu trình phù hợp nhất.

Bảng giá massage tại Min:

| Loại massage | Thời gian | Giá ưu đãi |
|-------------|-----------|------------|
| Body 60 phút | 60 phút | 285.000đ |
| Body 75 phút | 75 phút | 356.000đ |
| Body 90 phút | 90 phút | 404.000đ |
| Body 120 phút | 120 phút | 499.000đ |

## Nên Chọn Loại Massage Nào?

- **Bạn bị stress nhẹ, muốn thư giãn cuối tuần?** → Chọn massage Thụy Điển (Body 60 ph)
- **Bạn đau mỏi cổ vai gáy do ngồi nhiều?** → Chọn massage ấn huyệt (Body 75-90 ph). Tham khảo thêm bài viết [**Massage trị liệu cho dân văn phòng**](/blog/massage-tri-lieu-dan-van-phong).
- **Bạn tập gym và cần phục hồi cơ?** → Chọn massage thể thao (Body 90 ph)
- **Bạn muốn thư giãn toàn diện cả tóc và cơ thể?** → Kết hợp [**massage + gội đầu dưỡng sinh**](/blog/combo-goi-dau-massage-lavita-charm)

## Lưu Ý Trước Khi Massage

- Không ăn quá no trước khi massage 1 giờ
- Uống nhiều nước sau khi massage để đào thải độc tố
- Thông báo với kỹ thuật viên nếu bạn có vấn đề sức khỏe đặc biệt
- Không massage nếu đang sốt hoặc có vết thương hở

## Kết Hợp Massage Với Các Dịch Vụ Khác

Để có trải nghiệm toàn diện nhất, bạn có thể kết hợp massage với các dịch vụ khác tại Min:
- [**Sơn gel đẹp**](/blog/son-gel-dep-ben-mau) – làm đẹp móng sau khi massage thư giãn
- [**Chăm sóc da mùa hè**](/blog/cham-soc-da-mua-he) – kết hợp massage dưỡng da

Đặt ngay [**lịch massage online**](/blog/uu-dai-dat-lich-online) tại Min Nail & Hair – Lavita Charm, Thủ Đức để nhận ưu đãi 5%!`,
    image_url: 'https://images.unsplash.com/photo-1544161515-4ab6ce6db874?w=800&auto=format&fit=crop'
  },
];

let count = 0;
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
    count++;
  }
}

console.log(`\nDone! ${count} new blog posts created.`);
