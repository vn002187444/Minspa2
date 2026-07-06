import { type Config } from 'tailwindcss';
import animate from 'tailwindcss-animate';

const config: Config = {
  content: [
    './app/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './lib/**/*.{js,ts,jsx,tsx,mdx}',
    './utils/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['var(--font-sans)'],
        display: ['var(--font-display)'],
      },
      animation: {
        blob: "blob 7s infinite",
        fadeIn: "fadeIn 0.8s cubic-bezier(0.16, 1, 0.3, 1) forwards",
        slideUp: "slideUp 0.8s cubic-bezier(0.16, 1, 0.3, 1) forwards",
        float: "float 5s ease-in-out infinite",
        "float-delayed": "float 6s ease-in-out infinite 2s",
        shimmer: "shimmer 1.5s infinite",
        ripple: "ripple 0.6s ease-out forwards",
      },
      screens: {
        'xs': '480px',
        'xxl': '1600px',
        '4k': '2560px',
      },
      keyframes: {
        blob: {
          "0%": { transform: "translate(0px, 0px) scale(1)" },
          "33%": { transform: "translate(30px, -50px) scale(1.1)" },
          "66%": { transform: "translate(-20px, 20px) scale(0.9)" },
          "100%": { transform: "translate(0px, 0px) scale(1)" },
        },
        fadeIn: {
          from: { opacity: "0" },
          to: { opacity: "1" },
        },
        slideUp: {
          from: { opacity: "0", transform: "translateY(16px)" },
          to: { opacity: "1", transform: "translateY(0)" },
        },
        float: {
          "0%, 100%": { transform: "translateY(0)" },
          "50%": { transform: "translateY(-10px)" },
        },
        shimmer: {
          "0%": { backgroundPosition: "-200% 0" },
          "100%": { backgroundPosition: "200% 0" },
        },
        ripple: {
          from: { transform: "scale(0)", opacity: "0.5" },
          to: { transform: "scale(4)", opacity: "0" },
        },
      },
    },
  },
  safelist: [
    'bg-red-50/80', 'border-red-200', 'text-red-400', 'cursor-not-allowed',
    'bg-amber-500', 'border-amber-500', 'text-white', 'ring-2', 'ring-amber-300',
    'bg-emerald-50', 'border-emerald-300', 'text-emerald-700',
    'bg-green-50/70', 'border-green-200', 'text-green-600',
    'bg-blue-50', 'border-blue-200', 'text-blue-600',
    'bg-gray-50', 'border-gray-200', 'text-gray-500',
  ],
  plugins: [animate],
};

export default config;
