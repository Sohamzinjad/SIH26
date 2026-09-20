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
          bg: '#D4D3CF',
          'surface-base': '#DDDDDA',
          'surface-card': '#E8E7E4',
          'surface-elevated': '#EFEEEB',
          'surface-pure': '#F7F6F3',
          'surface-white': '#FFFFFF',
          charcoal: '#1F1F1F',
          graphite: '#181818',
          'charcoal-mid': '#292929',
          border: 'rgba(0, 0, 0, 0.07)',
          'border-dark': 'rgba(255, 255, 255, 0.08)',
          text: '#171717',
          muted: '#666666',
          'muted-light': '#8E8E8E',
          success: '#00A86B',
          warning: '#D4A017',
          critical: '#D64545',
          info: '#0057B8',
        },
      },
      boxShadow: {
        'tactical-sm': '0 1px 2px rgba(0, 0, 0, 0.03)',
        'tactical-elevated': '0 2px 8px rgba(0, 0, 0, 0.04), 0 10px 30px rgba(0, 0, 0, 0.06)',
        'tactical-dark': '0 4px 20px rgba(0, 0, 0, 0.35)',
        'glow-green': '0 0 12px rgba(0, 168, 107, 0.3)',
        'glow-red': '0 0 12px rgba(214, 69, 69, 0.35)',
      }
    },
  },
  plugins: [],
}
