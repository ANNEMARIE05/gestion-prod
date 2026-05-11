/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{html,ts}",
  ],
  theme: {
    extend: {
      colors: {
        'brand-dark': '#0f172a',
        'brand-accent': '#2563eb', // Atypical blue
        'brand-neon': '#38bdf8',   // Electric sky blue
        'brand-surface': '#f8fafc',
        primary: {
          light: '#60a5fa',
          DEFAULT: '#2563eb',
          dark: '#1d4ed8',
        },
        secondary: {
          light: '#fb7185',
          DEFAULT: '#f43f5e',
          dark: '#e11d48',
        }
      },
      borderRadius: {
        '2xl': '1.25rem',
        '3xl': '1.5rem',
        '4xl': '2rem',
      },
      boxShadow: {
        'premium': '0 10px 40px -10px rgba(0, 0, 0, 0.05)',
        'accent': '0 10px 20px -5px rgba(37, 99, 235, 0.24)',
      }
    },
  },
  plugins: [],
}
