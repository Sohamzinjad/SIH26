/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'sans-serif'],
        mono: ['JetBrains Mono', 'IBM Plex Mono', 'Fira Code', 'Menlo', 'Monaco', 'Courier New', 'monospace'],
        display: ['Space Grotesk', 'Inter', 'sans-serif'],
      },
      fontSize: {
        display: ['clamp(2.75rem, 5vw, 4.25rem)', { lineHeight: '1.02', letterSpacing: '-0.025em' }],
        h1: ['clamp(2rem, 3.5vw, 2.75rem)', { lineHeight: '1.08', letterSpacing: '-0.02em' }],
        h2: ['clamp(1.375rem, 2vw, 1.75rem)', { lineHeight: '1.15', letterSpacing: '-0.015em' }],
        h3: ['1.125rem', { lineHeight: '1.3', letterSpacing: '-0.01em' }],
        body: ['0.9375rem', { lineHeight: '1.6' }],
        caption: ['0.75rem', { lineHeight: '1.5' }],
      },
      colors: {
        bg: '#0A0A0B',
        surface: {
          DEFAULT: '#121214',
          2: '#17171A',
          3: '#1D1D21',
        },
        line: 'rgba(255,255,255,0.08)',
        ink: '#F4F4F5',
        muted: '#A1A1AA',
        faint: '#71717A',
        accent: {
          DEFAULT: '#6E56FF',
          hover: '#7F6BFF',
          soft: 'rgba(110,86,255,0.14)',
        },
        crit: '#D92D20',
        high: '#F79009',
        med: '#1570EF',
        low: '#475467',
        pass: '#067647',
      },
      boxShadow: {
        'card': '0 2px 10px rgba(0,0,0,0.3)',
        'lift': '0 14px 34px rgba(0,0,0,0.4), 0 0 0 1px rgba(110,86,255,0.14)',
        'glow-accent': '0 0 24px rgba(110,86,255,0.35)',
      },
      transitionTimingFunction: {
        'agency': 'cubic-bezier(0.22, 1, 0.36, 1)',
      },
    },
  },
  plugins: [],
}
