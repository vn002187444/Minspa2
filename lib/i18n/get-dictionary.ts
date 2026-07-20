import type { Dictionary } from './config'
import { DEFAULT_LOCALE } from './config'

const dictionaries: Record<string, () => Promise<Dictionary>> = {
  vi: () => import('./dictionaries/vi.json').then(m => m.default),
  en: () => import('./dictionaries/en.json').then(m => m.default),
  ko: () => import('./dictionaries/ko.json').then(m => m.default),
  'zh-CN': () => import('./dictionaries/zh-CN.json').then(m => m.default),
  ja: () => import('./dictionaries/ja.json').then(m => m.default),
  th: () => import('./dictionaries/th.json').then(m => m.default),
  fr: () => import('./dictionaries/fr.json').then(m => m.default),
  de: () => import('./dictionaries/de.json').then(m => m.default),
  es: () => import('./dictionaries/es.json').then(m => m.default),
}

export async function getDictionary(locale: string): Promise<Dictionary> {
  const loader = dictionaries[locale] || dictionaries[DEFAULT_LOCALE]
  return loader()
}
