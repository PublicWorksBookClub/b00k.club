/** @type {import('tailwindcss').Config} */
const defaultTheme = require('tailwindcss/defaultTheme')

module.exports = {
  content: ['./templates/**/*.html', './content/**/*.md'],
  theme: {
    extend: {
      fontFamily: {
        'playfair-display': ['Playfair Display', ...defaultTheme.fontFamily.serif],
        'fira-sans': ['Fira Sans', ...defaultTheme.fontFamily.sans],
        'arca-majora': ['Arca Majora', ...defaultTheme.fontFamily.sans],
      },
      colors: {
        'attic': {
          'black': {
            '500': 'rgb(70, 60, 51)',
            '600': 'rgb(60, 52, 53)',
            '700': 'rgb(47, 41, 41)',
            '800': 'rgb(34, 32, 37)',
            '900': 'rgb(19, 18, 23)',
            '950': 'rgb(11, 12, 7)',
          },
          'red': {
            '50': 'rgb(242, 214, 173)',
            '100': 'rgb(214, 177, 131)',
            '200': 'rgb(216, 150, 100)',
            '300': 'rgb(231, 132, 70)',
            '400': 'rgb(192, 115, 51)',
            '500': 'rgb(161, 105, 80)',
            '600': 'rgb(150, 90, 60)',
            '700': 'rgb(131, 77, 53)',
            '800': 'rgb(130, 60, 39)',
            '900': 'rgb(92, 46, 45)',
          },
          'gray': {
            '50': 'rgb(248, 249, 252)',
            '100': 'rgb(250, 241, 227)',
            '200': 'rgb(240, 212, 195)',
            '300': 'rgb(178, 171, 171)',
          }
        }
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
            '--tw-prose-bullets': theme('colors.slate[950]'),
            '--tw-prose-counters': theme('colors.slate[950]'),
            '--tw-prose-links': theme('colors.blue[600]'),
          }
        },
        landing: {
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
        attic: {
          css: {
            '--tw-prose-bullets': theme('colors.red[500]'),
            '--tw-prose-counters': theme('colors.red[500]'),
            '--tw-prose-links': theme('colors.attic.black[900]'),
          }
        }
      })
    },
  },
  plugins: [
    require('@tailwindcss/typography'),
  ],
}

