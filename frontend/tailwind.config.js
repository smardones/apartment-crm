/** @type {import('tailwindcss').Config} */
export default {
  content: [
    './index.html',
    './src/**/*.{js,ts,jsx,tsx}'
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          50: '#f0f3ff',
          100: '#e1e7ff',
          200: '#c8d4ff',
          300: '#a3b7ff',
          400: '#7991ff',
          500: '#4e65ff',
          600: '#3c43ff',
          700: '#3232eb',
          800: '#2828be',
          900: '#232396',
          950: '#14145a'
        }
      }
    }
  },
  plugins: []
};
