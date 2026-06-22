'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'motion/react'
import { Sparkles, X, ChevronRight, Star, Heart } from 'lucide-react'
import { playPop } from '@/lib/sounds'
import { getMascotStyle } from '@/lib/mascot-themes'

const tips = [
  { icon: '💅', title: 'Sơn Gel chuyên nghiệp', body: 'Giữ màu 3-4 tuần, không bong tróc. Min có 50+ màu cho bạn chọn!' },
  { icon: '🌸', title: 'Gội dưỡng sinh thảo dược', body: 'Đả thông kinh lạc, giảm đau vai gáy. Cảm giác như được sinh ra lần nữa!' },
  { icon: '👣', title: 'Chà gót chân 5 bước', body: 'Liệu trình chuyên sâu — gót chân mịn màng chỉ sau 1 lần!' },
  { icon: '💆', title: 'Massage body thư giãn', body: 'Ấn huyệt, chườm đá nóng Tây Tạng — xua tan mọi mệt mỏi.' },
]

export default function HomeMascotBanner() {
  const [dismissed, setDismissed] = useState(false)
  const [currentTip, setCurrentTip] = useState(0)
  const [showAll, setShowAll] = useState(false)
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

  if (dismissed) return null

  const tip = tips[currentTip]

  return (
    <div className="max-w-6xl mx-auto px-4 py-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="theme-bg-card rounded-3xl border theme-border p-4 md:p-6 relative overflow-hidden"
      >
        <button
          onClick={() => { playPop(); setDismissed(true) }}
          className="absolute top-3 right-3 w-6 h-6 bg-white/80 hover:bg-white rounded-full flex items-center justify-center border border-[#EADDCD] transition-colors z-10 cursor-pointer"
          aria-label="Đóng"
        >
          <X className="w-3.5 h-3.5 text-gray-500" />
        </button>

        <div className="flex items-start gap-4">
          <motion.div
            animate={{ y: [0, -6, 0] }}
            transition={{ repeat: Infinity, duration: 3, ease: 'easeInOut' }}
            className="relative shrink-0"
          >
            <div className={`w-16 h-16 rounded-full bg-gradient-to-br ${themeStyle.gradient} flex items-center justify-center shadow-md ${themeStyle.border} border-2`}>
              <Sparkles className="w-7 h-7 text-white" />
            </div>
            <span className="absolute -top-0.5 -right-0.5 w-3.5 h-3.5 rounded-full bg-emerald-400 border-2 border-white" />
          </motion.div>

          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <Star className="w-4 h-4 text-amber-500" />
              <span className="text-xs font-bold theme-text-secondary uppercase tracking-wider">Min gợi ý hôm nay</span>
            </div>

            <AnimatePresence mode="wait">
              <motion.div
                key={currentTip}
                initial={{ opacity: 0, x: 10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -10 }}
                transition={{ duration: 0.3 }}
              >
                <p className="text-sm font-bold theme-text">{tip.icon} {tip.title}</p>
                <p className="text-xs theme-text-secondary mt-0.5 leading-relaxed">{tip.body}</p>
              </motion.div>
            </AnimatePresence>

            <div className="flex items-center gap-2 mt-3">
              <div className="flex gap-1.5">
                {tips.map((_, i) => (
                  <button
                    key={i}
                    onClick={() => setCurrentTip(i)}
                    className={`w-2 h-2 rounded-full transition-all cursor-pointer ${
                      i === currentTip ? 'theme-bg-accent w-4' : 'bg-gray-300 hover:bg-gray-400'
                    }`}
                    aria-label={`Tip ${i + 1}`}
                  />
                ))}
              </div>
              <button
                onClick={() => setCurrentTip((currentTip + 1) % tips.length)}
                className="ml-auto text-[10px] font-bold theme-text-secondary hover:text-[#5C4033] flex items-center gap-0.5 cursor-pointer"
              >
                Xem tiếp <ChevronRight className="w-3 h-3" />
              </button>
            </div>

            <AnimatePresence>
              {showAll && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="mt-3 pt-3 border-t theme-border space-y-2"
                >
                  {tips.map((t, i) => (
                    <div key={i} className="flex items-start gap-2 text-xs theme-text-secondary">
                      <span>{t.icon}</span>
                      <div>
                        <span className="font-bold theme-text">{t.title}:</span>{' '}
                        <span>{t.body}</span>
                      </div>
                    </div>
                  ))}
                </motion.div>
              )}
            </AnimatePresence>

            <button
              onClick={() => setShowAll(!showAll)}
              className="mt-2 text-[10px] font-bold text-pink-600 hover:text-pink-700 cursor-pointer flex items-center gap-1"
            >
              <Heart className="w-3 h-3" />
              {showAll ? 'Thu gọn' : 'Xem tất cả dịch vụ Min đề xuất'}
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  )
}
