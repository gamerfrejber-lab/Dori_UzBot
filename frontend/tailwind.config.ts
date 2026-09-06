import type { Config } from 'tailwindcss'

const config: Config = {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        brand: {
          DEFAULT: '#2563EB',
          deep: '#1D4ED8',
          sea: '#06B6D4',
          ember: '#F97316',
        },
        surface: {
          DEFAULT: '#FFFFFF',
          muted: '#F6F9FD',
          bg: '#E9F0FA',
        },
        ink: {
          DEFAULT: '#0F172A',
          dim: '#5B6B82',
          faint: '#94A3B8',
        },
      },
      borderRadius: {
        xl: '22px',
        '2xl': '28px',
      },
      fontFamily: {
        sans: [
          '-apple-system', 'BlinkMacSystemFont', 'SF Pro Display',
          'Segoe UI Variable Display', 'Segoe UI', 'system-ui', 'sans-serif',
        ],
      },
    },
  },
  plugins: [],
}

export default config
