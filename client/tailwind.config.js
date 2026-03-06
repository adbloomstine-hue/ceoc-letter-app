/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        navy: {
          50: '#f0f2f8',
          100: '#d9ddef',
          200: '#b3bade',
          300: '#8d98ce',
          400: '#6775bd',
          500: '#4153ad',
          600: '#34428a',
          700: '#273268',
          800: '#1a1a2e',
          900: '#0d0d17',
        },
        gold: {
          50: '#fdf8ec',
          100: '#f9edd0',
          200: '#f3dba1',
          300: '#edc972',
          400: '#e7b743',
          500: '#c9952b',
          600: '#a07722',
          700: '#78591a',
          800: '#503b11',
          900: '#281e09',
        },
      },
      fontFamily: {
        serif: ['DM Sans', 'system-ui', 'sans-serif'],
        sans: ['DM Sans', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [],
}
