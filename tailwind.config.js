/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          50: '#F0F9F4',
          100: '#E4F3E9',
          200: '#C2E4D0',
          500: '#176B4D',
          600: '#13583E',
          700: '#0F4E37',
          800: '#0B3A29',
          900: '#07261B',
          DEFAULT: '#176B4D',
        },
        surface: {
          bg: '#F7F8F5',
          card: '#FFFFFF',
          muted: '#E8ECE8',
          hover: '#EFF3F0',
          border: '#D9E0DA',
        },
        charcoal: {
          DEFAULT: '#202522',
          muted: '#66716A',
          subtle: '#8E9991',
        },
        status: {
          positive: '#176B4D',
          positiveBg: '#E4F3E9',
          positiveText: '#10523A',
          amber: '#F4B942',
          amberBg: '#FEF7E6',
          amberText: '#875B00',
          red: '#C64545',
          redBg: '#FDECEB',
          redText: '#922626',
          stale: '#66716A',
          staleBg: '#EDF1EE',
        }
      },
      fontFamily: {
        sans: ['"Plus Jakarta Sans"', 'Inter', 'system-ui', '-apple-system', 'sans-serif'],
      },
      boxShadow: {
        'sheet': '0 -4px 24px -4px rgba(32, 37, 34, 0.12), 0 -2px 8px -2px rgba(32, 37, 34, 0.06)',
        'float': '0 8px 30px rgba(23, 107, 77, 0.15), 0 3px 10px rgba(0, 0, 0, 0.08)',
        'card': '0 1px 4px rgba(32, 37, 34, 0.06), 0 2px 12px rgba(32, 37, 34, 0.04)',
      },
      borderRadius: {
        '2xl': '1.25rem',
        '3xl': '1.75rem',
      }
    },
  },
  plugins: [],
}
