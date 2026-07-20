export const DEFAULT_LOCALE = 'vi'
export const COOKIE_NAME = 'locale'

export const LANGUAGES: Record<string, string> = {
  vi: 'Tiếng Việt',
  en: 'English',
  ko: '한국어',
  'zh-CN': '中文',
  ja: '日本語',
  th: 'ไทย',
  fr: 'Français',
  de: 'Deutsch',
  es: 'Español',
}

export type Locale = keyof typeof LANGUAGES

export type Dictionary = Record<string, string>
