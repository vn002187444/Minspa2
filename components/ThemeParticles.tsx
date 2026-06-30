'use client';

import { useEffect, useRef } from 'react';
import type { ParticleType } from '@/lib/themes';

interface Particle {
  x: number;
  y: number;
  size: number;
  speedY: number;
  speedX: number;
  opacity: number;
  rotation: number;
  rotationSpeed: number;
}

const COLORS: Record<ParticleType, string[]> = {
  none: [],
  snow: ['#ffffff', '#e8f0fe', '#f0f8ff'],
  leaves: ['#d4a373', '#cc8b5c', '#bf7a4a', '#e9c46a'],
  petals: ['#f4a261', '#e76f51', '#e9c46a', '#f8edeb', '#fcd5ce'],
};

export default function ThemeParticles({ type, count = 30 }: { type: ParticleType; count?: number }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const particlesRef = useRef<Particle[]>([]);
  const rafRef = useRef<number>(0);

  useEffect(() => {
    if (type === 'none' || !canvasRef.current) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const resize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight * 2;
    };
    resize();
    window.addEventListener('resize', resize);

    const colors = COLORS[type];
    particlesRef.current = Array.from({ length: count }, () => ({
      x: Math.random() * canvas.width,
      y: -20 - Math.random() * canvas.height * 0.5,
      size: type === 'snow' ? 2 + Math.random() * 5 : 6 + Math.random() * 12,
      speedY: type === 'snow' ? 0.3 + Math.random() * 0.5 : 0.5 + Math.random() * 1,
      speedX: (Math.random() - 0.5) * 0.5,
      opacity: type === 'snow' ? 0.5 + Math.random() * 0.5 : 0.4 + Math.random() * 0.4,
      rotation: Math.random() * 360,
      rotationSpeed: (Math.random() - 0.5) * 2,
    }));

    const animate = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      const _scrollY = window.scrollY;

      for (const p of particlesRef.current) {
        p.y += p.speedY;
        p.x += p.speedX + Math.sin(p.y * 0.01) * 0.3;
        p.rotation += p.rotationSpeed;

        if (p.y > canvas.height + 20) {
          p.y = -20;
          p.x = Math.random() * canvas.width;
        }

        ctx.save();
        ctx.globalAlpha = p.opacity;
        ctx.translate(p.x, p.y);
        ctx.rotate((p.rotation * Math.PI) / 180);

        if (type === 'snow') {
          ctx.beginPath();
          ctx.arc(0, 0, p.size / 2, 0, Math.PI * 2);
          ctx.fillStyle = colors[Math.floor(Math.random() * colors.length)];
          ctx.fill();
        } else {
          ctx.font = `${p.size}px sans-serif`;
          const leafSymbols = ['🧡', '🤎', '💛'];
          const petalSymbols = ['🌸', '🌺', '💮', '🌷'];
          const symbol = type === 'leaves'
            ? leafSymbols[Math.floor(Math.random() * leafSymbols.length)]
            : petalSymbols[Math.floor(Math.random() * petalSymbols.length)];
          ctx.fillText(symbol, 0, 0);
        }

        ctx.restore();
      }

      rafRef.current = requestAnimationFrame(animate);
    };

    animate();

    return () => {
      cancelAnimationFrame(rafRef.current);
      window.removeEventListener('resize', resize);
    };
  }, [type, count]);

  if (type === 'none') return null;

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 pointer-events-none z-[1]"
      aria-hidden="true"
    />
  );
}
