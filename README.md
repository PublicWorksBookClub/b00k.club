# b00k.club

The [website](https://b00k.club) for the Public Works Book Club, where we only read works in the public domain.

- [Usage](#usage)
- [Updates](#updates)
- [Content](#content)
- [Templates](#templates)
- [Styling](#styling)
  - [Typography](#typography)
- [Dependencies and Tools](#dependencies-and-tools)
- [Deployments](#deployments)
- [Notes:](#notes)

## Usage

Here's how you do stuff:

```zsh
# installs everything that you need
npm install

# builds once, output will be in the `public` directory
# Use BUILD_OPTS to pass options to the zola build command
npm run build

# starts a local server that binds to `localhost:2665`, and watches the respective directories and rebuilds upon every change
# Use SERVE_OPTS to pass options to the zola serve command
npm run serve
```

For example, you can run ` SERVE_OPTS="--interface 0.0.0.0 --base-url 192.168.0.1" npm run serve` and then go to `localhost:2665` in your browser to see the website, as well as access from a mobile device on the same network. As you make changes to the code or content, the website will be updated.

## Updates

Any changes need to recorded in the [CHANGELOG.md](CHANGELOG.md) file, with the corresponding version number reflected in the [package.json](package.json) file.

Some notes on versioning:

- adding content to existing links is just a bump in patch version, i.e. `nn.nn.++`
- changing links, including anchors, is a bump in minor version, i.e. `nn.++.nn`
- fundamental changes in the site's tech, that makes it incompatible with prior versions is a change in major version, i.e. `++.nn.nn`

For example, releasing a huge new initiative to launch our theoretical youtube channel would be a minor version change, however keeping the site exactly the same but moving the static site generator from zola to hugo would be a major version change.

(These guidelines are subject to change 😂)

## Content

Content is stored in [markdown text](https://commonmark.org/help/) files located within the `content` directory. Files named `_index.md` are called "sections", and files by any other name ending in `.md` are called "pages". For more information you can read the [zola](https://getzola.com) documentation. It is written in markdown and inserted into the html via the "[template](#templates)", which is indicated on the top of the content.

### Bibliography

Works that have been read in the club are located under `[/content/works/](./content/works/)`. Each page within there has front matter that is designed to be read by a macro (see [macro/json-ld](./templates/macro/json-ld.html)) that then outputs [json-ld](https://en.wikipedia.org/wiki/JSON-LD). This constitutes a bibliography of abstract works that can be cited throughout other parts of the site and is meant to work as a single source of truth.

See [Demosthenes - On the Crown](./content/works/Demosthenes%20-%20On%20the%20Crown.md) as an example.

#### Controlled Vocabulary

The front matter for each of the works use common english terms such as "Ancient Greek" for language or "funeral oration" for literary form. These terms are then defined as a vocabulary under [data/vocab](./data/vocab/) where additional data and links can live. This allows common terms to be used and promotes reuse across the site.

#### Linked Data Sources

JSON-LD is designed for creating links between pieces of data representing relationships. Here are some sources that can be reused.

- [Wikidata](https://wikidata.org) - for general linked data
- [Getty Vocabularies](https://vocab.getty.edu) - for literary terms
- [Lexvo](http://www.lexvo.org/) - for languages

## Templates

Templates are in the `templates` directory. Their purpose is to decide where in the html the content goes. The content is accessible to the template as a variable named either `section.content` or `page.content`, depending on the context.

## Styling

This website uses [tailwindcss](https://tailwindcss.com/) for most of its styling. Additional styling can be added to the `css/input.css` file, but usually it is not necessary to add any custom styling. This file is read by tailwind which adds whatever additional styling is referenced in the html, resulting in a file called `style.css`, which is what is used by the website.

### Typography

The tailwind [typography plugin](https://tailwindcss.com/docs/typography-plugin) is used to style content that is generated from markdown. Any child elements that are nested within an element that has the class `prose` will receive the styling. The default styling can further be customized in the `@theme` directive located within `css/input.css`.

## Dependencies and Tools

- [zola](https://getzola.com)@0.20.0
- node@20.0.0
- [tailwindcss](https://tailwindcss.com/)@v4
- [tailwind typography plugin](https://tailwindcss.com/docs/typography-plugin)
- [prettier](https://prettier.io)

## Deployments

This site is deployed using [Cloudflare pages](https://pages.cloudflare.com). Access is granted to the project's code repository by this site's admin's Cloudflare dash. When a branch is pushed a build is triggered and a new version of the site is deployed. If the branch is the "production" branch then the new version will be deployed at [https://b00k.club](https://b00k.club), otherwise it's deployed to some throwaway branch, usually a truncated version of the version's git branch.

Here are some additional things to know about deployments

- There is a file called `_headers` which is a convention used by Cloudflare pages to set HTTP headers for the static site
- `ZOLA_VERSION=0.20.0` must be explicitly set in Cloudflare pages build settings
- There's a file, `CHANGELOG.md`, that helps track what's changed as the site evolves

## Notes:

- This site was initially generated using a [GitHub template](https://github.com/asimpletune/zola-tailwindcss) for making zola static sites that work well with tailwindcss.
- The `npm run serve` script runs two long-running tasks in parallel and allows both to write simultaneously to STDOUT by using [a mixture of `wait` and sending jobs to the background](https://www.cyberciti.biz/faq/how-to-run-command-or-code-in-parallel-in-bash-shell-under-linux-or-unix/)
- Sometimes important changes for styling need to be made in the `@theme` directive
- Builds can break when deployed, and a common place to look is needing to add or update an environment variable for Cloudflare's "pages" product
