/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        cobalt: {
          50:  '#EEF2FF',
          100: '#E0E7FF',
          500: '#4F6BDB',
          600: '#2563EB',
          700: '#1D4ED8',
          800: '#1E40AF',
        },
        coral: {
          50:  '#FFF1EE',
          100: '#FFE1D9',
          400: '#FB7260',
          500: '#F75C47',
          600: '#E04A35',
        },
        surface: '#F7F6F3',
      },
      fontFamily: {
        sans: ['-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [],
}
