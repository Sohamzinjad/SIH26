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
        mono: ['JetBrains Mono', 'Fira Code', 'Menlo', 'Monaco', 'Courier New', 'monospace'],
      },
      colors: {
        pinecone: {
          bg: '#0A0C0F',
          canvas: '#0F1115',
          surface: '#14161C',
          'surface-hover': '#1A1D24',
          card: '#12141A',
          'card-elevated': '#1B1E26',
          border: '#22262F',
          'border-light': '#2C313B',
          brand: '#00E58C',
          electric: '#0FA96E',
          cyan: '#22D3EE',
          emerald: '#00E58C',
          amber: '#F5B94C',
          rose: '#F76B5E',
          text: '#F4F6FB',
          muted: '#9AA2B0',
          subtle: '#5D6573',
        },
        dark: {
          900: '#0A0C0F',
          800: '#14161C',
          700: '#1B1E26',
          600: '#262B35',
          500: '#363C49',
        },
        navy: {
          900: '#0A0C10',
          800: '#101319',
          700: '#1B1F29'
        },
        cyber: {
          green: '#00E58C',
          red: '#F76B5E',
          orange: '#F5B94C',
          blue: '#5B8DEF',
          cyan: '#22D3EE'
        }
      },
      boxShadow: {
        'pinecone': '0 1px 2px rgba(0, 0, 0, 0.4), 0 1px 3px rgba(0, 0, 0, 0.2)',
        'pinecone-glow': '0 0 24px -6px rgba(0, 229, 140, 0.28)',
        'pinecone-glow-emerald': '0 0 24px -6px rgba(0, 229, 140, 0.28)',
      }
    },
  },
  plugins: [],
}
