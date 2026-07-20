import { type Config } from 'tailwindcss';
import animate from 'tailwindcss-animate';
import typography from '@tailwindcss/typography';

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
    { pattern: /^bg-(red|amber|emerald|green|blue|gray)-(50|100|200|500)\/?(\d+)?$/ },
    { pattern: /^border-(red|amber|emerald|green|blue|gray)-(200|300|500)$/ },
    { pattern: /^text-(red|amber|emerald|green|blue|gray)-(400|500|600|700)$/ },
    'cursor-not-allowed', 'ring-2', 'ring-amber-300',
  ],
  plugins: [animate, typography],
};

export default config;
