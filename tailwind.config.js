export default {
  darkMode: 'class',
  content: [
    './index.html',
    './src/**/*.{js,ts,jsx,tsx}'
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', '-apple-system', 'BlinkMacSystemFont', '"SF Pro Display"', '"SF Pro Text"', 'ui-sans-serif', 'system-ui', 'sans-serif'],
        mono: ['"JetBrains Mono"', '"SF Mono"', 'ui-monospace', 'monospace'],
      },
      colors: {
        charcoal: {
          DEFAULT: '#111315',
          950: '#090A0C', // Primary background
          900: '#111315', // Secondary background
          850: '#14171A',
          800: '#181A1D', // Elevated background
          700: '#22252A',
          600: '#2C3036',
          500: '#3E434B',
          400: '#71717A', // Muted text
          300: '#A1A1AA', // Secondary text
          100: '#F5F5F5', // Primary text
        },
        navy: {
          DEFAULT: '#0f172a',
          950: '#090A0C',
          900: '#111315',
          800: '#181A1D',
          700: '#22252A',
          600: '#2C3036',
        },
        canvas: '#f6f8fc',
        hairline: 'rgba(226, 232, 240, 0.7)',
        glass: {
          border: 'rgba(255, 255, 255, 0.75)',
          'border-subtle': 'rgba(255, 255, 255, 0.45)',
          'border-dark': 'rgba(255, 255, 255, 0.12)',
          surface: 'rgba(255, 255, 255, 0.72)',
          'surface-hover': 'rgba(255, 255, 255, 0.85)',
          panel: 'rgba(255, 255, 255, 0.82)',
          card: 'rgba(255, 255, 255, 0.65)',
          dark: 'rgba(17, 19, 21, 0.80)',
          'dark-surface': 'rgba(255, 255, 255, 0.06)',
          'dark-elevated': 'rgba(255, 255, 255, 0.09)',
          'dark-active': 'rgba(22, 131, 255, 0.16)',
          'dark-floating': 'rgba(255, 255, 255, 0.11)',
        },
        brand: {
          DEFAULT: '#1683FF', // Signature Charcoal-Blue accent
          light: '#5AA9FF',
          dark: '#0066DB',
          soft: 'rgba(22, 131, 255, 0.12)',
        },
        blue: {
          primary: '#1683FF',
          light: '#5AA9FF',
          soft: '#8CC5FF',
          glass: 'rgba(22, 131, 255, 0.16)',
          border: 'rgba(22, 131, 255, 0.35)',
        },
        ok: { DEFAULT: '#34c759', soft: 'rgba(52, 199, 89, 0.1)' },
        warn: { DEFAULT: '#ff9500', soft: 'rgba(255, 149, 0, 0.1)' },
        danger: { DEFAULT: '#ff3b30', soft: 'rgba(255, 59, 48, 0.1)' },
        offline: { DEFAULT: '#8e8e93', soft: 'rgba(142, 142, 147, 0.1)' },
        pm: { DEFAULT: '#af52de', soft: 'rgba(175, 82, 222, 0.1)' },
      },
      borderRadius: {
        card: '18px',
        '2xl': '20px',
        '3xl': '24px',
        '4xl': '32px',
      },
      boxShadow: {
        glass: '0 8px 32px 0 rgba(31, 38, 135, 0.07), inset 0 1px 0 0 rgba(255, 255, 255, 0.9)',
        'glass-hover': '0 14px 40px 0 rgba(31, 38, 135, 0.12), inset 0 1px 0 0 rgba(255, 255, 255, 1)',
        'glass-dark': '0 12px 36px 0 rgba(0, 0, 0, 0.35), inset 0 1px 0 0 rgba(255, 255, 255, 0.08)',
        'glass-modal': '0 25px 60px -12px rgba(15, 23, 42, 0.25), 0 0 1px 1px rgba(255, 255, 255, 0.8), inset 0 1px 0 0 rgba(255, 255, 255, 1)',
        'glass-button': '0 4px 14px 0 rgba(22, 131, 255, 0.35), inset 0 1px 0 0 rgba(255, 255, 255, 0.4)',
        'blue-glow': '0 0 24px rgba(22, 131, 255, 0.18)',
        card: '0 4px 20px -2px rgba(15, 23, 42, 0.05), inset 0 1px 0 0 rgba(255, 255, 255, 0.8)',
        pop: '0 20px 45px -10px rgba(15, 23, 42, 0.2)',
      },
      backdropBlur: {
        xs: '2px',
        '2xl': '24px',
        '3xl': '32px',
      }
    },
  },
}
