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
  const scriptLoaded = useRef(false)

  useEffect(() => {
    const match = document.cookie.match(/googtrans=\/[^/]+\/([^;]+)/)
    if (match && LANGUAGES[match[1]]) {
      setCurrentLang(match[1])
    }
  }, [])

  const ensureScriptLoaded = useCallback(() => {
    if (scriptLoaded.current) return
    if (document.querySelector('script[src*="translate.googleapis.com"]')) {
      scriptLoaded.current = true
      return
    }
    window.googleTranslateElementInit = () => {
      if (window.__googleTranslateInitialized) return
      window.__googleTranslateInitialized = true
      try {
        new google.translate.TranslateElement(
          { pageLanguage: 'vi', includedLanguages: 'vi,en,ko,zh-CN,ja,th,fr,de,es', autoDisplay: false },
          'google_translate_element'
        )
      } catch (e) {
        console.error('[GT] Init error:', e)
      }
    }
    const script = document.createElement('script')
    script.src = 'https://translate.googleapis.com/translate_a/element.js?cb=googleTranslateElementInit'
    script.async = true
    document.body.appendChild(script)
    scriptLoaded.current = true
  }, [])

  const handleToggle = useCallback(() => {
    setOpen((v) => {
      if (!v) ensureScriptLoaded()
      return !v
    })
  }, [ensureScriptLoaded])

  const switchLanguage = (lang: string) => {
    if (lang === currentLang) {
      setOpen(false)
      return
    }
    setCurrentLang(lang)
    setOpen(false)

    const selectEl = document.querySelector('.goog-te-combo') as HTMLSelectElement | null
    if (selectEl) {
      selectEl.value = lang
      selectEl.dispatchEvent(new Event('change'))
      return
    }

    document.cookie = `googtrans=/vi/${lang}; path=/; SameSite=Lax`;
    const host = window.location.hostname;
    if (host !== 'localhost') {
      const domain = `.${host.split('.').slice(-2).join('.')}`;
      document.cookie = `googtrans=/vi/${lang}; path=/; domain=${domain}; SameSite=Lax`;
    }
    window.location.reload()
  }

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
      setOpen(false)
    }
  }, [])

  return (
    <div 
      className="relative inline-block" 
      ref={dropdownRef}
    >
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

      {/* The widget container must be present and non-display:none for the script to work best */}
      <div id="google_translate_element" className="gt-widget-container" />

      <style>{`
        .gt-widget-container {
          position: absolute;
          left: -9999px;
          top: 0;
          width: 100px;
          height: 100px;
          opacity: 0;
          pointer-events: none;
          z-index: -1;
        }
      `}</style>
    </div>
  )
}
