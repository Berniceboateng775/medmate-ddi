
// tailwind.config.js
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        'brand-primary': '#3F2353',
        'brand-dark': '#2D1B3B',
        brand: {
          primary: '#4B2C5E',
          accent: '#FAFAFA',
          muted: '#E5E7EB',
        },
      },
    },
  },
  plugins: [],
}
