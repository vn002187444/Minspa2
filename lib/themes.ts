export type ThemeName =
  | 'default' | 'spring' | 'summer' | 'autumn' | 'winter'
  | 'tet' | 'valentine' | 'christmas' | 'newyear'
  | 'womens_day' | 'vn_womens_day' | 'trung_thu' | 'halloween';

export interface Theme {
  name: ThemeName;
  label: string;
}

export type ParticleType = 'none' | 'snow' | 'leaves' | 'petals';

const THEME_PARTICLES: Record<ThemeName, ParticleType> = {
  default: 'none',
  spring: 'petals',
  summer: 'petals',
  autumn: 'leaves',
  winter: 'snow',
  tet: 'petals',
  valentine: 'petals',
  christmas: 'snow',
  newyear: 'snow',
  womens_day: 'petals',
  vn_womens_day: 'petals',
  trung_thu: 'none',
  halloween: 'leaves',
};

const THEME_COLORS: Record<ThemeName, string> = {
  default: '#fbbf24',
  spring: '#f5faf0',
  summer: '#eef8fa',
  autumn: '#fcf5eb',
  winter: '#f0f5fa',
  tet: '#fef5ee',
  valentine: '#fef0f5',
  christmas: '#f5f8f2',
  newyear: '#f5f5fa',
  womens_day: '#fdf0f7',
  vn_womens_day: '#fef0f0',
  trung_thu: '#fef8f0',
  halloween: '#f8f0fc',
};

export function getParticleType(theme: ThemeName): ParticleType {
  return THEME_PARTICLES[theme] || 'none';
}

export function getThemeColor(theme: ThemeName): string {
  return THEME_COLORS[theme] || '#faf6f0';
}

function getSeasonalTheme(month: number): Theme {
  if (month >= 3 && month <= 5) return { name: 'spring', label: 'Mùa Xuân' };
  if (month >= 6 && month <= 8) return { name: 'summer', label: 'Mùa Hè' };
  if (month >= 9 && month <= 11) return { name: 'autumn', label: 'Mùa Thu' };
  return { name: 'winter', label: 'Mùa Đông' };
}

function isTetSeason(month: number, day: number): boolean {
  if (month === 1 && day >= 20) return true;
  if (month === 2 && day <= 15) return true;
  return false;
}

function isTrungThu(month: number, day: number): boolean {
  // Approximate range for Mid-Autumn Festival (15th day of 8th lunar month)
  if (month === 9 && day >= 15) return true;
  if (month === 10 && day <= 7) return true;
  return false;
}

export function detectTheme(date: Date = new Date()): Theme {
  const month = date.getMonth() + 1;
  const day = date.getDate();

  if (isTetSeason(month, day)) return { name: 'tet', label: 'Tết Nguyên Đán' };
  if (month === 2 && day === 14) return { name: 'valentine', label: "Valentine's Day" };
  if (month === 3 && day === 8) return { name: 'womens_day', label: 'Quốc tế Phụ nữ' };
  if (month === 10 && day === 20) return { name: 'vn_womens_day', label: 'Ngày Phụ nữ Việt Nam' };
  if (isTrungThu(month, day)) return { name: 'trung_thu', label: 'Trung Thu' };
  if (month === 10 && day === 31) return { name: 'halloween', label: 'Halloween' };
  if (month === 12 && day >= 20 && day <= 26) return { name: 'christmas', label: 'Giáng Sinh' };
  if (month === 1 && day === 1) return { name: 'newyear', label: 'New Year' };

  return getSeasonalTheme(month);
}

export const THEME_LIST: { name: ThemeName; label: string; description: string }[] = [
  { name: 'default', label: 'Mặc định', description: 'Tông ấm trung tính' },
  { name: 'spring', label: 'Mùa Xuân', description: 'Xanh lá nhẹ nhàng' },
  { name: 'summer', label: 'Mùa Hè', description: 'Xanh dương mát mẻ' },
  { name: 'autumn', label: 'Mùa Thu', description: 'Cam nâu ấm áp' },
  { name: 'winter', label: 'Mùa Đông', description: 'Xanh thanh lịch' },
  { name: 'tet', label: 'Tết Nguyên Đán', description: 'Đỏ cam rực rỡ' },
  { name: 'valentine', label: "Valentine's Day", description: 'Hồng ngọt ngào' },
  { name: 'womens_day', label: 'Quốc tế Phụ nữ 8/3', description: 'Hồng tím tươi tắn' },
  { name: 'vn_womens_day', label: 'Phụ nữ Việt Nam 20/10', description: 'Đỏ hồng ấm áp' },
  { name: 'trung_thu', label: 'Trung Thu', description: 'Vàng cam lung linh' },
  { name: 'halloween', label: 'Halloween', description: 'Tím cam ma mị' },
  { name: 'christmas', label: 'Giáng Sinh', description: 'Xanh lá đỏ mùa lễ' },
  { name: 'newyear', label: 'New Year', description: 'Tím xanh sang trọng' },
];
