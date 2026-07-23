'use client'

import { useState, useEffect, useCallback } from 'react'
import Image from 'next/image'
import { motion, AnimatePresence } from 'motion/react'

const EMOTIONS = [
  'Dancing around...',
  'Full of joy',
  'Feeling sparkly!',
  'La-la-la~',
  'So fluffyyyy',
  '*happy noises*',
  'Boing boing!',
  '今日も元気！',
  'Nyaa~',
  'Sparkle sparkle!',
  'waku waku!',
  'Doki doki...',
  'Moe moe kyun!',
  'Senpai noticed me!',
  'Chu~ ♥',
  'Tsundere mode ON',
  'Not that I like you or anything...',
  'Rawr x3',
  '*nuzzles*',
  'Headpat please!',
  'UwU',
  'OwO what\'s this?',
  '>_< so embarrassing...',
  '(◕‿◕✿)',
  '~(=^‥^)ノ',
  'ヽ(>∀<☆)ノ',
  '٩(◕‿◕｡)۶',
  '✧*:･ﾟ✧ magic ✧ﾟ･:*✧',
  '★~☆~★',
  '♪ ♫ ♬',
]

export default function AnimeMascot() {
  const [src, setSrc] = useState<string | null>(null)
  const [images, setImages] = useState<string[]>([])
  const [isHovered, setIsHovered] = useState(false)
  const [shuffling, setShuffling] = useState(false)
  const [emotion, setEmotion] = useState('')

  useEffect(() => {
    fetch('/api/mascot-settings')
      .then(res => res.json())
      .then(data => {
        const urls: string[] = data.imageUrls || []
        setImages(urls)
        if (urls.length > 0) {
          setSrc(urls[Math.floor(Math.random() * urls.length)])
        }
      })
      .catch(() => {})
  }, [])

  useEffect(() => {
    if (isHovered) {
      setEmotion(EMOTIONS[Math.floor(Math.random() * EMOTIONS.length)])
    }
  }, [isHovered])

  const shuffle = useCallback(() => {
    if (images.length === 0 || shuffling) return
    setShuffling(true)
    setEmotion(EMOTIONS[Math.floor(Math.random() * EMOTIONS.length)])
    const nextIdx = Math.floor(Math.random() * images.length)
    setSrc(images[nextIdx])
    setTimeout(() => setShuffling(false), 500)
  }, [images, shuffling])

  if (!src) return null

  return (
    <div
      className="fixed bottom-0 right-5 z-40 pointer-events-none md:z-50"
      draggable={false}
    >
      <AnimatePresence>
        {isHovered && (
          <motion.div
            initial={{ opacity: 0, y: 10, scale: 0.8 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.8 }}
            transition={{ type: 'spring', stiffness: 300, damping: 20 }}
            className="absolute bottom-full right-0 mb-3 bg-white rounded-2xl rounded-br-sm px-4 py-2.5 shadow-lg border border-pink-100 max-w-[200px] text-center pointer-events-auto"
          >
            <p className="text-xs font-bold text-pink-600 whitespace-nowrap">🎀 Mascot</p>
            <p className="text-[11px] text-gray-500 mt-0.5 italic">{emotion}</p>
            <div className="absolute -bottom-1.5 right-6 w-3 h-3 bg-white border-r border-b border-pink-100 rotate-45" />
          </motion.div>
        )}
      </AnimatePresence>

      <motion.div
        className="pointer-events-auto cursor-pointer"
        draggable={false}
        animate={
          shuffling
            ? {
                x: [0, -4, 4, -4, 4, 0],
                rotate: [0, -3, 3, -3, 3, 0],
                opacity: [1, 0.6, 1, 0.6, 1],
              }
            : isHovered
              ? { y: [0, -4, 0] }
              : {}
        }
        transition={
          shuffling
            ? { duration: 0.5 }
            : isHovered
              ? { repeat: Infinity, duration: 2, ease: 'easeInOut' }
              : {}
        }
        onHoverStart={() => setIsHovered(true)}
        onHoverEnd={() => setIsHovered(false)}
        onTap={shuffle}
        style={{ opacity: isHovered ? 0.3 : 1 }}
      >
        <Image
          src={src}
          alt="Mascot"
          width={0}
          height={0}
          sizes="220px"
          className="max-h-[220px] w-auto h-auto animate-float pointer-events-none select-none"
          draggable={false}
          unoptimized
          priority
        />
      </motion.div>
    </div>
  )
}
