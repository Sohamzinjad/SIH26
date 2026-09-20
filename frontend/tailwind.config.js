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
        sans: ['Inter', 'IBM Plex Sans', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'sans-serif'],
        mono: ['JetBrains Mono', 'IBM Plex Mono', 'Fira Code', 'Menlo', 'Monaco', 'Courier New', 'monospace'],
        display: ['Inter', 'IBM Plex Sans', 'sans-serif'],
      },
      colors: {
        trinetra: {
          bg: '#D9D9D6',
          surface: '#F1F1EF',
          card: '#EAEAE7',
          charcoal: '#232323',
          graphite: '#171717',
          border: '#B9B9B4',
          'border-dark': '#8C8C85',
          text: '#111111',
          muted: '#5E5E5E',
          success: '#00A86B',
          warning: '#D4A017',
          critical: '#D64545',
          info: '#0057B8',
        },
      },
      boxShadow: {
        'tactical': '0 1px 3px rgba(0, 0, 0, 0.1), 0 1px 2px rgba(0, 0, 0, 0.06)',
        'tactical-inset': 'inset 0 1px 2px rgba(0, 0, 0, 0.1)',
        'tactical-dark': '0 4px 12px rgba(0, 0, 0, 0.35)',
      }
    },
  },
  plugins: [],
}
