export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        'cfx-dark':     '#060a0f',
        'cfx-panel':    '#0b1118',
        'cfx-surface':  '#111820',
        'cfx-border':   '#1e2d3d',
        'cfx-accent':   '#00d4ff',
        'cfx-accent2':  '#ff6b35',
        'cfx-green':    '#00ff88',
        'cfx-amber':    '#ffb800',
        'cfx-warn':     '#ffb800',
        'cfx-critical': '#ff3b3b',
        'cfx-safe':     '#00ff88',
        'cfx-muted':    '#5a7a8a',
        'cfx-text':     '#e8f4f8',
      },
      fontFamily: {
        display: ['"Space Mono"', 'monospace'],
        mono:    ['"Space Mono"', 'monospace'],
        sans:    ['"DM Sans"', 'sans-serif'],
      },
    },
  },
  plugins: [],
};
