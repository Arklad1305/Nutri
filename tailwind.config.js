export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      fontFamily: {
        sans: ['DM Sans', 'sans-serif'],
      },
      colors: {
        dark: {
          bg: '#0a0a0a',
          card: '#111111',
          hover: '#1a1a1a',
          border: '#1e1e1e',
          text: '#f5f5f5',
          muted: '#737373',
        },
        primary: {
          DEFAULT: '#0d9488',
          50:  '#f0fdfa',
          100: '#ccfbf1',
          200: '#99f6e4',
          300: '#5eead4',
          400: '#2dd4bf',
          500: '#0d9488',
          600: '#0f766e',
          700: '#115e59',
          800: '#134e4a',
          900: '#042f2e',
          hover: '#0f766e',
        },
        accent: {
          DEFAULT: '#d97706',
          light:  '#f59e0b',
          dark:   '#b45309',
        },
      },
      boxShadow: {
        'card': '0 1px 2px rgba(0, 0, 0, 0.3)',
        'card-hover': '0 2px 8px rgba(0, 0, 0, 0.4)',
      },
    },
  },
  plugins: [],
}
