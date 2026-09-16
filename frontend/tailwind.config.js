/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        dark: {
          900: '#0b0f17',
          800: '#111827',
          700: '#1f2937',
          600: '#374151',
        },
        navy: {
          900: '#0a192f',
          800: '#172a45',
          700: '#203a61'
        },
        cyber: {
          green: '#10b981',
          red: '#ef4444',
          orange: '#f59e0b',
          blue: '#3b82f6',
          cyan: '#06b6d4'
        }
      }
    },
  },
  plugins: [],
}
