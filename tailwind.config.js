/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./src/**/*.{js,jsx,ts,tsx}', './public/index.html'],
  theme: {
    extend: {
      colors: {
        ctrl: {
          bg: '#050508',
          bg2: '#08080f',
          bg3: '#0d0d18',
          panel: '#0f0f1a',
          panel2: '#141428',
          panel3: '#191932',
          border: '#1a1a30',
          border2: '#222240',
          accent: '#2A6BFF',
          accent2: '#1a4fd4',
          text: '#eaeaf5',
          text2: '#b0b0cc',
          text3: '#8888a8',
          danger: '#ff3366',
          success: '#00e5a0',
          warning: '#ffb800',
          info: '#00c9ff',
        },
      },
      fontFamily: {
        sans: ['Montserrat', 'sans-serif'],
        mono: ['JetBrains Mono', 'monospace'],
      },
      keyframes: {
        fadeIn: {
          from: { opacity: '0', transform: 'translateY(8px)' },
          to: { opacity: '1', transform: 'translateY(0)' },
        },
        slideIn: {
          from: { opacity: '0', transform: 'translateX(-12px)' },
          to: { opacity: '1', transform: 'translateX(0)' },
        },
        pulse: {
          '0%, 100%': { opacity: '1' },
          '50%': { opacity: '0.4' },
        },
        glow: {
          '0%, 100%': { boxShadow: '0 0 8px rgba(42,107,255,0.3)' },
          '50%': { boxShadow: '0 0 20px rgba(42,107,255,0.6)' },
        },
        glitch: {
          '0%': { clipPath: 'inset(0 0 98% 0)', transform: 'translate(-2px, 0)' },
          '20%': { clipPath: 'inset(30% 0 50% 0)', transform: 'translate(2px, 0)' },
          '40%': { clipPath: 'inset(60% 0 20% 0)', transform: 'translate(-1px, 0)' },
          '60%': { clipPath: 'inset(80% 0 5% 0)', transform: 'translate(1px, 0)' },
          '80%': { clipPath: 'inset(10% 0 80% 0)', transform: 'translate(-2px, 0)' },
          '100%': { clipPath: 'inset(0 0 98% 0)', transform: 'translate(0, 0)' },
        },
        badgePop: {
          '0%': { transform: 'scale(0)' },
          '70%': { transform: 'scale(1.2)' },
          '100%': { transform: 'scale(1)' },
        },
        shimmer: {
          '0%': { backgroundPosition: '-200% 0' },
          '100%': { backgroundPosition: '200% 0' },
        },
        slideUp: {
          from: { transform: 'translateY(100%)' },
          to: { transform: 'translateY(0)' },
        },
      },
      animation: {
        'fade-in': 'fadeIn 0.3s ease forwards',
        'slide-in': 'slideIn 0.25s ease forwards',
        'pulse-slow': 'pulse 1.5s infinite',
        glow: 'glow 2s infinite',
        glitch: 'glitch 4s infinite',
        'badge-pop': 'badgePop 0.3s ease',
        'slide-up': 'slideUp 0.3s cubic-bezier(0.4,0,0.2,1)',
      },
    },
  },
  plugins: [],
}
