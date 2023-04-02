# r33d.org

The website for the Public Works book club: we only read works in the public domain

## Usage
Here's how you do stuff:

`npm run build` builds once, output will be in the `public` directory
`npm run serve` starts a local server that binds to `0.0.0.0:1111`, and watches the respective directories and rebuilds upon every change.

For example, you can run `npm run serve` and then go to `localhost:1111` in your browser to see the websites. As you make changes to the code or content, the website will be updated.

## Content

Content is stored in the `content` directory. Files named `_index.md` are called "sections", and files by any other name ending in `.md` are called "pages". For more information you can read the [zola](https://getzola.com) documentation. It is written in markdown and inserted into the html via the "[template](#templates)", which is indicated on the top of the content.

## Templates

Templates are in the `templates` directory. Their purpose is to decide where in the html the content goes. The content is accessible to the template as a variable named either `section.content` or `page.content`, depending on the context.

## Styling

This website uses [tailwindcss](https://tailwindcss.com/) for most of its styling. Additional styling can be added in the `sass/input.scss` file, but usually it is not necessary to add any custom styling. This file is compiled by zola from sass into normal css, and then from there it is read by tailwind which adds whatever additional styling is referenced in the html, resulting in a file called `style.css`, which is what is used by the website.

## Dependencies and Tools

* [zola](https://getzola.com)
* [tailwindcss](https://tailwindcss.com/)

## Notes:

* The `npm run serve` script runs two long-running tasks in parallel and allows both to write simultaneously to STDOUT by using [a mixture of `wait` and sending jobs to the background](https://www.cyberciti.biz/faq/how-to-run-command-or-code-in-parallel-in-bash-shell-under-linux-or-unix/)
* Sometimes important changes for styling need to be made in the `tailwind.config.js` file