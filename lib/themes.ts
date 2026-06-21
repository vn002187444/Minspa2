export type ThemeName = 'default' | 'spring' | 'summer' | 'autumn' | 'winter' | 'tet' | 'valentine' | 'christmas' | 'newyear';

export interface Theme {
  name: ThemeName;
  label: string;
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

export function detectTheme(date: Date = new Date()): Theme {
  const month = date.getMonth() + 1;
  const day = date.getDate();

  if (isTetSeason(month, day)) return { name: 'tet', label: 'Tết Nguyên Đán' };
  if (month === 2 && day === 14) return { name: 'valentine', label: "Valentine's Day" };
  if (month === 12 && day >= 20 && day <= 26) return { name: 'christmas', label: 'Giáng Sinh' };
  if (month === 1 && day === 1) return { name: 'newyear', label: 'New Year' };

  return getSeasonalTheme(month);
}
