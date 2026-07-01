'use client'

import { useEffect, useRef } from 'react'

declare global {
  // eslint-disable-next-line no-unused-vars
  interface Window {
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
}

export default function GoogleTranslate() {
  const initialized = useRef(false)

  useEffect(() => {
    if (initialized.current) return
    initialized.current = true

    window.googleTranslateElementInit = () => {
      new window.google.translate.TranslateElement(
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
      const script = document.createElement('script')
      script.src =
        '//translate.google.com/translate_a/element.js?cb=googleTranslateElementInit'
      script.async = true
      document.body.appendChild(script)
    }

    // Defer Google Translate to avoid render-blocking CSS from gstatic.com
    if (document.readyState === 'complete') {
      setTimeout(load, 3000)
    } else {
      window.addEventListener('load', () => setTimeout(load, 3000), { once: true })
    }

    return () => {
      initialized.current = true
    }
  }, [])

  return (
    <>
      <div id="google_translate_element" className="google-translate-widget" />
      <style>{`
        .goog-te-banner-frame { display: none !important; }
        body { top: 0 !important; }
        .goog-te-gadget { font-size: 0 !important; }
        .goog-te-gadget > span { display: none !important; }
        .goog-te-gadget .goog-te-combo {
          font-size: 13px !important;
          padding: 4px 8px !important;
          border: 1px solid #d1d5db !important;
          border-radius: 6px !important;
          background: white !important;
          color: #374151 !important;
          cursor: pointer !important;
          outline: none !important;
        }
        .goog-te-gadget .goog-te-combo:focus {
          border-color: #fbbf24 !important;
          box-shadow: 0 0 0 2px rgba(251,191,36,0.2) !important;
        }
        .goog-te-menu-frame { display: none !important; }
        .skiptranslate { display: none !important; }
        .google-translate-widget .skiptranslate { display: inline-block !important; }
      `}</style>
    </>
  )
}
