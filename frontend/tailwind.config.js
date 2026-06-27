/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Outfit', 'system-ui', 'sans-serif'],
        serif: ['Fraunces', 'Georgia', 'serif'],
        mono: ['JetBrains Mono', 'monospace'],
      },
      colors: {
        base: '#09090b',
        surface: '#18181b',
        border: '#27272a',
        primary: '#f4f4f5',
        muted: '#71717a',
        accent: '#3b82f6',
        supported: '#2d6a4f',
        'supported-light': '#52b788',
        unverifiable: '#b8902f',
        'unverifiable-light': '#f4a42e',
        contradicted: '#9b2c2c',
        'contradicted-light': '#ef4444',
      },
    },
  },
  plugins: [],
}
