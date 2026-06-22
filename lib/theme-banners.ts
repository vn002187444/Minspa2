import type { ThemeName } from './themes';

export interface ThemeBanner {
  icon: string;
  message: string;
  /** Override accent color instead of theme's accent */
  accent?: string;
}

export const THEME_BANNERS: Partial<Record<ThemeName, ThemeBanner>> = {
  tet: {
    icon: '🧧',
    message: 'Chúc mừng Năm Mới! Min Nail & Hair kính chúc quý khách một năm mới an khang thịnh vượng, vạn sự như ý!',
  },
  valentine: {
    icon: '💝',
    message: 'Yêu thương là món quà đẹp nhất! Min Nail & Hair gửi tặng ưu đãi đặc biệt dành riêng cho các cặp đôi nhân ngày Valentine.',
  },
  womens_day: {
    icon: '🌷',
    message: 'Xinh đẹp và rạng rỡ! Min Nail & Hair tri ân ngày Quốc tế Phụ nữ 8/3 với ưu đãi đặc biệt dành cho phái đẹp.',
  },
  vn_womens_day: {
    icon: '🌸',
    message: 'Tự hào phụ nữ Việt Nam! Min Nail & Hair gửi lời chúc tốt đẹp nhất đến tất cả khách hàng nhân ngày 20/10.',
  },
  trung_thu: {
    icon: '🏮',
    message: 'Trung Thu đoàn viên — Min Nail & Hair chúc quý khách một mùa Trăng ấm áp, tràn ngập niềm vui bên gia đình.',
  },
  halloween: {
    icon: '🎃',
    message: 'Halloween rùng rơn nhưng vẫn phải xinh! Cùng Min hóa trang và tỏa sáng trong đêm hội nhé.',
  },
  christmas: {
    icon: '🎄',
    message: 'Giáng Sinh an lành! Min Nail & Hair gửi ngàn lời chúc ấm áp đến quý khách và gia đình.',
  },
  newyear: {
    icon: '🎆',
    message: 'Chào năm mới rực rỡ! Min Nail & Hair đồng hành cùng bạn trên mọi hành trình làm đẹp.',
  },
  spring: {
    icon: '🌸',
    message: 'Mùa Xuân tươi mới — Min Nail & Hair chào đón bạn với những ưu đãi đặc biệt đầu năm.',
  },
  summer: {
    icon: '☀️',
    message: 'Mùa Hè rực rỡ — Cùng Min tỏa sáng với bộ sưu tập dịch vụ chăm sóc sắc đẹp mới nhất.',
  },
  autumn: {
    icon: '🍂',
    message: 'Mùa Thu lãng mạn — Min Nail & Hair mang đến cho bạn vẻ đẹp dịu dàng, thanh lịch.',
  },
  winter: {
    icon: '❄️',
    message: 'Mùa Đông ấm áp — Chăm sóc da và tóc cùng Min ngay hôm nay để luôn rạng rỡ nhé!',
  },
};

export interface WeatherBanner {
  icon: string;
  message: string;
  /** CSS color override */
  bg: string;
}

/** Weather banners shown when no holiday/seasonal banner is active */
export const WEATHER_BANNERS: Record<string, WeatherBanner> = {
  rainy: {
    icon: '☔',
    message: 'Trời mưa rồi! Ghé Min Nail & Hair làm đẹp, vừa ấm áp vừa có ưu đãi đặc biệt.',
    bg: '#5b6abf',
  },
  foggy: {
    icon: '🌫️',
    message: 'Sáng nay trời nhiều mây — Khởi đầu ngày mới với vẻ đẹp rạng rỡ cùng Min nhé!',
    bg: '#7a8a9a',
  },
  snowy: {
    icon: '⛄',
    message: 'Trời lạnh rồi! Đến Min ngay để được chăm sóc da, tóc và thư giãn cùng ly trà gừng ấm.',
    bg: '#6b8fa7',
  },
  hot: {
    icon: '🥵',
    message: 'Nóng quá! Ghé Min làm mát với dịch vụ chăm sóc da chuyên sâu — mát lạnh, sảng khoái.',
    bg: '#c07a4a',
  },
};

export function getWeatherBanner(condition: string): WeatherBanner | null {
  return WEATHER_BANNERS[condition] || null;
}
