/** @type {import('tailwindcss').Config} */
const defaultTheme = require('tailwindcss/defaultTheme')

module.exports = {
  content: ['./templates/**/*.html'],
  theme: {
    extend: {
      fontFamily: {
        'playfair-display': ['Playfair Display', ...defaultTheme.fontFamily.serif],
        'fira-sans': ['Fira Sans', ...defaultTheme.fontFamily.sans],
      },

      /**
       * Notes:
       * 1. `DEFAULT` and `minutes` are color themes, see https://tailwindcss.com/docs/typography-plugin#adding-custom-color-themes
       * 2. the default is applied to everything, and `minutes` must be used explicitly (search CSS class 'prose-minutes' to find its use)
       * 3. however it's preferred to use 'element modifiers' directly in the html if you can, see https://tailwindcss.com/docs/typography-plugin#element-modifiers
       * 4. typography internal style definitions https://github.com/tailwindlabs/tailwindcss-typography/blob/master/src/styles.js
       */
      typography: ({ theme }) => ({
        DEFAULT: {
          css: {
            '--tw-prose-bullets': theme('colors.pink[400]'),
            '--tw-prose-counters': theme('colors.pink[400]'),
            '--tw-prose-links': theme('colors.blue[600]'),
          }
        },
        minutes: {
          css: {
            h3: { '--tw-prose-links': theme('colors.black') },
            '.zola-anchor': {
              color: theme('colors.green[500]'),
              marginRight: '2px',
              textDecorationLine: 'none',
            },
            '.anchor-level-3, .anchor-level-4, .anchor-level-5, .anchor-level-6': { display: 'none' },
          }
        },
      })
    },
  },
  plugins: [
    require('@tailwindcss/typography'),
  ],
}

