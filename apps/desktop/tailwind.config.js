/** @type {import('tailwindcss').Config} */
module.exports = {
  presets: [require('@houdoku/ui/tailwind-preset')],
  content: [
    './src/renderer/index.html',
    './src/**/*.{ts,tsx,js,jsx}',
    './design-system/**/*.{html,ts,tsx}',
    '../../packages/ui/src/**/*.{ts,tsx,js,jsx}',
  ],
  plugins: [],
};
