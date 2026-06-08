/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx}",
    "./components/**/*.{js,ts,jsx,tsx}",
    "./app/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        // Fuente display editorial (Fraunces) para títulos de la landing.
        display: ['var(--font-display)', 'ui-serif', 'Georgia', 'Cambria', '"Times New Roman"', 'serif'],
      },
      colors: {
        // Índigo refinado de CuentIA: menos eléctrico/saturado que el default de
        // Tailwind (#4f46e5) — más "tinta", se siente elegido y no de plantilla.
        indigo: {
          50:  '#f1f2f9',
          100: '#e3e5f3',
          200: '#c9ccea',
          300: '#a6aadb',
          400: '#8184c4',
          500: '#6063ab',
          600: '#4d4f95',
          700: '#3f407a',
          800: '#353563',
          900: '#2d2d52',
          950: '#1b1b34',
        },
      },
    },
  },
  plugins: [],
}
