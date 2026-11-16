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
        success: '#238636',
        'success-fg': '#3fb950',
        danger: '#f85149',
        attention: '#d29922',
        contrib: { 0: '#161b22', 1: '#0e4429', 2: '#006d32', 3: '#26a641', 4: '#39d353' },
      },
      fontFamily: {
        sans: ['-apple-system', 'BlinkMacSystemFont', '"Segoe UI"', 'Noto Sans', 'Helvetica', 'Arial', 'sans-serif'],
        mono: ['ui-monospace', 'SFMono-Regular', 'SF Mono', 'Menlo', 'Consolas', 'monospace'],
      },
    },
  },
  plugins: [],
}
