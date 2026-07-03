'use client'


}

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

  useEffect(() => {
    if (widgetReady.current) return
    if (typeof window.googleTranslateElementInit !== 'undefined') return


        {
          pageLanguage: 'vi',
          includedLanguages: 'vi,en,ko,zh-CN,ja,th,fr,de,es',
          autoDisplay: false,
        },
        'google_translate_element'
      )
    }


    }
  }, [])

  // Click outside to close dropdown
  useEffect(() => {
    if (!open) return
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [open])

  const switchLanguage = (lang: string) => {
    if (lang === currentLang) {
      setOpen(false)
      return
    }
    // Set googtrans cookie so Google Translate reads it on reload
    // eslint-disable-next-line react-hooks/immutability
    document.cookie = `googtrans=/vi/${lang}; path=/; max-age=${365 * 24 * 60 * 60}; SameSite=Lax`
    window.location.reload()
  }

  return (
    <div className="fixed top-4 right-4 z-[60]" ref={dropdownRef}>
      <button

        className="flex items-center gap-1.5 px-3 py-2 rounded-full text-xs font-semibold transition-all bg-white/90 hover:bg-white shadow-md border border-[#EADDCD] hover:shadow-lg text-[#5C4033] hover:text-[#3A2E2B] backdrop-blur-sm cursor-pointer"
        aria-label="Chọn ngôn ngữ"
      >
        <Globe className="w-4 h-4" />
        <span className="hidden sm:inline">{LANGUAGES[currentLang] || 'Tiếng Việt'}</span>
      </button>

      {open && (

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



      <style>{`
        .goog-te-banner-frame { display: none !important; }
        body { top: 0 !important; }

      `}</style>
    </div>
  )
}
