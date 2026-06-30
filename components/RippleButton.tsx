'use client'

import { useRef, useState, type MouseEvent, type ReactNode } from 'react'

interface Ripple {
  x: number
  y: number
  size: number
  id: number
}

let rippleId = 0

interface RippleButtonProps {
  children: ReactNode
  className?: string
  onClick?: (_e: MouseEvent<HTMLButtonElement>) => void
  [key: string]: any
}

export default function RippleButton({ children, className = '', onClick, ...props }: RippleButtonProps) {
  const [ripples, setRipples] = useState<Ripple[]>([])
  const ref = useRef<HTMLButtonElement>(null)

  const handleClick = (e: MouseEvent<HTMLButtonElement>) => {
    const btn = ref.current
    if (!btn) return
    const rect = btn.getBoundingClientRect()
    const size = Math.max(rect.width, rect.height)
    const x = e.clientX - rect.left - size / 2
    const y = e.clientY - rect.top - size / 2
    const id = ++rippleId
    setRipples((prev) => [...prev, { x, y, size, id }])
    setTimeout(() => {
      setRipples((prev) => prev.filter((r) => r.id !== id))
    }, 600)
    onClick?.(e)
  }

  return (
    <button
      ref={ref}
      onClick={handleClick}
      className={`relative overflow-hidden ${className}`}
      {...props}
    >
      {children}
      {ripples.map((r) => (
        <span
          key={r.id}
          className="absolute rounded-full bg-white/30 pointer-events-none animate-ripple"
          style={{
            left: r.x,
            top: r.y,
            width: r.size,
            height: r.size,
          }}
        />
      ))}
    </button>
  )
}
