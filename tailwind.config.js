/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./templates/**/*.html'],
  theme: {
    extend: {
      fontFamily: {
        'playfair-display': ['Playfair Display'],
        'fira-sans': ['Fira Sans'],
      }
    },
  },
  plugins: [
    require('@tailwindcss/typography'),
  ],
}

