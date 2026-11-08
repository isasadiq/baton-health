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
        baton: {
          blue: '#1E40AF',
          amber: '#D97706',
          emerald: '#059669',
          rose: '#E11D48',
          slate: '#0F172A',
        }
      }
    },
  },
  plugins: [],
}
