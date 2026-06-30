'use client'

import { createContext, useContext, useState, useEffect, useCallback, startTransition, type ReactNode } from 'react'
import { motion, AnimatePresence } from 'motion/react'
import { X } from 'lucide-react'
import { playPop, playClick } from '@/lib/sounds'
import { trackMascotEvent } from '@/lib/analytics'
import { storage } from '@/lib/storage'
import { getMascotStyle, getCharacterEmoji } from '@/lib/mascot-themes'

interface MascotConfig {
  enabled: boolean
  character: string
  soundEnabled: boolean
}

const defaultConfig: MascotConfig = {
  enabled: true,
  character: 'min',
  soundEnabled: true,
}

interface MascotContextType {
  config: MascotConfig
  showMessage: (_title: string, _body: string, _duration?: number) => void
  dismiss: () => void
}

const MascotContext = createContext<MascotContextType>({
  config: defaultConfig,
  showMessage: () => {},
  dismiss: () => {},
})

export const useMascot = () => useContext(MascotContext)

const MASCOT_GLOBAL_DISMISSED_KEY = 'min_mascot_global_dismissed'
const MASCOT_CONFIG_CACHE_KEY = 'min_mascot_config_cache'

const pageMessages: Record<string, { title: string; body: string }> = {
  '/booking': { title: 'Đặt lịch dễ dàng!', body: 'Min hướng dẫn bạn từng bước nhé!' },
  '/': { title: 'Chào mừng đến Min Salon!', body: 'Khám phá dịch vụ làm đẹp tuyệt vời nhé!' },
  '/blog': { title: 'Bí quyết làm đẹp!', body: 'Xem các mẹo làm đẹp từ chuyên gia nào!' },
  '/staff': { title: 'Trang nhân viên', body: 'Quản lý công việc và lịch làm của bạn.' },
}

export default function MascotProvider({ children }: { children: ReactNode }) {
  const [config, setConfig] = useState<MascotConfig>(defaultConfig)
  const [_configLoaded, setConfigLoaded] = useState(false)
  const [dismissed, setDismissed] = useState(false)
  const [floatMsg, setFloatMsg] = useState<{ title: string; body: string } | null>(null)
  const [showChat, setShowChat] = useState(false)
  const [themeStyle, setThemeStyle] = useState(getMascotStyle('default'))

  // Theme-aware styling via MutationObserver
  useEffect(() => {
    const update = () => {
      const t = document.documentElement.getAttribute('data-theme') || 'default'
      setThemeStyle(getMascotStyle(t))
    }
    update()
    const observer = new MutationObserver(update)
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] })
    return () => observer.disconnect()
  }, [])

  // Fetch server settings, fallback to localStorage cache, then default
  useEffect(() => {
    async function load() {
      try {
        const cached = storage.get(MASCOT_CONFIG_CACHE_KEY)
        const cacheData = cached ? JSON.parse(cached) : null

        const res = await fetch('/api/mascot-settings')
        if (res.ok) {
          const server = await res.json()
          const merged = { ...defaultConfig, ...server }
          setConfig(merged)
          storage.set(MASCOT_CONFIG_CACHE_KEY, JSON.stringify(merged))
        } else if (cacheData) {
          setConfig(cacheData)
        }
      } catch {
        const cached = storage.get(MASCOT_CONFIG_CACHE_KEY)
        if (cached) {
          try { setConfig(JSON.parse(cached)) } catch {}
        }
      }
      setConfigLoaded(true)
    }
    load()
  }, [])

  useEffect(() => {
    const d = storage.get(MASCOT_GLOBAL_DISMISSED_KEY) === 'true'
    startTransition(() => { setDismissed(d); });
    if (!d) {
      const path = window.location.pathname
      const msg = pageMessages[path] || { title: 'Chào bạn!', body: 'Min có thể giúp gì cho bạn?' }
      startTransition(() => { setFloatMsg(msg); });
    }
  }, [])

  const showMessage = useCallback((title: string, body: string, duration = 5000) => {
    setFloatMsg({ title, body })
    setShowChat(true)
    if (duration > 0) {
      setTimeout(() => setShowChat(false), duration)
    }
  }, [])

  const dismiss = useCallback(() => {
    if (config.soundEnabled) playPop()
    setDismissed(true)
    setShowChat(false)
    storage.set(MASCOT_GLOBAL_DISMISSED_KEY, 'true')
    trackMascotEvent('dismiss', { page: window.location.pathname })
  }, [config.soundEnabled])

  const handleChatToggle = useCallback(() => {
    const next = !showChat
    setShowChat(next)
    if (next && config.soundEnabled) playClick()
    if (next) trackMascotEvent('open', { page: window.location.pathname })
  }, [showChat, config.soundEnabled])

  return (
    <MascotContext.Provider value={{ config, showMessage, dismiss }}>
      {children}

      {config.enabled && !dismissed && (
        <div className="fixed bottom-24 right-4 z-40 flex flex-col items-end gap-2">
          <AnimatePresence>
            {showChat && floatMsg && (
              <motion.div
                initial={{ opacity: 0, y: 10, scale: 0.9 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 10, scale: 0.9 }}
                transition={{ type: 'spring', stiffness: 300, damping: 20 }}
                className="bg-white rounded-2xl rounded-br-sm px-4 py-3 shadow-lg border border-[#EADDCD] max-w-[260px] relative"
              >
                <button
                  onClick={dismiss}
                  className="absolute -top-1.5 -right-1.5 w-4 h-4 bg-gray-200 hover:bg-gray-300 rounded-full flex items-center justify-center"
                  aria-label="Đóng"
                >
                  <X className="w-2.5 h-2.5 text-gray-500" />
                </button>
                <p className="text-xs font-bold text-[#5C4033] mb-0.5">{floatMsg.title}</p>
                <p className="text-xs text-gray-500 leading-relaxed">{floatMsg.body}</p>
              </motion.div>
            )}
          </AnimatePresence>

          <motion.button suppressHydrationWarning={true}
            onClick={handleChatToggle}
            animate={{ y: [0, -4, 0] }}
            transition={{ repeat: Infinity, duration: 3, ease: 'easeInOut' }}
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            className={`w-16 h-16 rounded-full bg-gradient-to-br ${themeStyle.gradient} flex items-center justify-center shadow-lg ${themeStyle.border} border-2 cursor-pointer relative`}
            aria-label="Trợ lý Min"
          >
            {showChat ? (
              <X className="w-6 h-6 text-white" />
            ) : (
              <>
                <span className="text-2xl leading-none">{getCharacterEmoji(config.character)}</span>
                <motion.span
                  animate={{ scale: [1, 1.3, 1] }}
                  transition={{ repeat: Infinity, duration: 2, delay: 1 }}
                  className="absolute -top-0.5 -right-0.5 w-3.5 h-3.5 rounded-full bg-emerald-400 border-2 border-white"
                />
              </>
            )}
          </motion.button>
        </div>
      )}
    </MascotContext.Provider>
  )
}
