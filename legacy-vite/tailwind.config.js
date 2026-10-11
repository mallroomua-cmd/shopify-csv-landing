/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        dune: {
          black: '#111111',
          pure: '#000000',
          ochre: '#A77A06',
          'ochre-light': '#FBF6E9',
          yellow: '#DEC400',
          surface: '#F5F5F5',
          'surface-alt': '#EFEFEF',
          border: '#E5E5E5',
          'border-dark': '#222222',
          muted: '#737373',
          gray: '#555555',
        },
        brand: {
          50: '#f8fafc',
          100: '#f1f5f9',
          200: '#e2e8f0',
          300: '#cbd5e1',
          400: '#94a3b8',
          500: '#111111',
          600: '#000000',
          700: '#000000',
          800: '#000000',
          900: '#000000',
        },
        accent: {
          50: '#fefce8',
          100: '#fef9c3',
          200: '#fef08a',
          300: '#fde047',
          400: '#eab308',
          500: '#A77A06',
          600: '#8a6404',
          700: '#6c4e02',
          800: '#503901',
          900: '#382701',
        }
      },
      fontFamily: {
        mono: ['"IBM Plex Mono"', 'SF Mono', 'Menlo', 'Consolas', 'monospace'],
        display: ['Unbounded', 'sans-serif'],
        heading: ['Unbounded', 'sans-serif'],
        sans: ['"IBM Plex Sans"', 'system-ui', '-apple-system', 'sans-serif'],
      },
      boxShadow: {
        'dune-card': '0 1px 3px rgba(0, 0, 0, 0.05)',
        'dune-hover': '0 8px 24px -4px rgba(0, 0, 0, 0.08)',
        'premium': '0 10px 30px -10px rgba(15, 23, 42, 0.08)',
        'premium-hover': '0 20px 40px -15px rgba(15, 23, 42, 0.12)',
      },
      animation: {
        'marquee': 'marquee 30s linear infinite',
        'marquee-fast': 'marquee 18s linear infinite',
        'pulse-subtle': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'fade-in': 'fadeIn 0.25s ease-out',
      },
      keyframes: {
        marquee: {
          '0%': { transform: 'translateX(0%)' },
          '100%': { transform: 'translateX(-50%)' },
        },
        fadeIn: {
          '0%': { opacity: '0', transform: 'scale(0.99)' },
          '100%': { opacity: '1', transform: 'scale(1)' },
        },
      }
    },
  },
  plugins: [],
}
