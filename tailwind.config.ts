import type { Config } from 'tailwindcss';
export default {
  content: ['./app/**/*.{js,ts,jsx,tsx,mdx}', './components/**/*.{js,ts,jsx,tsx,mdx}'],
  theme: {
    extend: {
      colors: { brand: '#d32f2f', ink: '#222927', cream: '#fbf8f3', sage: '#297a59' },
      fontFamily: { sans: ['Inter', 'Hind Siliguri', 'sans-serif'] },
      boxShadow: { soft: '0 12px 38px rgba(51, 42, 35, 0.07)' }
    }
  },
  plugins: []
} satisfies Config;
