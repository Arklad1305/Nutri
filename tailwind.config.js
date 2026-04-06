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
          bg: '#060809',
          card: '#0d1117',
          hover: '#161b22',
          border: '#21262d',
          text: '#e6edf3',
          muted: '#7d8590',
        },
        // ── Clinical Palette ────────────────────────
        // Primary: Medical Teal — clinical, trustworthy
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
        // Accent: Warm amber — energy, calories
        accent: {
          DEFAULT: '#d97706',
          light:  '#f59e0b',
          dark:   '#b45309',
        },
        // Info: Steel blue — data, protein, hydration
        info: {
          DEFAULT: '#2563eb',
          light:  '#3b82f6',
          dark:   '#1d4ed8',
        },
        success: { DEFAULT: '#059669', light: '#10b981', dark: '#047857' },
        warning: { DEFAULT: '#d97706', light: '#f59e0b', dark: '#b45309' },
        danger:  { DEFAULT: '#dc2626', light: '#ef4444', dark: '#b91c1c' },
      },
      backgroundImage: {
        'gradient-radial': 'radial-gradient(var(--tw-gradient-stops))',
        'gradient-dark': 'linear-gradient(180deg, #060809 0%, #0d1117 100%)',
        'gradient-card': 'linear-gradient(135deg, rgba(13, 148, 136, 0.06) 0%, rgba(37, 99, 235, 0.06) 100%)',
      },
      boxShadow: {
        'glow': '0 0 20px rgba(13, 148, 136, 0.15)',
        'card': '0 1px 3px rgba(0, 0, 0, 0.4)',
        'card-hover': '0 4px 16px rgba(13, 148, 136, 0.1)',
      },
      gridTemplateColumns: {
        'auto-fit': 'repeat(auto-fit, minmax(250px, 1fr))',
      },
    },
  },
  plugins: [],
}
