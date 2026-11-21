/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./src/**/*.{html,ts,scss}'],
  corePlugins: {
    // O Ionic já normaliza os elementos; o preflight do Tailwind quebraria os componentes dele.
    preflight: false,
  },
  theme: {
    extend: {
      colors: {
        marca: {
          50: '#effaf8',
          100: '#d7f2ec',
          200: '#b0e4d9',
          300: '#7dcfbf',
          400: '#47b3a1',
          500: '#279887',
          600: '#1b7a6d',
          700: '#196259',
          800: '#184f49',
          900: '#17423d',
          950: '#082624',
        },
        receita: {
          50: '#ecfdf3',
          100: '#d1fadf',
          600: '#0f8a4f',
          700: '#0b6e3f',
        },
        despesa: {
          50: '#fff1f2',
          100: '#ffe0e3',
          600: '#c8344a',
          700: '#a6263b',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'Segoe UI', 'Roboto', 'sans-serif'],
      },
      boxShadow: {
        cartao: '0 1px 2px rgba(15, 23, 42, 0.04), 0 4px 16px rgba(15, 23, 42, 0.05)',
      },
    },
  },
  plugins: [],
};
