import type { ThemeName } from './themes';

export interface MascotThemeStyle {
  gradient: string;
  border: string;
  shadow: string;
}

export const THEME_MASCOT_STYLES: Record<ThemeName, MascotThemeStyle> = {
  default:    { gradient: 'from-amber-200 to-amber-400', border: 'border-amber-300', shadow: 'shadow-amber-200/50' },
  spring:     { gradient: 'from-emerald-200 to-green-400', border: 'border-emerald-300', shadow: 'shadow-emerald-200/50' },
  summer:     { gradient: 'from-sky-200 to-blue-400', border: 'border-sky-300', shadow: 'shadow-sky-200/50' },
  autumn:     { gradient: 'from-orange-200 to-amber-500', border: 'border-orange-300', shadow: 'shadow-orange-200/50' },
  winter:     { gradient: 'from-blue-100 to-indigo-300', border: 'border-blue-200', shadow: 'shadow-blue-200/50' },
  tet:        { gradient: 'from-red-200 to-orange-400', border: 'border-red-300', shadow: 'shadow-red-200/50' },
  valentine:  { gradient: 'from-pink-200 to-rose-400', border: 'border-pink-300', shadow: 'shadow-pink-200/50' },
  christmas:  { gradient: 'from-red-200 to-emerald-400', border: 'border-emerald-300', shadow: 'shadow-emerald-200/50' },
  newyear:    { gradient: 'from-purple-200 to-indigo-400', border: 'border-purple-300', shadow: 'shadow-purple-200/50' },
  womens_day: { gradient: 'from-fuchsia-200 to-pink-400', border: 'border-fuchsia-300', shadow: 'shadow-fuchsia-200/50' },
  vn_womens_day: { gradient: 'from-red-200 to-pink-400', border: 'border-red-300', shadow: 'shadow-red-200/50' },
  trung_thu:  { gradient: 'from-amber-200 to-yellow-500', border: 'border-amber-300', shadow: 'shadow-amber-200/50' },
  halloween:  { gradient: 'from-purple-200 to-orange-400', border: 'border-purple-300', shadow: 'shadow-purple-200/50' },
};

export function getMascotStyle(theme?: string): MascotThemeStyle {
  return THEME_MASCOT_STYLES[theme as ThemeName] || THEME_MASCOT_STYLES.default;
}

export interface MascotCharacter {
  key: string;
  label: string;
  emoji: string;
  desc: string;
}

export const MASCOT_CHARACTERS: MascotCharacter[] = [
  { key: 'min',      label: 'Min 🐱',      emoji: '🐱', desc: 'Mèo vàng dễ thương' },
  { key: 'sparkle',  label: 'Sparkle ✨',   emoji: '✨', desc: 'Tiên lấp lánh' },
  { key: 'flower',   label: 'Flower 🌸',    emoji: '🌸', desc: 'Hoa hồng nữ tính' },
  { key: 'bubble',   label: 'Bubble 🫧',    emoji: '🫧', desc: 'Bong bóng xà phòng' },
  { key: 'moon',     label: 'Moon 🌙',      emoji: '🌙', desc: 'Mặt trăng thư giãn' },
  { key: 'star',     label: 'Star ⭐',      emoji: '⭐', desc: 'Ngôi sao sáng' },
  { key: 'heart',    label: 'Heart 💖',     emoji: '💖', desc: 'Trái tim yêu thương' },
  { key: 'diamond',  label: 'Diamond 💎',   emoji: '💎', desc: 'Kim cương sang trọng' },
  { key: 'leaf',     label: 'Leaf 🌿',      emoji: '🌿', desc: 'Lá cây thiên nhiên' },
  { key: 'sun',      label: 'Sun ☀️',       emoji: '☀️', desc: 'Mặt trời năng lượng' },
  { key: 'rainbow',  label: 'Rainbow 🌈',   emoji: '🌈', desc: 'Cầu vồng sắc màu' },
  { key: 'butterfly', label: 'Butterfly 🦋', emoji: '🦋', desc: 'Cánh bướm xinh đẹp' },
  { key: 'crown',    label: 'Crown 👑',     emoji: '👑', desc: 'Vương miện cao quý' },
];

export function getCharacterEmoji(key: string): string {
  return MASCOT_CHARACTERS.find(c => c.key === key)?.emoji || '🐱';
}
