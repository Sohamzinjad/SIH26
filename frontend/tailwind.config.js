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
          bg: '#0D0E12',
          canvas: '#111319',
          surface: '#151821',
          'surface-hover': '#1B1E2B',
          card: '#161924',
          'card-elevated': '#1D2130',
          border: '#232736',
          'border-light': '#2D3245',
          brand: '#4F46E5',
          electric: '#2563EB',
          cyan: '#06B6D4',
          emerald: '#10B981',
          amber: '#F59E0B',
          rose: '#EF4444',
          text: '#F1F3F9',
          muted: '#8D95AB',
          subtle: '#586076',
        },
        dark: {
          900: '#0D0E12',
          800: '#151821',
          700: '#1D2130',
          600: '#2A2F42',
          500: '#3D445D',
        },
        navy: {
          900: '#0B0F19',
          800: '#111827',
          700: '#1E293B'
        },
        cyber: {
          green: '#10B981',
          red: '#EF4444',
          orange: '#F59E0B',
          blue: '#3B82F6',
          cyan: '#06B6D4'
        }
      },
      boxShadow: {
        'pinecone': '0 4px 20px -2px rgba(0, 0, 0, 0.5), 0 2px 6px -1px rgba(0, 0, 0, 0.4)',
        'pinecone-glow': '0 0 25px -5px rgba(59, 130, 246, 0.25)',
        'pinecone-glow-emerald': '0 0 25px -5px rgba(16, 185, 129, 0.25)',
      }
    },
  },
  plugins: [],
}
