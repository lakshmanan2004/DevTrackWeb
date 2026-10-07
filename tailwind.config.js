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
        navy: {
          DEFAULT: '#0f172a',
          950: '#030712',
          900: '#0f172a',
          800: '#1e293b',
          700: '#334155',
          600: '#475569',
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
          dark: 'rgba(15, 23, 42, 0.75)',
        },
        brand: {
          DEFAULT: '#0071e3', // Apple signature blue
          light: '#2997ff',
          dark: '#0051a8',
          soft: 'rgba(0, 113, 227, 0.08)',
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
        'glass-dark': '0 12px 36px 0 rgba(0, 0, 0, 0.25), inset 0 1px 0 0 rgba(255, 255, 255, 0.15)',
        'glass-modal': '0 25px 60px -12px rgba(15, 23, 42, 0.25), 0 0 1px 1px rgba(255, 255, 255, 0.8), inset 0 1px 0 0 rgba(255, 255, 255, 1)',
        'glass-button': '0 4px 14px 0 rgba(0, 113, 227, 0.35), inset 0 1px 0 0 rgba(255, 255, 255, 0.4)',
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
