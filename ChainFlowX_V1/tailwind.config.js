export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        'cfx-dark': '#060912',
        'cfx-panel': '#0d1321',
        'cfx-border': '#1e2d4a',
        'cfx-accent': '#00d4ff',
        'cfx-warn': '#f59e0b',
        'cfx-critical': '#ef4444',
        'cfx-safe': '#10b981',
      },
      fontFamily: {
        display: ['"Space Grotesk"', 'sans-serif'],
        mono: ['"JetBrains Mono"', 'monospace'],
      },
    },
  },
  plugins: [],
};
