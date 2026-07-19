/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        bw: {
          c: '#E21C48',
          d: '#F36421',
          e: '#FFE011',
          f: '#8DC63F',
          g: '#009A44',
          a: '#6E4B9E',
          b: '#F04E98',
        },
      },
    },
  },
  plugins: [],
};
