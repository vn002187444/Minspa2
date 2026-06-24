'use client'

import { useState, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'motion/react'
import { Sparkles, X, Lightbulb, ThumbsUp, Star, ChevronRight } from 'lucide-react'
import { playPop, playClick } from '@/lib/sounds'
import { storage } from '@/lib/storage'
import { getMascotStyle } from '@/lib/mascot-themes'

const MASCOT_DISMISSED_KEY = 'min_mascot_dismissed'

const mascotExpressions = {
  happy: { scale: 1, rotate: 0 },
  thinking: { scale: 0.95, rotate: -5 },
  excited: { scale: 1.1, rotate: 0 },
  idle: { scale: 1, rotate: 0 },
}

const stepMessages: Record<number, { title: string; body: string; expression: keyof typeof mascotExpressions; tip?: string }> = {
  1: {
    title: 'Nhập số điện thoại nhé!',
    body: 'Min sẽ tra cứu lịch sử và gợi ý dịch vụ phù hợp nhất cho bạn hôm nay.',
    expression: 'happy',
    tip: '💡 Gợi ý: Nếu chưa từng đến, hãy thử Combo Gội dưỡng sinh + Sơn Gel nhé!',
  },
  2: {
    title: 'Chọn ngày giờ bạn nhé!',
    body: 'Min đề xuất khung giờ vàng còn trống. Chọn KTV yêu thích nếu muốn!',
    expression: 'excited',
    tip: '⏰ Giờ vàng: 09:00-11:00 sáng — ít đông, KTV tràn đầy năng lượng!',
  },
  3: {
    title: 'Đặt lịch thành công rồi!',
    body: 'Min đã ghi nhận lịch hẹn. Bạn có thể hủy hoặc dời lịch qua số hotline bất cứ lúc nào.',
    expression: 'excited',
    tip: '📞 Hotline: 0934 323 878 — Min luôn sẵn sàng hỗ trợ bạn!',
  },
}

const serviceSuggestions: Record<string, string[]> = {
  'Chăm Sóc & Trang Trí Móng': ['Sơn Gel chân tay', 'Vẽ bóng Nhật 3D', 'Đắp bột chân tay'],
  'Gội dưỡng sinh': ['CB1 Cao Cấp', 'Gội xả canh thảo dược'],
  'Massage': ['Massage body thư giãn', 'Chườm đá nóng Tây Tạng'],
  'Deal Chấn Động': ['Combo Sơn Gel + Chà Gót', 'Combo Gội + Sơn Gel'],
  'Chà Gót Chân': ['Chà gót chân 5 bước'],
}

interface BookingMascotGuideProps {
  step: number
  currentCategory?: string
  onSuggestionClick?: (name: string) => void
  soundEnabled?: boolean
}

export default function BookingMascotGuide({ step, currentCategory, onSuggestionClick, soundEnabled = true }: BookingMascotGuideProps) {
  const [dismissed, setDismissed] = useState(() => {
    if (typeof window === 'undefined') return true
    return storage.get(MASCOT_DISMISSED_KEY) === 'true'
  })
  const [showTip, setShowTip] = useState(false)
  const [expression, setExpression] = useState<keyof typeof mascotExpressions>('idle')
  const [idleAnim, setIdleAnim] = useState<'idle' | 'wave' | 'bounce'>('idle')
  const [themeStyle, setThemeStyle] = useState(getMascotStyle('default'))

  // Theme-aware styling
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

  const msg = stepMessages[step] || stepMessages[1]

  useEffect(() => {
    setExpression(msg.expression)
    setShowTip(false)
    const timer = setTimeout(() => setShowTip(true), 3000)
    return () => clearTimeout(timer)
  }, [step, msg.expression])

  // Idle animation cycle
  useEffect(() => {
    if (dismissed) return
    const intervals = ['idle', 'wave', 'bounce', 'idle', 'idle', 'wave'] as const
    let i = 0
    const tick = () => {
      setIdleAnim(intervals[i % intervals.length])
      i++
    }
    const id = setInterval(tick, 4000)
    return () => clearInterval(id)
  }, [dismissed])

  const handleDismiss = useCallback(() => {
    if (soundEnabled) playPop()
    setDismissed(true)
    storage.set(MASCOT_DISMISSED_KEY, 'true')
  }, [soundEnabled])

  const handleSuggestionClick = useCallback((name: string) => {
    if (soundEnabled) playClick()
    onSuggestionClick?.(name)
  }, [onSuggestionClick, soundEnabled])

  if (dismissed) return null

  const expr = mascotExpressions[expression]
  const suggested = currentCategory && serviceSuggestions[currentCategory]
    ? serviceSuggestions[currentCategory].slice(0, 2)
    : null

  const animVariants = {
    idle: { y: [0, -4, 0], rotate: [0, 0, 0] },
    wave: { y: [0, -6, 0], rotate: [0, 10, -10, 0] },
    bounce: { y: [0, -10, 0], scale: [1, 1.05, 1] },
  }

  return (
    <AnimatePresence>
      <div className="flex items-start gap-3 mb-6">
        <motion.div
          animate={animVariants[idleAnim]}
          transition={{ repeat: Infinity, duration: 2, ease: 'easeInOut' }}
          className="relative shrink-0"
        >
          <motion.div
            animate={{ scale: expr.scale, rotate: expr.rotate }}
            transition={{ type: 'spring', stiffness: 300, damping: 15 }}
            className={`w-14 h-14 rounded-full bg-gradient-to-br ${themeStyle.gradient} flex items-center justify-center shadow-md ${themeStyle.border} border-2 cursor-pointer`}
            onClick={handleDismiss}
            whileHover={{ scale: 1.15 }}
            whileTap={{ scale: 0.9 }}
          >
            <Sparkles className="w-6 h-6 text-white" />
          </motion.div>
          <motion.span
            animate={{ scale: [1, 1.3, 1] }}
            transition={{ repeat: Infinity, duration: 2, delay: 1 }}
            className="absolute -top-0.5 -right-0.5 w-3 h-3 rounded-full bg-emerald-400 border-2 border-white"
          />
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 8, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 8, scale: 0.95 }}
          transition={{ type: 'spring', stiffness: 300, damping: 20 }}
          className="relative bg-white rounded-2xl rounded-tl-sm px-4 py-3 shadow-md border border-[#EADDCD] flex-1 max-w-xs"
        >
          <motion.button
            onClick={handleDismiss}
            aria-label="Đóng hướng dẫn"
            className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-gray-200 hover:bg-gray-300 rounded-full flex items-center justify-center transition-colors z-10"
            whileHover={{ scale: 1.2, rotate: 90 }}
            whileTap={{ scale: 0.8 }}
          >
            <X className="w-3 h-3 text-gray-500" />
          </motion.button>

          <motion.p
            key={`title-${step}`}
            initial={{ opacity: 0, x: -5 }}
            animate={{ opacity: 1, x: 0 }}
            className="text-xs font-bold text-[#5C4033] mb-0.5 flex items-center gap-1"
          >
            {expression === 'excited' && <Star className="w-3 h-3 text-amber-500" />}
            {expression === 'thinking' && <Lightbulb className="w-3 h-3 text-sky-500" />}
            {msg.title}
          </motion.p>

          <motion.p
            key={`body-${step}`}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.1 }}
            className="text-xs text-gray-500 leading-relaxed"
          >
            {msg.body}
          </motion.p>

          {/* Service suggestion based on category */}
          {suggested && onSuggestionClick && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              transition={{ delay: 0.5 }}
              className="mt-2 pt-2 border-t border-[#EADDCD]/50 space-y-1"
            >
              <p className="text-[10px] font-bold text-pink-600 uppercase tracking-wider">Min gợi ý:</p>
              {suggested.map((name) => (
                <button
                  key={name}
                  onClick={() => handleSuggestionClick(name)}
                  className="w-full flex items-center gap-1.5 text-xs text-left text-[#5C4033] bg-pink-50/70 hover:bg-pink-100 rounded-lg px-2 py-1.5 transition-colors cursor-pointer"
                >
                  <ThumbsUp className="w-3 h-3 shrink-0" />
                  <span className="font-medium">{name}</span>
                  <ChevronRight className="w-3 h-3 ml-auto shrink-0" />
                </button>
              ))}
            </motion.div>
          )}

          {/* Tip reveal */}
          <AnimatePresence>
            {showTip && msg.tip && (
              <motion.p
                initial={{ opacity: 0, y: 4 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                transition={{ delay: 0.1 }}
                className="text-[10px] text-amber-700 mt-1.5 pt-1.5 border-t border-[#EADDCD]/30 leading-relaxed"
              >
                {msg.tip}
              </motion.p>
            )}
          </AnimatePresence>
        </motion.div>
      </div>
    </AnimatePresence>
  )
}
