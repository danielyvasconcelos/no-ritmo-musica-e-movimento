/** Paleta inspirada no GitHub (tema dark) */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        canvas: '#0d1117',
        subtle: '#161b22',
        inset: '#010409',
        overlay: '#21262d',
        line: '#30363d',
        fg: '#e6edf3',
        muted: '#8b949e',
        accent: '#2f81f7',
        brand: '#8957e5',
        'brand-fg': '#a371f7',
        danger: '#f85149',
        attention: '#d29922',
        contrib: { 0: '#161b22', 1: '#3b2a6b', 2: '#5a3ea0', 3: '#8957e5', 4: '#bc8cff' },
      },
      fontFamily: {
        sans: ['-apple-system', 'BlinkMacSystemFont', '"Segoe UI"', 'Noto Sans', 'Helvetica', 'Arial', 'sans-serif'],
        mono: ['ui-monospace', 'SFMono-Regular', 'SF Mono', 'Menlo', 'Consolas', 'monospace'],
      },
    },
  },
  plugins: [],
}
