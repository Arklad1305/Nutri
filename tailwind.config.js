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
          bg: '#050505',
          card: '#0c0c0c',
          hover: '#161616',
          border: '#1e1e1e',
          text: '#f0f0f0',
          muted: '#6b7280',
        },
        // ── Health Palette ──────────────────────────
        // Primary: Emerald — health, vitality, growth
        primary: {
          DEFAULT: '#10b981',
          50:  '#ecfdf5',
          100: '#d1fae5',
          200: '#a7f3d0',
          300: '#6ee7b7',
          400: '#34d399',
          500: '#10b981',
          600: '#059669',
          700: '#047857',
          800: '#065f46',
          900: '#064e3b',
          hover: '#059669',
        },
        // Accent: Amber — energy, calories, warmth
        accent: {
          DEFAULT: '#f59e0b',
          light:  '#fbbf24',
          dark:   '#d97706',
        },
        // Info: Blue — protein, hydration, data
        info: {
          DEFAULT: '#3b82f6',
          light:  '#60a5fa',
          dark:   '#2563eb',
        },
        // Success / Warning / Danger — semantic only
        success: {
          DEFAULT: '#10b981',
          light: '#34d399',
          dark: '#059669',
        },
        warning: {
          DEFAULT: '#f59e0b',
          light: '#fbbf24',
          dark: '#d97706',
        },
        danger: {
          DEFAULT: '#ef4444',
          light: '#f87171',
          dark: '#dc2626',
        },
      },
      backgroundImage: {
        'gradient-radial': 'radial-gradient(var(--tw-gradient-stops))',
        'gradient-conic': 'conic-gradient(from 180deg at 50% 50%, var(--tw-gradient-stops))',
        'gradient-health': 'linear-gradient(135deg, #10b981 0%, #3b82f6 100%)',
        'gradient-energy': 'linear-gradient(135deg, #f59e0b 0%, #10b981 100%)',
        'gradient-dark': 'linear-gradient(180deg, #050505 0%, #0c0c0c 100%)',
        'gradient-card': 'linear-gradient(135deg, rgba(16, 185, 129, 0.08) 0%, rgba(59, 130, 246, 0.08) 100%)',
      },
      boxShadow: {
        'glow': '0 0 20px rgba(16, 185, 129, 0.2)',
        'glow-accent': '0 0 20px rgba(245, 158, 11, 0.2)',
        'card': '0 4px 20px rgba(0, 0, 0, 0.5)',
        'card-hover': '0 8px 30px rgba(16, 185, 129, 0.15)',
      },
      gridTemplateColumns: {
        'auto-fit': 'repeat(auto-fit, minmax(250px, 1fr))',
      },
    },
  },
  plugins: [],
}
