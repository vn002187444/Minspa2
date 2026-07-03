'use client'

import { useRef, useState, useCallback, useEffect } from 'react'
import { Globe, Check } from 'lucide-react'

const LANGUAGES: Record<string, string> = {
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

export default function GoogleTranslate() {
  const [open, setOpen] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)
  const [currentLang, setCurrentLang] = useState('vi')
  const widgetReady = useRef(false)

  useEffect(() => {
    const match = document.cookie.match(/googtrans=\/[^/]+\/([^;]+)/)
    if (match && LANGUAGES[match[1]]) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setCurrentLang(match[1])
    }
  }, [])

  // Load Google Translate widget after mount
  useEffect(() => {
    if (widgetReady.current) return
    if (typeof window.googleTranslateElementInit !== 'undefined') return

    window.googleTranslateElementInit = () => {
      new google.translate.TranslateElement(
        {
          pageLanguage: 'vi',
          includedLanguages: 'vi,en,ko,zh-CN,ja,th,fr,de,es',
          autoDisplay: false,
        },
        'google_translate_element'
      )
    }

    const script = document.createElement('script')
    script.src =
      'https://translate.googleapis.com/translate_a/element.js?cb=googleTranslateElementInit'
    script.async = true
    document.body.appendChild(script)
    widgetReady.current = true

    return () => {
      widgetReady.current = false
    }
  }, [])

  const handleToggle = useCallback(() => {
    setOpen((v) => !v)
  }, [])

  const switchLanguage = (lang: string) => {
    if (lang === currentLang) {
      setOpen(false)
      return
    }

    const host = window.location.hostname
    const domain = host === 'localhost' ? host : `.${host.split('.').slice(-2).join('.')}`

    // Setting domain = '' on localhost makes cookie work correctly
    const cookieDomain = host === 'localhost' ? '' : `; domain=${domain}`

    // eslint-disable-next-line react-hooks/immutability
    document.cookie = `googtrans=/vi/${lang}; path=/${cookieDomain}; max-age=${365 * 24 * 60 * 60}s; SameSite=Lax`

    // Directly trigger translation via Google Translate API if available
    try {
      if (typeof google !== 'undefined' && google.translate) {
        const selectElem = document.querySelector('.goog-te-combo') as HTMLSelectElement | null
        if (selectElem) {
          selectElem.value = lang
          selectElem.dispatchEvent(new Event('change'))
          return
        }
      }
    } catch {
      // fall through to reload
    }

    window.location.reload()
  }

  // Click outside to close
  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
      setOpen(false)
    }
  }, [])

  return (
    <div className="fixed top-4 right-4 z-[60]" ref={dropdownRef}>
      <button
        onClick={handleToggle}
        className="flex items-center gap-1.5 px-3 py-2 rounded-full text-xs font-semibold transition-all bg-white/90 hover:bg-white shadow-md border border-[#EADDCD] hover:shadow-lg text-[#5C4033] hover:text-[#3A2E2B] backdrop-blur-sm cursor-pointer"
        aria-label="Chọn ngôn ngữ"
      >
        <Globe className="w-4 h-4" />
        <span className="hidden sm:inline">{LANGUAGES[currentLang] || 'Tiếng Việt'}</span>
      </button>

      {open && (
        <div
          className="absolute right-0 top-full mt-2 bg-white rounded-xl shadow-xl border border-[#EADDCD] p-3 z-[70] min-w-[200px]"
          onMouseDown={handleMouseDown}
        >
          <div className="space-y-1">
            {Object.entries(LANGUAGES).map(([code, label]) => (
              <button
                key={code}
                onClick={() => switchLanguage(code)}
                className={`w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition-all cursor-pointer ${
                  code === currentLang
                    ? 'bg-[#8D6E53] text-white font-medium'
                    : 'text-[#3A2E2B] hover:bg-[#F5F0EB]'
                }`}
              >
                <span className="flex-1 text-left">{label}</span>
                {code === currentLang && <Check className="w-4 h-4 shrink-0" />}
              </button>
            ))}
          </div>
          <p className="text-[10px] text-[#5C4033]/60 mt-3 text-center border-t border-[#EADDCD] pt-2">
            Google Translate
          </p>
        </div>
      )}

      <div id="google_translate_element" className="translate-widget-container" />

      <style>{`
        .goog-te-banner-frame { display: none !important; }
        body { top: 0 !important; }
        .goog-tooltip { display: none !important; }
        .goog-text-highlight { background: transparent !important; border: none !important; box-shadow: none !important; }
        .translate-widget-container {
          position: fixed;
          top: -1000px;
          left: -1000px;
          width: 1px;
          height: 1px;
          opacity: 0;
          pointer-events: none;
          overflow: hidden;
          z-index: -1;
        }
        .translate-widget-container iframe {
          width: 1px !important;
          height: 1px !important;
          min-width: 1px !important;
          min-height: 1px !important;
        }
      `}</style>
    </div>
  )
}
