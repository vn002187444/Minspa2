'use client'

import { useRef, useState, useEffect } from 'react'
import { Globe, Check } from 'lucide-react'
import { LANGUAGES, COOKIE_NAME, DEFAULT_LOCALE } from './config'

export default function LanguageSwitcher() {
  const [open, setOpen] = useState(false)
  const [currentLang, setCurrentLang] = useState(DEFAULT_LOCALE)
  const dropdownRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const match = document.cookie.match(new RegExp(`(^| )${COOKIE_NAME}=([^;]+)`))
    if (match && LANGUAGES[match[2]]) {
      setCurrentLang(match[2]) // eslint-disable-line react-hooks/set-state-in-effect
    }
  }, [])

  const switchLanguage = (lang: string) => {
    if (lang === currentLang) {
      setOpen(false)
      return
    }
    setCurrentLang(lang)
    setOpen(false)

    const setCookie = (c: string) => { document.cookie = c; }
    setCookie(`${COOKIE_NAME}=${lang}; path=/; SameSite=Lax; max-age=${365 * 24 * 60 * 60}`)
    const host = window.location.hostname
    if (host !== 'localhost') {
      const domain = `.${host.split('.').slice(-2).join('.')}`
      setCookie(`${COOKIE_NAME}=${lang}; path=/; domain=${domain}; SameSite=Lax; max-age=${365 * 24 * 60 * 60}`)
    }
    window.location.reload()
  }

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    if (open) {
      document.addEventListener('mousedown', handleClickOutside)
    }
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [open])

  return (
    <div ref={dropdownRef} className="relative inline-block">
      <button
        onClick={() => setOpen(v => !v)}
        className="flex items-center gap-1.5 px-3 py-2 rounded-full text-xs font-semibold transition-all bg-white/90 hover:bg-white shadow-md border border-[#EADDCD] hover:shadow-lg text-[#5C4033] hover:text-[#3A2E2B] backdrop-blur-sm cursor-pointer"
        aria-label="Chọn ngôn ngữ"
      >
        <Globe className="w-4 h-4" aria-hidden="true" />
        <span className="hidden sm:inline">{LANGUAGES[currentLang] || 'Tiếng Việt'}</span>
      </button>

      {open && (
        <div className="absolute right-0 top-full mt-2 bg-white rounded-xl shadow-xl border border-[#EADDCD] p-3 z-[70] min-w-[200px]">
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
                {code === currentLang && <Check className="w-4 h-4 shrink-0" aria-hidden="true" />}
              </button>
            ))}
          </div>
          <p className="text-[10px] text-[#5C4033]/60 mt-3 text-center border-t border-[#EADDCD] pt-2">
            Ngôn ngữ
          </p>
        </div>
      )}
    </div>
  )
}
