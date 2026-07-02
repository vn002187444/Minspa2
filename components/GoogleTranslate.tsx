'use client'

import { useEffect, useRef, useState } from 'react'
import { Globe } from 'lucide-react'

type GoogleTranslateWindow = {
  googleTranslateElementInit: () => void
  google: {
    translate: {
      TranslateElement: new (_config: {
        pageLanguage: string
        includedLanguages: string
        layout: number
        autoDisplay: boolean
      }, _element: string) => void
    }
  }
}

const LANG_LABELS: Record<string, string> = {
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
  const initialized = useRef(false)
  const [open, setOpen] = useState(false)
  const [currentLang] = useState('vi')
  const dropdownRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (initialized.current) return
    initialized.current = true

    const w = window as unknown as GoogleTranslateWindow
    w.googleTranslateElementInit = () => {
      new w.google.translate.TranslateElement(
        {
          pageLanguage: 'vi',
          includedLanguages: 'vi,en,ko,zh-CN,ja,th,fr,de,es',
          layout: 0,
          autoDisplay: false,
        },
        'google_translate_element'
      )
    }

    const load = () => {
      if (document.getElementById('google_translate_script')) return
      const script = document.createElement('script')
      script.id = 'google_translate_script'
      script.src = '//translate.google.com/translate_a/element.js?cb=googleTranslateElementInit'
      script.async = true
      document.body.appendChild(script)
    }

    if (document.readyState === 'complete') {
      setTimeout(load, 3000)
    } else {
      window.addEventListener('load', () => setTimeout(load, 3000), { once: true })
    }

    return () => {
      initialized.current = true
    }
  }, [])

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

  return (
    <div className="fixed top-4 right-4 z-[60]" ref={dropdownRef}>
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center gap-1.5 px-3 py-2 rounded-full text-xs font-semibold transition-all bg-white/90 hover:bg-white shadow-md border border-[#EADDCD] hover:shadow-lg text-[#5C4033] hover:text-[#3A2E2B] backdrop-blur-sm cursor-pointer"
        aria-label="Chọn ngôn ngữ"
      >
        <Globe className="w-4 h-4" />
        <span className="hidden sm:inline">{LANG_LABELS[currentLang] || 'Tiếng Việt'}</span>
      </button>

      <div
        className={`absolute right-0 top-full mt-2 bg-white rounded-xl shadow-xl border border-[#EADDCD] p-3 z-[70] min-w-[200px] transition-all duration-200 ${
          open ? 'opacity-100 visible translate-y-0' : 'opacity-0 invisible -translate-y-1 pointer-events-none'
        }`}
      >
        <div id="google_translate_element" className="[&_.goog-te-gadget]:!text-sm [&_.goog-te-combo]:!w-full [&_.goog-te-combo]:!px-3 [&_.goog-te-combo]:!py-2.5 [&_.goog-te-combo]:!border [&_.goog-te-combo]:!border-[#EADDCD] [&_.goog-te-combo]:!rounded-lg [&_.goog-te-combo]:!text-sm [&_.goog-te-combo]:!text-[#3A2E2B] [&_.goog-te-combo]:!bg-white [&_.goog-te-combo]:!cursor-pointer [&_.goog-te-combo]:focus:!border-[#8D6E53] [&_.goog-te-combo]:focus:!ring-2 [&_.goog-te-combo]:focus:!ring-[#8D6E53]/20 [&_.goog-te-gadget]:!text-[#5C4033] [&_.goog-te-gadget]>span:!hidden" />
        <p className="text-[10px] text-[#5C4033]/60 mt-2 text-center">
          Google Translate
        </p>
      </div>

      <style>{`
        .goog-te-banner-frame { display: none !important; }
        body { top: 0 !important; }
        .goog-te-combo { min-height: 36px; }
      `}</style>
    </div>
  )
}
