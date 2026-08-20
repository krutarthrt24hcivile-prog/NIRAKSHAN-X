import forms from '@tailwindcss/forms';
/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: { extend: { colors: { navy: '#00367a', gov: '#0754a4' } } },
  plugins: [forms]
};
