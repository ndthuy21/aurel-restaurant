import type { Config } from 'tailwindcss';
export default {
  content: ['./src/**/*.{ts,tsx}'],
  theme: { extend: { colors: { gold: '#c5a779' } } },
  plugins: [],
} satisfies Config;
