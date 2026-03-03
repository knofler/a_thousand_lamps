import type { Config } from 'tailwindcss';

const config: Config = {
  // Class-based dark mode — 'dark' class on <html> = dark theme (our default)
  darkMode: 'class',
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        // Amber accent — warm, modern, evokes "lamp" without cultural overload
        accent: {
          DEFAULT: '#F59E0B',   // amber-500
          light:   '#FCD34D',   // amber-300
          dark:    '#D97706',   // amber-600
          muted:   '#451A03',   // amber-950 (subtle bg tint in dark mode)
        },
        // Surface tokens — dark mode values (light mode overridden via CSS vars)
        surface: {
          bg:      '#09090B',   // zinc-950
          card:    '#18181B',   // zinc-900
          elevated:'#27272A',   // zinc-800
          border:  '#3F3F46',   // zinc-700
        },
      },
      fontFamily: {
        serif: ['Playfair Display', 'Georgia', 'serif'],
        sans:  ['Inter', 'system-ui', 'sans-serif'],
      },
      animation: {
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'fade-in':    'fadeIn 0.4s ease-out',
        'shimmer':    'shimmer 1.5s infinite',
      },
      keyframes: {
        fadeIn: {
          '0%':   { opacity: '0', transform: 'translateY(8px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        shimmer: {
          '0%':   { backgroundPosition: '-200% 0' },
          '100%': { backgroundPosition: '200% 0' },
        },
      },
    },
  },
  plugins: [],
};

export default config;
