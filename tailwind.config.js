export default {content: [
  './index.html',
  './src/**/*.{js,ts,jsx,tsx}'
],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', 'ui-sans-serif', 'system-ui', 'sans-serif'],
        mono: ['"JetBrains Mono"', 'ui-monospace', 'SFMono-Regular', 'monospace'],
      },
      colors: {
        navy: {
          DEFAULT: '#0f172a',
          800: '#1a2436',
          700: '#243044',
          600: '#334155',
        },
        canvas: '#f8fafc',
        hairline: '#e5e7eb',
        brand: {
          DEFAULT: '#2563eb',
          light: '#3b82f6',
          soft: '#eff6ff',
        },
        ok: { DEFAULT: '#22c55e', soft: '#f0fdf4' },
        warn: { DEFAULT: '#f59e0b', soft: '#fffbeb' },
        danger: { DEFAULT: '#ef4444', soft: '#fef2f2' },
        offline: { DEFAULT: '#9ca3af', soft: '#f3f4f6' },
        pm: { DEFAULT: '#7c3aed', soft: '#f5f3ff' },
      },
      borderRadius: {
        card: '12px',
      },
      boxShadow: {
        card: '0 1px 2px 0 rgba(16, 24, 40, 0.04), 0 1px 3px 0 rgba(16, 24, 40, 0.06)',
        pop: '0 12px 32px -8px rgba(16, 24, 40, 0.18)',
      },
    },
  },
}
