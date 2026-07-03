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
    title: 'Gá»™i Äáº§u DÆ°á»¡ng Sinh Táº¡i Thá»§ Äá»©c â€“ Tráº£i Nghiá»‡m ThÆ° GiÃ£n Äá»‰nh Cao',
    slug: 'goi-dau-duong-sinh-tai-thu-duc',
    summary: 'KhÃ¡m phÃ¡ dá»‹ch vá»¥ gá»™i Ä‘áº§u dÆ°á»¡ng sinh tháº£o dÆ°á»£c táº¡i Min Nail & Hair â€“ Lavita Charm Thá»§ Äá»©c. Combo thÆ° giÃ£n, massage áº¥n huyá»‡t, giÃ¡ chá»‰ tá»« 65.000Ä‘.',
    content: `# Gá»™i Äáº§u DÆ°á»¡ng Sinh Táº¡i Thá»§ Äá»©c â€“ Tráº£i Nghiá»‡m ThÆ° GiÃ£n Äá»‰nh Cao

## Gá»™i Äáº§u DÆ°á»¡ng Sinh LÃ  GÃ¬?
Gá»™i Ä‘áº§u dÆ°á»¡ng sinh lÃ  phÆ°Æ¡ng phÃ¡p chÄƒm sÃ³c tÃ³c vÃ  da Ä‘áº§u káº¿t há»£p massage áº¥n huyá»‡t, sá»­ dá»¥ng cÃ¡c loáº¡i tháº£o dÆ°á»£c thiÃªn nhiÃªn nhÆ° bá»“ káº¿t, sáº£, chanh, vá» bÆ°á»Ÿi. KhÃ´ng chá»‰ lÃ m sáº¡ch tÃ³c, phÆ°Æ¡ng phÃ¡p nÃ y cÃ²n giÃºp lÆ°u thÃ´ng khÃ­ huyáº¿t, giáº£m cÄƒng tháº³ng vÃ  mang láº¡i giáº¥c ngá»§ sÃ¢u.

## Táº¡i Sao NÃªn Chá»n Gá»™i Äáº§u DÆ°á»¡ng Sinh Táº¡i Min Nail & Hair?
Tá»a láº¡c táº¡i **Chung cÆ° Lavita Charm, ÄÆ°á»ng sá»‘ 1, TrÆ°á»ng Thá», Thá»§ Äá»©c**, Min Nail & Hair tá»± hÃ o mang Ä‘áº¿n dá»‹ch vá»¥ gá»™i Ä‘áº§u dÆ°á»¡ng sinh cao cáº¥p vá»›i:

- **NguyÃªn liá»‡u tháº£o dÆ°á»£c tá»± nhiÃªn**: Bá»“ káº¿t, sáº£ chanh, vá» bÆ°á»Ÿi Ä‘Æ°á»£c náº¥u theo cÃ´ng thá»©c gia truyá»n.
- **Massage áº¥n huyá»‡t chuyÃªn sÃ¢u**: TÃ¡c Ä‘á»™ng lÃªn cÃ¡c huyá»‡t Ä‘áº¡o vÃ¹ng Ä‘áº§u, cá»•, vai gÃ¡y giÃºp giáº£m Ä‘au nhá»©c vÃ  má»‡t má»i.
- **KhÃ´ng gian spa sang trá»ng**: Thiáº¿t káº¿ áº¥m cÃºng, tinh dáº§u thÆ¡m dá»‹u nháº¹ táº¡o cáº£m giÃ¡c thÆ° thÃ¡i.

## CÃ¡c Combo Gá»™i Äáº§u DÆ°á»¡ng Sinh Táº¡i Min

| Combo | Thá»i gian | GiÃ¡ |
|-------|-----------|-----|
| Gá»™i nhanh | 30 phÃºt | 65.000Ä‘ |
| Gá»™i thÆ° giÃ£n | 30 phÃºt | 69.000Ä‘ |
| Combo 1 â€“ An YÃªn | 60 phÃºt | 149.000Ä‘ |
| Combo 2 â€“ Táº§m Trung | 70 phÃºt | 199.000Ä‘ |
| Combo 3 â€“ ChuyÃªn SÃ¢u | 80 phÃºt | 279.000Ä‘ |
| Combo 4 â€“ ThÆ°á»£ng Háº¡ng | 90 phÃºt | 379.000Ä‘ |

## Äáº·t Lá»‹ch Ngay HÃ´m Nay
Äá»«ng bá» lá»¡ cÆ¡ há»™i tráº£i nghiá»‡m dá»‹ch vá»¥ gá»™i Ä‘áº§u dÆ°á»¡ng sinh tuyá»‡t vá»i táº¡i Min Nail & Hair. **Äáº·t lá»‹ch online ngay** Ä‘á»ƒ nháº­n Æ°u Ä‘Ã£i giáº£m 5% vÃ  Ä‘Æ°á»£c lá»±a chá»n ká»¹ thuáº­t viÃªn yÃªu thÃ­ch!`,
    image_url: 'https://images.unsplash.com/photo-1519699047748-de8e457a634e?w=800&auto=format&fit=crop'
  },
  {
    title: 'Nail Art Äáº¹p â€“ Cháº¥t LÆ°á»£ng Cao Táº¡i Min Nail & Hair Thá»§ Äá»©c',
    slug: 'nail-art-dep-tai-thu-duc',
    summary: 'Cáº­p nháº­t xu hÆ°á»›ng nail art 2026 vá»›i sÆ¡n gel organic, váº½ mÃ³ng nghá»‡ thuáº­t, ná»‘i mÃ³ng Ãºp. Dá»‹ch vá»¥ nail chuyÃªn nghiá»‡p táº¡i Thá»§ Äá»©c.',
    content: `# Nail Art Äáº¹p â€“ Cháº¥t LÆ°á»£ng Cao Táº¡i Min Nail & Hair Thá»§ Äá»©c

## Xu HÆ°á»›ng Nail Art 2026
Nail art khÃ´ng chá»‰ lÃ  tÃ´ Ä‘iá»ƒm cho bá»™ mÃ³ng mÃ  cÃ²n lÃ  cÃ¡ch thá»ƒ hiá»‡n phong cÃ¡ch cÃ¡ nhÃ¢n. CÃ¡c xu hÆ°á»›ng nail art ná»•i báº­t bao gá»“m mÃ³ng Ä‘Æ¡n sáº¯c tÃ´ng pastel, mÃ³ng máº¯t mÃ¨o Ã¡nh kim, vÃ  mÃ³ng HÃ n Quá»‘c tá»‘i giáº£n.

## Dá»‹ch Vá»¥ Nail Táº¡i Min

| Dá»‹ch vá»¥ | Thá»i gian | GiÃ¡ |
|---------|-----------|-----|
| SÆ¡n gel | 30 phÃºt | 110.000Ä‘ |
| Ná»‘i mÃ³ng Ãºp | 45 phÃºt | 150.000Ä‘ |
| TrÃ¡ng gÆ°Æ¡ng / Máº¯t mÃ¨o | 45 phÃºt | 150.000Ä‘ |
| Combo SÆ¡n Gel + cáº¯t da | 45 phÃºt | 99.000Ä‘ |
| Combo Máº¯t mÃ¨o + cáº¯t da | 45 phÃºt | 139.000Ä‘ |

## Táº¡i Sao Chá»n Min Nail & Hair?
- **SÆ¡n gel organic cao cáº¥p**: An toÃ n cho mÃ³ng, khÃ´ng gÃ¢y xÆ¡ vÃ ng
- **Ká»¹ thuáº­t viÃªn tay nghá» cao**: ÄÆ°á»£c Ä‘Ã o táº¡o bÃ i báº£n
- **Vá»‡ sinh â€“ tiá»‡t trÃ¹ng dá»¥ng cá»¥**: Äáº£m báº£o an toÃ n tuyá»‡t Ä‘á»‘i

HÃ£y Ä‘áº¿n **Min Nail & Hair â€“ Chung cÆ° Lavita Charm, Thá»§ Äá»©c** Ä‘á»ƒ tráº£i nghiá»‡m!`,
    image_url: 'https://images.unsplash.com/photo-1604654894610-df63bc536371?w=800&auto=format&fit=crop'
  },
  {
    title: 'Massage Body ThÆ° GiÃ£n â€“ Trá»‹ Liá»‡u Táº¡i Min Nail & Hair Thá»§ Äá»©c',
    slug: 'massage-body-thu-gian-tai-thu-duc',
    summary: 'Dá»‹ch vá»¥ massage body chuyÃªn nghiá»‡p táº¡i Thá»§ Äá»©c. Giáº£m Ä‘au nhá»©c, cáº£i thiá»‡n tuáº§n hoÃ n mÃ¡u, giáº£m cÄƒng tháº³ng. GiÃ¡ tá»« 285.000Ä‘.',
    content: `# Massage Body ThÆ° GiÃ£n â€“ Trá»‹ Liá»‡u Táº¡i Min Nail & Hair Thá»§ Äá»©c

## Lá»£i Ãch Cá»§a Massage Body
- **Giáº£m Ä‘au nhá»©c cÆ¡ báº¯p**: Giáº£i phÃ³ng axit lactic tÃ­ch tá»¥ sau ngÃ y dÃ i lÃ m viá»‡c
- **Cáº£i thiá»‡n tuáº§n hoÃ n mÃ¡u**: TÄƒng cÆ°á»ng oxy Ä‘áº¿n cÃ¡c mÃ´ cÆ¡
- **Giáº£m cÄƒng tháº³ng, lo Ã¢u**: KÃ­ch thÃ­ch sáº£n sinh endorphin
- **Há»— trá»£ giáº¥c ngá»§**: ThÆ° giÃ£n há»‡ tháº§n kinh

## CÃ¡c GÃ³i Massage Táº¡i Min
- Body 60 phÃºt: 285.000Ä‘ (giáº£m tá»« 300.000Ä‘)
- Body 75 phÃºt: 356.000Ä‘
- Body 90 phÃºt: 404.000Ä‘
- Body 120 phÃºt: 499.000Ä‘

**Äáº·t lá»‹ch massage ngay** Ä‘á»ƒ nháº­n Æ°u Ä‘Ã£i 5% khi Ä‘áº·t online!`,
    image_url: 'https://images.unsplash.com/photo-1544161515-4ab6ce6db874?w=800&auto=format&fit=crop'
  },
  {
    title: 'ChÄƒm SÃ³c TÃ³c ChuyÃªn SÃ¢u Vá»›i Tháº£o DÆ°á»£c ThiÃªn NhiÃªn',
    slug: 'cham-soc-toc-chuyen-sau',
    summary: 'Giáº£i phÃ¡p cho tÃ³c khÃ´ xÆ¡, rá»¥ng tÃ³c, gÃ u ngá»©a. Liá»‡u trÃ¬nh gá»™i Ä‘áº§u dÆ°á»¡ng sinh tháº£o dÆ°á»£c táº¡i Min Nail & Hair Thá»§ Äá»©c.',
    content: `# ChÄƒm SÃ³c TÃ³c ChuyÃªn SÃ¢u Vá»›i Tháº£o DÆ°á»£c ThiÃªn NhiÃªn

## CÃ¡c Váº¥n Äá» TÃ³c ThÆ°á»ng Gáº·p
- **TÃ³c khÃ´ xÆ¡**: Thiáº¿u dÆ°á»¡ng cháº¥t â€“ Giáº£i phÃ¡p: dÆ°á»¡ng tÃ³c tháº£o dÆ°á»£c
- **Rá»¥ng tÃ³c**: Stress, ná»™i tiáº¿t â€“ Giáº£i phÃ¡p: massage áº¥n huyá»‡t + gá»™i tháº£o dÆ°á»£c
- **GÃ u â€“ ngá»©a**: Náº¥m da Ä‘áº§u â€“ Giáº£i phÃ¡p: gá»™i tháº£o dÆ°á»£c khÃ¡ng khuáº©n

## Liá»‡u TrÃ¬nh Táº¡i Min
- **Combo 1 â€“ An YÃªn** (60 ph â€“ 149.000Ä‘)
- **Combo 2 â€“ Táº§m Trung** (70 ph â€“ 199.000Ä‘)
- **Combo 3 â€“ ChuyÃªn SÃ¢u** (80 ph â€“ 279.000Ä‘)
- **Combo 4 â€“ ThÆ°á»£ng Háº¡ng** (90 ph â€“ 379.000Ä‘)

HÃ£y Ä‘áº¿n **Min Nail & Hair** Ä‘á»ƒ Ä‘Æ°á»£c tÆ° váº¥n liá»‡u trÃ¬nh phÃ¹ há»£p nháº¥t!`,
    image_url: 'https://images.unsplash.com/photo-1560066984-138dadb4c035?w=800&auto=format&fit=crop'
  },
  {
    title: 'Combo Gá»™i Äáº§u Massage Táº¡i Lavita Charm â€“ Thá»§ Äá»©c',
    slug: 'combo-goi-dau-massage-lavita-charm',
    summary: 'Tráº£i nghiá»‡m gá»™i Ä‘áº§u dÆ°á»¡ng sinh káº¿t há»£p massage táº¡i Min Nail & Hair. Vá»‹ trÃ­ thuáº­n lá»£i táº¡i chung cÆ° Lavita Charm, Thá»§ Äá»©c.',
    content: `# Combo Gá»™i Äáº§u Massage Táº¡i Lavita Charm â€“ Thá»§ Äá»©c

Min Nail & Hair tá»a láº¡c táº¡i **Chung cÆ° Lavita Charm, ÄÆ°á»ng sá»‘ 1, phÆ°á»ng TrÆ°á»ng Thá», Thá»§ Äá»©c**.

## Combo Gá»™i Äáº§u + Massage
- **Combo Tiáº¿t Kiá»‡m** (60 ph â€“ 149.000Ä‘)
- **Combo ThÆ° GiÃ£n** (75 ph â€“ 199.000Ä‘)
- **Combo Cao Cáº¥p** (90 ph â€“ 279.000Ä‘)

## Tiá»‡n Ãch
- Chá»— Ä‘áº­u xe rá»™ng rÃ£i
- KhÃ´ng gian mÃ¡y láº¡nh
- Giáº£m 5% khi Ä‘áº·t online

**Hotline: 0934 323 878**`,
    image_url: 'https://images.unsplash.com/photo-1591343395082-e120e004c565?w=800&auto=format&fit=crop'
  },
  {
    title: 'SÆ¡n Gel Äáº¹p â€“ Bá»n MÃ u â€“ An ToÃ n Táº¡i Min Nail & Hair',
    slug: 'son-gel-dep-ben-mau',
    summary: 'SÆ¡n gel organic cao cáº¥p, bá»n mÃ u 2-3 tuáº§n. Báº£ng giÃ¡ chi tiáº¿t vÃ  quy trÃ¬nh lÃ m mÃ³ng chuáº©n táº¡i Min Nail & Hair Thá»§ Äá»©c.',
    content: `# SÆ¡n Gel Äáº¹p â€“ Bá»n MÃ u â€“ An ToÃ n Táº¡i Min Nail & Hair

## Báº£ng GiÃ¡ SÆ¡n Gel
- SÆ¡n gel: 110.000Ä‘
- TrÃ¡ng gÆ°Æ¡ng / Máº¯t mÃ¨o: 150.000Ä‘
- Combo SÆ¡n Gel + cáº¯t da: 99.000Ä‘
- Combo Máº¯t mÃ¨o + cáº¯t da: 139.000Ä‘

## Quy TrÃ¬nh Chuáº©n
Vá»‡ sinh â†’ cáº¯t da â†’ dÅ©a táº¡o dÃ¡ng â†’ phá»§ gel ná»n â†’ sÆ¡n mÃ u â†’ phá»§ bÃ³ng â†’ dÆ°á»¡ng dáº§u

## Máº¹o Giá»¯ SÆ¡n Gel LÃ¢u
TrÃ¡nh hÃ³a cháº¥t máº¡nh, Ä‘eo gÄƒng tay khi rá»­a chÃ©n.

GhÃ© **Min Nail & Hair â€“ Lavita Charm, Thá»§ Äá»©c** ngay hÃ´m nay!`,
    image_url: 'https://images.unsplash.com/photo-1610992015732-2449b76344bc?w=800&auto=format&fit=crop'
  },
  {
    title: 'CÃ´ng Thá»©c Náº¥u NÆ°á»›c Gá»™i Äáº§u Tháº£o DÆ°á»£c Táº¡i NhÃ ',
    slug: 'cong-thuc-nau-nuoc-goi-dau-thao-duoc',
    summary: 'HÆ°á»›ng dáº«n náº¥u nÆ°á»›c gá»™i Ä‘áº§u tháº£o dÆ°á»£c tá»« bá»“ káº¿t, sáº£ chanh, vá» bÆ°á»Ÿi. ÄÆ¡n giáº£n, tiáº¿t kiá»‡m, hiá»‡u quáº£ cho tÃ³c cháº¯c khá»e.',
    content: `# CÃ´ng Thá»©c Náº¥u NÆ°á»›c Gá»™i Äáº§u Tháº£o DÆ°á»£c Táº¡i NhÃ 

## NÆ°á»›c Gá»™i Bá»“ Káº¿t â€“ Sáº£ Chanh
NguyÃªn liá»‡u: 10 quáº£ bá»“ káº¿t nÆ°á»›ng, 5 cá»§ sáº£, 3 quáº£ chanh, vá» bÆ°á»Ÿi. Äun vá»›i 2 lÃ­t nÆ°á»›c 20 phÃºt.

## NÆ°á»›c Gá»™i HÆ°Æ¡ng Nhu â€“ TÃ­a TÃ´
CÃ´ng dá»¥ng: Giáº£m ngá»©a da Ä‘áº§u, khÃ¡ng khuáº©n, trá»‹ gÃ u.

## NÆ°á»›c Gá»™i LÃ¡ DÃ¢u Táº±m
CÃ´ng dá»¥ng: KÃ­ch thÃ­ch má»c tÃ³c, giáº£m rá»¥ng tÃ³c.

Náº¿u khÃ´ng cÃ³ thá»i gian náº¥u, hÃ£y Ä‘áº¿n **Min Nail & Hair** Ä‘á»ƒ tráº£i nghiá»‡m dá»‹ch vá»¥ gá»™i Ä‘áº§u dÆ°á»¡ng sinh cao cáº¥p!`,
    image_url: 'https://images.unsplash.com/photo-1556228578-0d85b1a4d571?w=800&auto=format&fit=crop'
  },
  {
    title: 'HÆ°á»›ng Dáº«n ChÄƒm SÃ³c MÃ³ng Tay â€“ MÃ³ng ChÃ¢n Táº¡i NhÃ ',
    slug: 'huong-dan-cham-soc-mong',
    summary: 'BÃ­ quyáº¿t chÄƒm sÃ³c mÃ³ng tay, mÃ³ng chÃ¢n táº¡i nhÃ  Ä‘Æ¡n giáº£n. Káº¿t há»£p dá»‹ch vá»¥ nail chuyÃªn nghiá»‡p táº¡i Min Nail & Hair Thá»§ Äá»©c.',
    content: `# HÆ°á»›ng Dáº«n ChÄƒm SÃ³c MÃ³ng Tay â€“ MÃ³ng ChÃ¢n Táº¡i NhÃ 

## CÃ¡c BÆ°á»›c ChÄƒm SÃ³c MÃ³ng
1. **Vá»‡ sinh**: NgÃ¢m nÆ°á»›c áº¥m pha muá»‘i 5-10 phÃºt
2. **Cáº¯t â€“ dÅ©a**: Cáº¯t theo Ä‘Æ°á»ng cong tá»± nhiÃªn, dÅ©a má»™t chiá»u
3. **DÆ°á»¡ng áº©m**: Thoa dáº§u dÆ°á»¡ng biá»ƒu bÃ¬ hÃ ng ngÃ y

## Khi NÃ o NÃªn Äáº¿n Salon?
Äáº¿n Min Ä‘á»‹nh ká»³ 2-3 tuáº§n/láº§n Ä‘á»ƒ cáº¯t da chuyÃªn sÃ¢u.

## Dá»‹ch Vá»¥ Táº¡i Min
- Nháº·t da láº»: 45.000Ä‘
- PhÃ¡ sÆ¡n gel: 20.000Ä‘
- ChÃ  gÃ³t chÃ¢n 5 bÆ°á»›c: 149.000Ä‘

Äáº¿n ngay **Min Nail & Hair â€“ Chung cÆ° Lavita Charm, Thá»§ Äá»©c**!`,
    image_url: 'https://images.unsplash.com/photo-1607779097040-26e80aa78e66?w=800&auto=format&fit=crop'
  },
  {
    title: 'Æ¯u ÄÃ£i Äáº·c Biá»‡t Khi Äáº·t Lá»‹ch Online Táº¡i Min Nail & Hair',
    slug: 'uu-dai-dat-lich-online',
    summary: 'Giáº£m ngay 5% khi Ä‘áº·t lá»‹ch online táº¡i Min Nail & Hair. Chá»n ngÃ y giá», chá»n ká»¹ thuáº­t viÃªn, xem giÃ¡ dá»‹ch vá»¥ dá»… dÃ ng.',
    content: `# Æ¯u ÄÃ£i Äáº·c Biá»‡t Khi Äáº·t Lá»‹ch Online Táº¡i Min Nail & Hair

## Tiá»‡n Lá»£i Khi Äáº·t Online
- Chá»n ngÃ y giá» (9:00-20:30)
- Chá»n ká»¹ thuáº­t viÃªn yÃªu thÃ­ch
- Giáº£m ngay **5%** tá»•ng hÃ³a Ä‘Æ¡n

## CÃ¡ch Äáº·t
1. Chá»n ngÃ y vÃ  khung giá»
2. Chá»n dá»‹ch vá»¥
3. Nháº­p thÃ´ng tin
4. XÃ¡c nháº­n â€“ nháº­n mÃ£ giáº£m 5%

## CÃ¢u Há»i ThÆ°á»ng Gáº·p
- **CÃ³ thá»ƒ há»§y lá»‹ch?** CÃ³, trÆ°á»›c 2 giá».
- **CÃ³ thá»ƒ chá»n thá»£?** CÃ³, hoáº·c chá»n ngáº«u nhiÃªn.
- **Æ¯u Ä‘Ã£i 5%?** Ãp dá»¥ng má»i dá»‹ch vá»¥.

Äáº·t lá»‹ch ngay!`,
    image_url: 'https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=800&auto=format&fit=crop'
  },
  {
    title: 'Combo Deal Tiáº¿t Kiá»‡m Nail â€“ Gá»™i â€“ Massage Táº¡i Thá»§ Äá»©c',
    slug: 'combo-deal-tiet-kiem',
    summary: 'Combo Æ°u Ä‘Ã£i nail, gá»™i Ä‘áº§u, massage giÃ¡ tá»‘t táº¡i Min Nail & Hair. SÆ¡n Gel + cáº¯t da chá»‰ 99.000Ä‘. Giáº£m thÃªm 5% khi Ä‘áº·t online.',
    content: `# Combo Deal Tiáº¿t Kiá»‡m Nail â€“ Gá»™i â€“ Massage Táº¡i Thá»§ Äá»©c

## Combo Deal SiÃªu Tiáº¿t Kiá»‡m
- **Combo SÆ¡n Gel + cáº¯t da**: 99.000Ä‘
- **Combo SÆ¡n Tháº¡ch + cáº¯t da**: 119.000Ä‘
- **Combo Máº¯t mÃ¨o + cáº¯t da**: 139.000Ä‘
- **ChÃ  gÃ³t chÃ¢n theo combo**: 99.000Ä‘

## Deal Massage
- Body 60 ph: 285.000Ä‘
- Body 90 ph: 404.000Ä‘
- Body 120 ph: 499.000Ä‘

Äáº·t online Ä‘á»ƒ nháº­n thÃªm Æ°u Ä‘Ã£i 5%!

ðŸ“ Chung cÆ° Lavita Charm, ÄÆ°á»ng sá»‘ 1, TrÆ°á»ng Thá», Thá»§ Äá»©c
ðŸ“ž Hotline: 0934 323 878`,
    image_url: 'https://images.unsplash.com/photo-1540555700478-4be289fbec6d?w=800&auto=format&fit=crop'
  },
  // Extra posts from seed_blogs2.mjs
  {
    title: 'BÃ­ Quyáº¿t Phá»¥c Há»“i TÃ³c HÆ° Tá»•n Sau Khi Nhuá»™m vÃ  Duá»—i',
    slug: 'bi-quyet-phuc-hoi-toc-hu-ton',
    summary: 'HÆ°á»›ng dáº«n chi tiáº¿t cÃ¡ch phá»¥c há»“i tÃ³c hÆ° tá»•n do nhuá»™m, duá»—i, uá»‘n. Káº¿t há»£p liá»‡u trÃ¬nh gá»™i Ä‘áº§u dÆ°á»¡ng sinh tháº£o dÆ°á»£c giÃºp tÃ³c cháº¯c khá»e tá»« gá»‘c Ä‘áº¿n ngá»n.',
    content: 'Sau khi nhuá»™m mÃ u hay duá»—i tÃ³c, mÃ¡i tÃ³c cá»§a báº¡n thÆ°á»ng trá»Ÿ nÃªn khÃ´ xÆ¡, cháº» ngá»n vÃ  máº¥t Ä‘i Ä‘á»™ bÃ³ng mÆ°á»£t tá»± nhiÃªn. Äá»«ng lo láº¯ng, bÃ i viáº¿t nÃ y sáº½ chia sáº» nhá»¯ng bÃ­ quyáº¿t phá»¥c há»“i tÃ³c hÆ° tá»•n hiá»‡u quáº£ nháº¥t.\n\n## NguyÃªn NhÃ¢n Khiáº¿n TÃ³c HÆ° Tá»•n Sau HÃ³a Cháº¥t\n\nKhi báº¡n nhuá»™m hoáº·c duá»—i tÃ³c, cÃ¡c hÃ³a cháº¥t tÃ¡c Ä‘á»™ng trá»±c tiáº¿p lÃªn cáº¥u trÃºc keratin cá»§a tÃ³c, phÃ¡ vá»¡ liÃªn káº¿t disulfide khiáº¿n tÃ³c yáº¿u Ä‘i. Lá»›p biá»ƒu bÃ¬ (cuticle) bá»‹ tá»•n thÆ°Æ¡ng, khÃ´ng cÃ²n kháº£ nÄƒng giá»¯ áº©m tá»± nhiÃªn. Háº­u quáº£ lÃ  tÃ³c khÃ´, xÆ¡ rá»‘i, dá»… gÃ£y rá»¥ng.\n\n## Quy TrÃ¬nh Phá»¥c Há»“i TÃ³c Táº¡i NhÃ \n\n### 1. Sá»­ Dá»¥ng Dáº§u Gá»™i Dá»‹u Nháº¹\nChá»n dáº§u gá»™i khÃ´ng sulfate (sulfate-free) Ä‘á»ƒ lÃ m sáº¡ch nháº¹ nhÃ ng mÃ  khÃ´ng láº¥y Ä‘i Ä‘á»™ áº©m tá»± nhiÃªn cá»§a tÃ³c. Gá»™i 2-3 láº§n má»—i tuáº§n lÃ  Ä‘á»§, khÃ´ng nÃªn gá»™i quÃ¡ nhiá»u.\n\n### 2. á»¦ TÃ³c HÃ ng Tuáº§n\ná»¦ tÃ³c vá»›i máº·t náº¡ dáº§u dá»«a hoáº·c dáº§u argan Ã­t nháº¥t 1 láº§n/tuáº§n. Äá»ƒ máº·t náº¡ trÃªn tÃ³c 30 phÃºt dÆ°á»›i khÄƒn áº¥m Ä‘á»ƒ dÆ°á»¡ng cháº¥t tháº©m tháº¥u sÃ¢u.\n\n### 3. Háº¡n Cháº¿ Nhiá»‡t Äá»™ Cao\nKhi sáº¥y tÃ³c, Ä‘á»ƒ cháº¿ Ä‘á»™ nhiá»‡t trung bÃ¬nh vÃ  giá»¯ mÃ¡y sáº¥y cÃ¡ch tÃ³c 15-20cm. Sá»­ dá»¥ng xá»‹t báº£o vá»‡ nhiá»‡t trÆ°á»›c khi táº¡o kiá»ƒu.\n\n### 4. Cáº¯t Tá»‰a Ngá»n TÃ³c Äá»‹nh Ká»³\nCáº¯t tá»‰a 6-8 tuáº§n má»™t láº§n Ä‘á»ƒ loáº¡i bá» pháº§n ngá»n hÆ° tá»•n, kÃ­ch thÃ­ch tÃ³c má»c khá»e hÆ¡n.\n\n## Liá»‡u TrÃ¬nh Gá»™i Äáº§u DÆ°á»¡ng Sinh Táº¡i Min Nail & Hair\n\nÄá»ƒ Ä‘áº¡t hiá»‡u quáº£ phá»¥c há»“i tá»‘i Æ°u, báº¡n nÃªn káº¿t há»£p chÄƒm sÃ³c táº¡i nhÃ  vá»›i cÃ¡c liá»‡u trÃ¬nh chuyÃªn sÃ¢u táº¡i salon. Dá»‹ch vá»¥ [**Gá»™i Ä‘áº§u dÆ°á»¡ng sinh táº¡i Thá»§ Äá»©c**](/blog/goi-dau-duong-sinh-tai-thu-duc) cá»§a Min Nail & Hair sá»­ dá»¥ng tháº£o dÆ°á»£c thiÃªn nhiÃªn nhÆ° bá»“ káº¿t, sáº£ chanh, vá» bÆ°á»Ÿi giÃºp:\n\n- **LÃ m sáº¡ch sÃ¢u** mÃ  khÃ´ng lÃ m máº¥t Ä‘á»™ áº©m tá»± nhiÃªn\n- **Massage áº¥n huyá»‡t** kÃ­ch thÃ­ch tuáº§n hoÃ n mÃ¡u dÆ°á»›i da Ä‘áº§u\n- **DÆ°á»¡ng cháº¥t tháº£o dÆ°á»£c** tháº©m tháº¥u vÃ o tá»«ng sá»£i tÃ³c\n\nÄáº·c biá»‡t, [**Combo 3 â€“ ChuyÃªn SÃ¢u**](/blog/combo-goi-dau-massage-lavita-charm) vá»›i thá»i gian 80 phÃºt káº¿t há»£p massage toÃ n thÃ¢n lÃ  lá»±a chá»n tuyá»‡t vá»i cho nhá»¯ng ai muá»‘n phá»¥c há»“i tÃ³c vÃ  thÆ° giÃ£n cÃ¹ng lÃºc.\n\n## Thá»±c ÄÆ¡n Dinh DÆ°á»¡ng Cho TÃ³c Khá»e\n\nBÃªn cáº¡nh chÄƒm sÃ³c bÃªn ngoÃ i, báº¡n cÅ©ng cáº§n bá»• sung dinh dÆ°á»¡ng tá»« bÃªn trong:\n- **Vitamin B7 (Biotin)**: CÃ³ trong trá»©ng, háº¡nh nhÃ¢n, khoai lang\n- **Vitamin E**: CÃ³ trong bÆ¡, dáº§u oliu, cÃ¡c loáº¡i háº¡t\n- **Omega-3**: CÃ³ trong cÃ¡ há»“i, quáº£ Ã³c chÃ³\n- **Káº½m (Zinc)**: CÃ³ trong hÃ u, thá»‹t bÃ², háº¡t bÃ­\n\n## Káº¿t Há»£p Liá»‡u TrÃ¬nh ChuyÃªn SÃ¢u\n\nNáº¿u báº¡n Ä‘ang gáº·p tÃ¬nh tráº¡ng rá»¥ng tÃ³c nhiá»u sau khi nhuá»™m/duá»—i, hÃ£y tham kháº£o ngay bÃ i viáº¿t [**ChÄƒm sÃ³c tÃ³c chuyÃªn sÃ¢u vá»›i tháº£o dÆ°á»£c thiÃªn nhiÃªn**](/blog/cham-soc-toc-chuyen-sau) Ä‘á»ƒ cÃ³ giáº£i phÃ¡p toÃ n diá»‡n nháº¥t.\n\nÄá»«ng quÃªn Ä‘áº·t lá»‹ch online táº¡i Min Nail & Hair Ä‘á»ƒ nháº­n Æ°u Ä‘Ã£i giáº£m 5% cho láº§n Ä‘áº§u tráº£i nghiá»‡m dá»‹ch vá»¥ [**gá»™i Ä‘áº§u dÆ°á»¡ng sinh tháº£o dÆ°á»£c**](/blog/goi-dau-duong-sinh-tai-thu-duc) nhÃ©!',
    image_url: 'https://images.unsplash.com/photo-1526947425960-945c6e72858f?w=800&auto=format&fit=crop'
  },
  {
    title: 'Massage Trá»‹ Liá»‡u: Giáº£i PhÃ¡p Cho DÃ¢n VÄƒn PhÃ²ng Äau Má»i Cá»• Vai GÃ¡y',
    slug: 'massage-tri-lieu-dan-van-phong',
    summary: 'Giáº£m Ä‘au má»i cá»• vai gÃ¡y vá»›i massage trá»‹ liá»‡u chuyÃªn sÃ¢u táº¡i Min Nail & Hair. PhÆ°Æ¡ng phÃ¡p thÆ° giÃ£n hiá»‡u quáº£ cho dÃ¢n vÄƒn phÃ²ng ngá»“i nhiá»u.',
    content: 'Báº¡n ngá»“i lÃ m viá»‡c 8-10 tiáº¿ng má»—i ngÃ y trÆ°á»›c mÃ¡y tÃ­nh? Báº¡n thÆ°á»ng xuyÃªn cáº£m tháº¥y Ä‘au má»i cá»•, vai, gÃ¡y vÃ  khÃ³ ngá»§ vá» Ä‘Ãªm? Äá»«ng chá»§ quan, Ä‘Ã³ lÃ  nhá»¯ng dáº¥u hiá»‡u cáº£nh bÃ¡o cÆ¡ thá»ƒ Ä‘ang quÃ¡ táº£i. Massage trá»‹ liá»‡u chÃ­nh lÃ  giáº£i phÃ¡p toÃ n diá»‡n dÃ nh cho báº¡n.\n\n## Táº¡i Sao DÃ¢n VÄƒn PhÃ²ng Dá»… Bá»‹ Äau Má»i Cá»• Vai GÃ¡y?\n\nTÆ° tháº¿ ngá»“i sai trong thá»i gian dÃ i khiáº¿n cÆ¡ vÃ¹ng cá»• vÃ  vai gÃ¡y bá»‹ co cá»©ng, lÆ°u thÃ´ng mÃ¡u kÃ©m. Há»™i chá»©ng "vÄƒn phÃ²ng" nÃ y náº¿u khÃ´ng Ä‘Æ°á»£c can thiá»‡p ká»‹p thá»i cÃ³ thá»ƒ dáº«n Ä‘áº¿n:\n- **ThoÃ¡i hÃ³a Ä‘á»‘t sá»‘ng cá»•** sá»›m\n- **Äau Ä‘áº§u migraine** do cÄƒng cÆ¡\n- **Rá»‘i loáº¡n giáº¥c ngá»§** kÃ©o dÃ i\n- **Suy giáº£m trÃ­ nhá»›** vÃ  táº­p trung\n\n## Massage Trá»‹ Liá»‡u Hoáº¡t Äá»™ng NhÆ° Tháº¿ NÃ o?\n\nMassage trá»‹ liá»‡u tÃ¡c Ä‘á»™ng trá»±c tiáº¿p lÃªn cÃ¡c nhÃ³m cÆ¡ bá»‹ co cá»©ng, giÃºp:\n1. **Giáº£i phÃ³ng axit lactic** tÃ­ch tá»¥ trong cÆ¡\n2. **TÄƒng cÆ°á»ng tuáº§n hoÃ n mÃ¡u** Ä‘áº¿n vÃ¹ng bá»‹ tá»•n thÆ°Æ¡ng\n3. **KÃ­ch thÃ­ch sáº£n sinh endorphin** â€“ hormone giáº£m Ä‘au tá»± nhiÃªn\n4. **Phá»¥c há»“i táº§m váº­n Ä‘á»™ng** cá»§a khá»›p cá»• vÃ  vai\n\n## CÃ¡c GÃ³i Massage PhÃ¹ Há»£p Cho DÃ¢n VÄƒn PhÃ²ng\n\nTáº¡i Min Nail & Hair, chÃºng tÃ´i cÃ³ cÃ¡c gÃ³i massage Ä‘Æ°á»£c thiáº¿t káº¿ riÃªng cho dÃ¢n vÄƒn phÃ²ng:\n\n| GÃ³i massage | Thá»i gian | GiÃ¡ Æ°u Ä‘Ã£i | PhÃ¹ há»£p |\n|-------------|-----------|------------|---------|\n| Body 60 phÃºt | 60 phÃºt | 285.000Ä‘ | Giá» trÆ°a vÄƒn phÃ²ng |\n| Body 75 phÃºt | 75 phÃºt | 356.000Ä‘ | Sau giá» lÃ m |\n| Body 90 phÃºt | 90 phÃºt | 404.000Ä‘ | Cuá»‘i tuáº§n thÆ° giÃ£n |\n| Body 120 phÃºt | 120 phÃºt | 499.000Ä‘ | Xáº£ stress toÃ n diá»‡n |\n\nBáº¡n cÃ³ thá»ƒ tham kháº£o thÃªm vá» [**Massage Body thÆ° giÃ£n táº¡i Thá»§ Äá»©c**](/blog/massage-body-thu-gian-tai-thu-duc) Ä‘á»ƒ biáº¿t thÃªm chi tiáº¿t tá»«ng gÃ³i.\n\n## Káº¿t Há»£p Gá»™i Äáº§u DÆ°á»¡ng Sinh VÃ  Massage\n\nMá»™t tráº£i nghiá»‡m tuyá»‡t vá»i mÃ  nhiá»u khÃ¡ch hÃ ng yÃªu thÃ­ch lÃ  káº¿t há»£p massage body vá»›i [**gá»™i Ä‘áº§u dÆ°á»¡ng sinh tháº£o dÆ°á»£c**](/blog/goi-dau-duong-sinh-tai-thu-duc). Sau khi massage giÃºp cÆ¡ thá»ƒ thÆ° giÃ£n, gá»™i Ä‘áº§u tháº£o dÆ°á»£c vá»›i tinh dáº§u sáº£ chanh sáº½ giÃºp tinh tháº§n sáº£ng khoÃ¡i.\n\nHÃ£y ghÃ© [**Min Nail & Hair táº¡i Lavita Charm**](/blog/combo-goi-dau-massage-lavita-charm) Ä‘á»ƒ tráº£i nghiá»‡m combo massage + gá»™i Ä‘áº§u tuyá»‡t vá»i nÃ y. Äáº·t lá»‹ch online ngay hÃ´m nay Ä‘á»ƒ nháº­n Æ°u Ä‘Ã£i giáº£m 5%!\n\n## Máº¹o Giáº£m Äau Táº¡i VÄƒn PhÃ²ng\n\nTrong khi chá» Ä‘áº¿n lá»‹ch massage, báº¡n cÃ³ thá»ƒ Ã¡p dá»¥ng cÃ¡c bÃ i táº­p Ä‘Æ¡n giáº£n táº¡i chá»—:\n- **Xoay cá»• nháº¹ nhÃ ng** theo vÃ²ng trÃ²n 5 láº§n má»—i chiá»u\n- **KÃ©o giÃ£n vai** báº±ng cÃ¡ch Ä‘Æ°a hai tay ra sau lÆ°ng\n- **Äá»©ng dáº­y Ä‘i láº¡i** má»—i 45 phÃºt ngá»“i lÃ m viá»‡c\n\n**LÆ°u Ã½:** Náº¿u cÆ¡n Ä‘au kÃ©o dÃ i trÃªn 2 tuáº§n, hÃ£y káº¿t há»£p [**massage trá»‹ liá»‡u chuyÃªn sÃ¢u**](/blog/massage-body-thu-gian-tai-thu-duc) vÃ  thÄƒm khÃ¡m bÃ¡c sÄ© Ä‘á»ƒ cÃ³ cháº©n Ä‘oÃ¡n chÃ­nh xÃ¡c nháº¥t.',
    image_url: 'https://images.unsplash.com/photo-1600334089648-b0d9d3028eb2?w=800&auto=format&fit=crop'
  },
  {
    title: 'CÃ¡ch Chá»n MÃ u SÆ¡n Gel PhÃ¹ Há»£p Vá»›i TÃ´ng Da',
    slug: 'chon-mau-son-gel-phu-hop-tong-da',
    summary: 'HÆ°á»›ng dáº«n chá»n mÃ u sÆ¡n gel theo tÃ´ng da chuáº©n chuyÃªn gia. Tá»« da sÃ¡ng, da trung bÃ¬nh Ä‘áº¿n da ngÄƒm â€“ mÃ u nÃ o giÃºp tay báº¡n tráº¯ng vÃ  sang nháº¥t?',
    content: 'Má»™t bá»™ mÃ³ng Ä‘áº¹p khÃ´ng chá»‰ náº±m á»Ÿ ká»¹ thuáº­t sÆ¡n mÃ  cÃ²n phá»¥ thuá»™c ráº¥t nhiá»u vÃ o viá»‡c chá»n mÃ u sáº¯c phÃ¹ há»£p vá»›i tÃ´ng da. BÃ i viáº¿t nÃ y sáº½ giÃºp báº¡n "bá» tÃºi" bÃ­ quyáº¿t chá»n mÃ u sÆ¡n gel theo tÃ´ng da chuáº©n chuyÃªn gia.\n\n## XÃ¡c Äá»‹nh TÃ´ng Da Cá»§a Báº¡n\n\nTrÆ°á»›c khi chá»n mÃ u, báº¡n cáº§n biáº¿t mÃ¬nh thuá»™c tÃ´ng da nÃ o. CÃ¡ch Ä‘Æ¡n giáº£n nháº¥t lÃ  kiá»ƒm tra mÃ u máº¡ch mÃ¡u á»Ÿ cá»• tay:\n- **TÃ´ng da láº¡nh (Cool tone)**: Máº¡ch mÃ¡u cÃ³ mÃ u xanh tÃ­m\n- **TÃ´ng da áº¥m (Warm tone)**: Máº¡ch mÃ¡u cÃ³ mÃ u xanh lÃ¡\n- **TÃ´ng da trung tÃ­nh (Neutral tone)**: Cáº£ hai mÃ u xanh vÃ  xanh lÃ¡\n\n## Chá»n MÃ u Theo TÃ´ng Da\n\n### Da SÃ¡ng (Fair/Light)\nDa sÃ¡ng há»£p vá»›i:\n- MÃ u pastel: Há»“ng baby, xanh mint, tÃ­m lavender\n- MÃ u nude trung tÃ­nh: Be, há»“ng Ä‘áº¥t nháº¡t\n- MÃ u Ä‘á» tÆ°Æ¡i: Äá» cherry, Ä‘á» há»“ng\n\n**TrÃ¡nh:** MÃ u vÃ ng Ä‘áº¥t, cam Ä‘áº¥t, nÃ¢u Ä‘á»“ng â€“ dá»… lÃ m tay trÃ´ng tÃ¡i nhá»£t.\n\n### Da Trung BÃ¬nh (Medium)\nDa trung bÃ¬nh lÃ  tÃ´ng da linh hoáº¡t nháº¥t:\n- MÃ u trung tÃ­nh: NÃ¢u cafe, xÃ¡m khÃ³i, beige\n- MÃ u pastel Ä‘áº­m: Oáº£i hÆ°Æ¡ng, xanh dÆ°Æ¡ng nháº¡t\n- MÃ u Ä‘á» Ä‘áº¥t: Äá» gáº¡ch, Ä‘á» rÆ°á»£u vang\n\n### Da NgÄƒm (Tan/Dark)\nDa ngÄƒm nÃªn chá»n cÃ¡c mÃ u ná»•i báº­t:\n- MÃ u sÃ¡ng: Tráº¯ng sá»¯a, kem, há»“ng pháº¥n\n- MÃ u neon: Cam chÃ³i, há»“ng neon\n- MÃ u metallic: VÃ ng gold, báº¡c, Ä‘á»“ng\n- MÃ u Ä‘áº­m: Xanh navy, Ä‘á» Ä‘Ã´, tÃ­m than\n\n## Top MÃ u SÆ¡n Gel ÄÆ°á»£c YÃªu ThÃ­ch Nháº¥t Táº¡i Min\n\nÄáº¿n vá»›i [**Min Nail & Hair**](/blog/nail-art-dep-tai-thu-duc), báº¡n sáº½ Ä‘Æ°á»£c tÆ° váº¥n báº£ng mÃ u sÆ¡n gel Ä‘a dáº¡ng vá»›i hÆ¡n 50+ mÃ u sáº¯c. CÃ¡c mÃ u "hot" nháº¥t hiá»‡n nay:\n\n1. **MÃ u 01 â€“ Nude Há»“ng**: PhÃ¹ há»£p má»i tÃ´ng da, Ä‘i lÃ m hay Ä‘i chÆ¡i Ä‘á»u Ä‘áº¹p\n2. **MÃ u 07 â€“ Äá» RÆ°á»£u Vang**: Sang trá»ng, quyáº¿n rÅ©, Ä‘áº·c biá»‡t há»£p da trung bÃ¬nh Ä‘áº¿n ngÄƒm\n3. **MÃ u 15 â€“ Xanh Mint**: Tráº» trung, nÄƒng Ä‘á»™ng, cá»±c ká»³ há»£p da sÃ¡ng\n4. **MÃ u 23 â€“ NÃ¢u Cafe Sá»¯a**: Thanh lá»‹ch, tinh táº¿, há»£p má»i tÃ´ng da\n5. **MÃ u 39 â€“ Há»“ng Äáº¥t**: Cá»• Ä‘iá»ƒn, vintage, há»£p da trung bÃ¬nh\n\n## Gá»£i Ã Combo SÆ¡n Gel Tiáº¿t Kiá»‡m\n\nNáº¿u báº¡n muá»‘n thá»­ nhiá»u mÃ u mÃ  khÃ´ng lo vá» giÃ¡, hÃ£y tham kháº£o cÃ¡c [**combo sÆ¡n gel siÃªu tiáº¿t kiá»‡m**](/blog/combo-deal-tiet-kiem) táº¡i Min:\n\n- **Combo SÆ¡n Gel + cáº¯t da**: Chá»‰ 99.000Ä‘\n- **Combo SÆ¡n Tháº¡ch + cáº¯t da**: 119.000Ä‘\n- **Combo Máº¯t mÃ¨o + cáº¯t da**: 139.000Ä‘\n\n## BÃ­ Quyáº¿t Giá»¯ MÃ u SÆ¡n Gel Bá»n LÃ¢u\n\nSau khi chá»n Ä‘Æ°á»£c mÃ u Æ°ng Ã½ vÃ  Ä‘Æ°á»£c Ä‘á»™i ngÅ© [**nail chuyÃªn nghiá»‡p**](/blog/nail-art-dep-tai-thu-duc) cá»§a Min thá»±c hiá»‡n, báº¡n cáº§n lÆ°u Ã½:\n- Thoa dáº§u dÆ°á»¡ng biá»ƒu bÃ¬ má»—i ngÃ y\n- Äeo gÄƒng tay khi tiáº¿p xÃºc hÃ³a cháº¥t táº©y rá»­a\n- TrÃ¡nh dÃ¹ng mÃ³ng Ä‘á»ƒ cáº­y, má»Ÿ náº¯p chai\n\nHÃ£y ghÃ© **Min Nail & Hair â€“ Chung cÆ° Lavita Charm, Thá»§ Äá»©c** Ä‘á»ƒ Ä‘Æ°á»£c tÆ° váº¥n vÃ  chá»n mÃ u sÆ¡n gel phÃ¹ há»£p nháº¥t vá»›i báº¡n. [**Äáº·t lá»‹ch online**](/blog/uu-dai-dat-lich-online) Ä‘á»ƒ nháº­n Æ°u Ä‘Ã£i Ä‘áº·c biá»‡t!',
    image_url: 'https://images.unsplash.com/photo-1632149872023-3b5527474799?w=800&auto=format&fit=crop'
  },
  {
    title: 'ChÄƒm SÃ³c Da MÃ¹a HÃ¨: BÃ­ Quyáº¿t Tá»« ChuyÃªn Gia Táº¡i Min Nail & Hair',
    slug: 'cham-soc-da-mua-he',
    summary: 'BÃ­ quyáº¿t chÄƒm sÃ³c da mÃ¹a hÃ¨ hiá»‡u quáº£: chá»‘ng náº¯ng, dÆ°á»¡ng áº©m, detox da. Káº¿t há»£p massage body vÃ  gá»™i dÆ°á»¡ng sinh giÃºp da khá»e Ä‘áº¹p tá»« sÃ¢u bÃªn trong.',
    content: 'MÃ¹a hÃ¨ vá»›i Ã¡nh náº¯ng gay gáº¯t, nhiá»‡t Ä‘á»™ cao vÃ  Ä‘á»™ áº©m lá»›n lÃ  thá»­ thÃ¡ch lá»›n cho lÃ n da. Hiá»ƒu Ä‘Æ°á»£c Ä‘iá»u Ä‘Ã³, Min Nail & Hair xin chia sáº» nhá»¯ng bÃ­ quyáº¿t chÄƒm sÃ³c da mÃ¹a hÃ¨ tá»« chuyÃªn gia, giÃºp báº¡n luÃ´n ráº¡ng rá»¡ dÃ¹ náº¯ng nÃ³ng.\n\n## VÃ¬ Sao Da HÆ° Tá»•n Nhiá»u HÆ¡n VÃ o MÃ¹a HÃ¨?\n\nTia UV tá»« Ã¡nh náº¯ng máº·t trá»i máº¡nh hÆ¡n vÃ o mÃ¹a hÃ¨, khiáº¿n da dá»… bá»‹:\n- **ChÃ¡y náº¯ng** (sunburn) â€“ da Ä‘á» rÃ¡t, bong trÃ³c\n- **TÄƒng sáº¯c tá»‘** â€“ nÃ¡m, tÃ n nhang, Ä‘á»‘m nÃ¢u xuáº¥t hiá»‡n nhiá»u hÆ¡n\n- **Máº¥t nÆ°á»›c** â€“ da khÃ´ cÄƒng, bong trÃ³c\n- **LÃ£o hÃ³a sá»›m** â€“ náº¿p nhÄƒn, cháº£y xá»‡ gia tÄƒng\n\n## Quy TrÃ¬nh ChÄƒm SÃ³c Da MÃ¹a HÃ¨ 4 BÆ°á»›c\n\n### BÆ°á»›c 1: LÃ m Sáº¡ch ÄÃºng CÃ¡ch\nRá»­a máº·t 2 láº§n/ngÃ y vá»›i sá»¯a rá»­a máº·t dá»‹u nháº¹. Táº©y trang ká»¹ trÆ°á»›c khi rá»­a máº·t, Ä‘áº·c biá»‡t náº¿u báº¡n dÃ¹ng kem chá»‘ng náº¯ng chá»‘ng nÆ°á»›c.\n\n### BÆ°á»›c 2: DÆ°á»¡ng áº¨m Nháº¹ NhÃ ng\nChá»n kem dÆ°á»¡ng áº©m dáº¡ng gel hoáº·c lotion nháº¹, khÃ´ng dáº§u (oil-free). VÃ o mÃ¹a hÃ¨, da cáº§n áº©m nhÆ°ng khÃ´ng cáº§n quÃ¡ nhiá»u dáº§u dÆ°á»¡ng.\n\n### BÆ°á»›c 3: Chá»‘ng Náº¯ng Má»i LÃºc\nThoa kem chá»‘ng náº¯ng **SPF 50+ PA++++** má»—i sÃ¡ng vÃ  thoa láº¡i sau 2-3 giá» náº¿u á»Ÿ ngoÃ i trá»i.\n\n### BÆ°á»›c 4: Detox Da HÃ ng Tuáº§n\nTáº©y táº¿ bÃ o cháº¿t 1-2 láº§n/tuáº§n Ä‘á»ƒ loáº¡i bá» bá»¥i báº©n vÃ  táº¿ bÃ o cháº¿t tÃ­ch tá»¥. Äáº¯p máº·t náº¡ Ä‘áº¥t sÃ©t hoáº·c máº·t náº¡ than hoáº¡t tÃ­nh giÃºp lÃ m sáº¡ch sÃ¢u lá»— chÃ¢n lÃ´ng.\n\n## Massage Body GiÃºp Da Khá»e Tá»« BÃªn Trong\n\nBáº¡n cÃ³ biáº¿t [**massage body thÆ°á»ng xuyÃªn**](/blog/massage-body-thu-gian-tai-thu-duc) khÃ´ng chá»‰ giÃºp thÆ° giÃ£n mÃ  cÃ²n ráº¥t tá»‘t cho da?\n\nMassage kÃ­ch thÃ­ch tuáº§n hoÃ n mÃ¡u dÆ°á»›i da, giÃºp:\n- TÄƒng cÆ°á»ng oxy vÃ  dÆ°á»¡ng cháº¥t Ä‘áº¿n táº¿ bÃ o da\n- KÃ­ch thÃ­ch sáº£n sinh collagen tá»± nhiÃªn\n- Há»— trá»£ Ä‘Ã o tháº£i Ä‘á»™c tá»‘ qua há»‡ báº¡ch huyáº¿t\n- Giáº£m bá»ng máº¯t vÃ  quáº§ng thÃ¢m\n\nSau má»™t ngÃ y dÃ i dÆ°á»›i náº¯ng, báº¡n nÃªn káº¿t há»£p [**massage body**](/blog/combo-goi-dau-massage-lavita-charm) vá»›i [**gá»™i Ä‘áº§u dÆ°á»¡ng sinh tháº£o dÆ°á»£c**](/blog/goi-dau-duong-sinh-tai-thu-duc) Ä‘á»ƒ cÆ¡ thá»ƒ vÃ  tinh tháº§n Ä‘Æ°á»£c thÆ° giÃ£n toÃ n diá»‡n.\n\n## Thá»±c Pháº©m Tá»‘t Cho Da MÃ¹a HÃ¨\n\n- **DÆ°a háº¥u, dÆ°a leo**: Cung cáº¥p nÆ°á»›c vÃ  vitamin C\n- **CÃ  chua**: Lycopene chá»‘ng oxy hÃ³a máº¡nh, báº£o vá»‡ da khá»i UV\n- **CÃ¡ há»“i**: Omega-3 giÃºp giáº£m viÃªm da\n- **TrÃ  xanh**: Cháº¥t chá»‘ng oxy hÃ³a EGCG báº£o vá»‡ da tá»« bÃªn trong\n\n## LÆ°u Ã Khi Äi Biá»ƒn Hoáº·c BÆ¡i Lá»™i\n\n- Thoa kem chá»‘ng náº¯ng 30 phÃºt trÆ°á»›c khi ra náº¯ng\n- DÃ¹ng kem chá»‘ng náº¯ng chá»‘ng nÆ°á»›c (water-resistant)\n- Sau khi bÆ¡i, táº¯m láº¡i vá»›i nÆ°á»›c sáº¡ch ngay láº­p tá»©c\n- DÃ¹ng dáº§u dÆ°á»¡ng áº©m sau khi táº¯m Ä‘á»ƒ bÃ¹ Ä‘á»™ áº©m cho da\n\n## Æ¯u ÄÃ£i MÃ¹a HÃ¨ Táº¡i Min\n\nÄáº·t lá»‹ch [**massage body hoáº·c gá»™i Ä‘áº§u dÆ°á»¡ng sinh**](/blog/combo-deal-tiet-kiem) táº¡i Min Nail & Hair trong thÃ¡ng nÃ y Ä‘á»ƒ nháº­n ngay Æ°u Ä‘Ã£i giáº£m 5% khi [**Ä‘áº·t lá»‹ch online**](/blog/uu-dai-dat-lich-online). HÃ£y Ä‘áº¿n **Chung cÆ° Lavita Charm, ÄÆ°á»ng sá»‘ 1, TrÆ°á»ng Thá», Thá»§ Äá»©c** Ä‘á»ƒ tráº£i nghiá»‡m dá»‹ch vá»¥ chÄƒm sÃ³c sá»©c khá»e vÃ  sáº¯c Ä‘áº¹p toÃ n diá»‡n!',
    image_url: 'https://images.unsplash.com/photo-1556228578-0d85b1a4d571?w=800&auto=format&fit=crop'
  },
  {
    title: 'Táº¥t Táº§n Táº­t Vá» CÃ¡c Loáº¡i HÃ¬nh Massage Phá»• Biáº¿n Hiá»‡n Nay',
    slug: 'cac-loai-hinh-massage-pho-bien',
    summary: 'Tá»•ng há»£p Ä‘áº§y Ä‘á»§ cÃ¡c loáº¡i hÃ¬nh massage: Thá»¥y Äiá»ƒn, áº¥n huyá»‡t, Ä‘Ã¡ nÃ³ng, thá»ƒ thao. TÃ¬m hiá»ƒu loáº¡i massage nÃ o phÃ¹ há»£p nháº¥t vá»›i nhu cáº§u cá»§a báº¡n.',
    content: 'Massage khÃ´ng chá»‰ lÃ  má»™t hÃ¬nh thá»©c thÆ° giÃ£n mÃ  cÃ²n lÃ  liá»‡u phÃ¡p trá»‹ liá»‡u Ä‘Æ°á»£c khoa há»c chá»©ng minh. Tuy nhiÃªn, cÃ³ ráº¥t nhiá»u loáº¡i hÃ¬nh massage khÃ¡c nhau, má»—i loáº¡i láº¡i cÃ³ cÃ´ng dá»¥ng riÃªng. BÃ i viáº¿t nÃ y sáº½ giÃºp báº¡n hiá»ƒu rÃµ Ä‘á»ƒ chá»n Ä‘Ãºng loáº¡i massage phÃ¹ há»£p.\n\n## 1. Massage Thá»¥y Äiá»ƒn (Swedish Massage)\n\n**Massage Thá»¥y Äiá»ƒn** lÃ  loáº¡i hÃ¬nh massage phá»• biáº¿n nháº¥t trÃªn tháº¿ giá»›i, sá»­ dá»¥ng cÃ¡c Ä‘á»™ng tÃ¡c vuá»‘t dÃ i, nhÃ o bÃ³p, vá»— nháº¹ vÃ  xoay khá»›p.\n\n**CÃ´ng dá»¥ng:**\n- ThÆ° giÃ£n toÃ n thÃ¢n, giáº£m cÄƒng tháº³ng nháº¹\n- Cáº£i thiá»‡n tuáº§n hoÃ n mÃ¡u\n- PhÃ¹ há»£p cho ngÆ°á»i má»›i báº¯t Ä‘áº§u táº­p massage\n\n**Thá»i gian lÃ½ tÆ°á»Ÿng:** 60-75 phÃºt\n\n## 2. Massage áº¤n Huyá»‡t (Acupressure Massage)\n\nDá»±a trÃªn nguyÃªn lÃ½ cá»§a y há»c cá»• truyá»n, massage áº¥n huyá»‡t tÃ¡c Ä‘á»™ng lÃªn cÃ¡c huyá»‡t Ä‘áº¡o trÃªn cÆ¡ thá»ƒ Ä‘á»ƒ cÃ¢n báº±ng khÃ­ huyáº¿t.\n\n**CÃ´ng dá»¥ng:**\n- Giáº£m Ä‘au Ä‘áº§u, Ä‘au ná»­a Ä‘áº§u\n- Cáº£i thiá»‡n tiÃªu hÃ³a\n- Giáº£m Ä‘au má»i cá»• vai gÃ¡y\n- Há»— trá»£ Ä‘iá»u trá»‹ máº¥t ngá»§\n\nTáº¡i Min Nail & Hair, ká»¹ thuáº­t áº¥n huyá»‡t Ä‘Æ°á»£c káº¿t há»£p trong liá»‡u trÃ¬nh [**gá»™i Ä‘áº§u dÆ°á»¡ng sinh**](/blog/goi-dau-duong-sinh-tai-thu-duc) vÃ  [**massage body**](/blog/massage-body-thu-gian-tai-thu-duc), mang láº¡i hiá»‡u quáº£ thÆ° giÃ£n vÆ°á»£t trá»™i.\n\n## 3. Massage ÄÃ¡ NÃ³ng (Hot Stone Massage)\n\nSá»­ dá»¥ng Ä‘Ã¡ basalt nÃºi lá»­a Ä‘Æ°á»£c lÃ m nÃ³ng Ä‘áº¿n nhiá»‡t Ä‘á»™ thÃ­ch há»£p, Ä‘áº·t lÃªn cÃ¡c Ä‘iá»ƒm huyá»‡t vÃ  dÃ¹ng Ä‘á»ƒ massage.\n\n**CÃ´ng dá»¥ng:**\n- ThÆ° giÃ£n cÆ¡ sÃ¢u á»Ÿ má»©c Ä‘á»™ cao\n- Giáº£m Ä‘au cÆ¡ báº¯p mÃ£n tÃ­nh\n- Cáº£i thiá»‡n giáº¥c ngá»§ rÃµ rá»‡t\n- ThÃ­ch há»£p cho ngÆ°á»i hay bá»‹ láº¡nh tay chÃ¢n\n\n## 4. Massage Thá»ƒ Thao (Sports Massage)\n\nÄÆ°á»£c thiáº¿t káº¿ riÃªng cho váº­n Ä‘á»™ng viÃªn hoáº·c ngÆ°á»i táº­p luyá»‡n thá»ƒ thao thÆ°á»ng xuyÃªn.\n\n**CÃ´ng dá»¥ng:**\n- Phá»¥c há»“i cÆ¡ sau táº­p luyá»‡n\n- NgÄƒn ngá»«a cháº¥n thÆ°Æ¡ng\n- Cáº£i thiá»‡n linh hoáº¡t vÃ  táº§m váº­n Ä‘á»™ng\n- Giáº£m Ä‘au nhá»©c sau táº­p\n\n## 5. Massage Body Tá»•ng QuÃ¡t Táº¡i Min Nail & Hair\n\nTáº¡i Min, chÃºng tÃ´i cung cáº¥p dá»‹ch vá»¥ [**massage body tá»•ng quÃ¡t**](/blog/massage-body-thu-gian-tai-thu-duc) káº¿t há»£p tinh hoa cá»§a nhiá»u trÆ°á»ng phÃ¡i massage. Äá»™i ngÅ© ká»¹ thuáº­t viÃªn Ä‘Æ°á»£c Ä‘Ã o táº¡o bÃ i báº£n, am hiá»ƒu giáº£i pháº«u cÆ¡ thá»ƒ Ä‘á»ƒ Ä‘Æ°a ra liá»‡u trÃ¬nh phÃ¹ há»£p nháº¥t.\n\nBáº£ng giÃ¡ massage táº¡i Min:\n\n| Loáº¡i massage | Thá»i gian | GiÃ¡ Æ°u Ä‘Ã£i |\n|-------------|-----------|------------|\n| Body 60 phÃºt | 60 phÃºt | 285.000Ä‘ |\n| Body 75 phÃºt | 75 phÃºt | 356.000Ä‘ |\n| Body 90 phÃºt | 90 phÃºt | 404.000Ä‘ |\n| Body 120 phÃºt | 120 phÃºt | 499.000Ä‘ |\n\n## NÃªn Chá»n Loáº¡i Massage NÃ o?\n\n- **Báº¡n bá»‹ stress nháº¹, muá»‘n thÆ° giÃ£n cuá»‘i tuáº§n?** â†’ Chá»n massage Thá»¥y Äiá»ƒn (Body 60 ph)\n- **Báº¡n Ä‘au má»i cá»• vai gÃ¡y do ngá»“i nhiá»u?** â†’ Chá»n massage áº¥n huyá»‡t (Body 75-90 ph). Tham kháº£o thÃªm bÃ i viáº¿t [**Massage trá»‹ liá»‡u cho dÃ¢n vÄƒn phÃ²ng**](/blog/massage-tri-lieu-dan-van-phong).\n- **Báº¡n táº­p gym vÃ  cáº§n phá»¥c há»“i cÆ¡?** â†’ Chá»n massage thá»ƒ thao (Body 90 ph)\n- **Báº¡n muá»‘n thÆ° giÃ£n toÃ n diá»‡n cáº£ tÃ³c vÃ  cÆ¡ thá»ƒ?** â†’ Káº¿t há»£p [**massage + gá»™i Ä‘áº§u dÆ°á»¡ng sinh**](/blog/combo-goi-dau-massage-lavita-charm)\n\n## LÆ°u Ã TrÆ°á»›c Khi Massage\n\n- KhÃ´ng Äƒn quÃ¡ no trÆ°á»›c khi massage 1 giá»\n- Uá»‘ng nhiá»u nÆ°á»›c sau khi massage Ä‘á»ƒ Ä‘Ã o tháº£i Ä‘á»™c tá»‘\n- ThÃ´ng bÃ¡o vá»›i ká»¹ thuáº­t viÃªn náº¿u báº¡n cÃ³ váº¥n Ä‘á» sá»©c khá»e Ä‘áº·c biá»‡t\n- KhÃ´ng massage náº¿u Ä‘ang sá»‘t hoáº·c cÃ³ váº¿t thÆ°Æ¡ng há»Ÿ\n\n## Káº¿t Há»£p Massage Vá»›i CÃ¡c Dá»‹ch Vá»¥ KhÃ¡c\n\nÄá»ƒ cÃ³ tráº£i nghiá»‡m toÃ n diá»‡n nháº¥t, báº¡n cÃ³ thá»ƒ káº¿t há»£p massage vá»›i cÃ¡c dá»‹ch vá»¥ khÃ¡c táº¡i Min:\n- [**SÆ¡n gel Ä‘áº¹p**](/blog/son-gel-dep-ben-mau) â€“ lÃ m Ä‘áº¹p mÃ³ng sau khi massage thÆ° giÃ£n\n- [**ChÄƒm sÃ³c da mÃ¹a hÃ¨**](/blog/cham-soc-da-mua-he) â€“ káº¿t há»£p massage dÆ°á»¡ng da\n\nÄáº·t ngay [**lá»‹ch massage online**](/blog/uu-dai-dat-lich-online) táº¡i Min Nail & Hair â€“ Lavita Charm, Thá»§ Äá»©c Ä‘á»ƒ nháº­n Æ°u Ä‘Ã£i 5%!',
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
      console.log(`âš ï¸ ${post.slug} Ä‘Ã£ tá»“n táº¡i (skip)`);
    } else {
      console.error(`âŒ ${post.slug}: ${error.message}`);
    }
  } else {
    console.log(`âœ… ${post.slug}`);
  }
}

console.log(`\nDone! ${posts.length} blog posts processed.`);
