# b00k.club

The [website](https://b00k.club) for the Public Works Book Club, where we only read works in the public domain.

<!-- TOC depthfrom:2 updateonsave:true -->

- [Usage](#usage)
- [Updates](#updates)
- [Content](#content)
- [Templates](#templates)
- [Styling](#styling)
  - [Typography](#typography)
- [Dependencies and Tools](#dependencies-and-tools)
- [Deployments](#deployments)
- [Notes:](#notes)

<!-- /TOC -->

## Usage
Here's how you do stuff:

- `npm install`   installs everything that you need
- `npm run build` builds once, output will be in the `public` directory
- `npm run build-deploy` the build command that's only used programmatically during deployment (e.g. called from within cloudflare's pages platform)
- `npm run serve` starts a local server that binds to `0.0.0.0:1111`, and watches the respective directories and rebuilds upon every change.

For example, you can run `npm run serve` and then go to `localhost:1111` in your browser to see the websites. As you make changes to the code or content, the website will be updated.

## Updates

Any changes need to recorded in the [CHANGELOG.md](CHANGELOG.md) file, with the corresponding version number reflected in the [package.json](package.json) file.

Some notes on versioning:

* adding content to existing links is just a bump in patch version, i.e. `nn.nn.++`
* changing links, including anchors, is a bump in minor version, i.e. `nn.++.nn`
* fundamental changes in the site's tech, that makes it incompatible with prior versions is a change in major version, i.e. `++.nn.nn`

For example, releasing a huge new initiative to launch our theoretical youtube channel would be a minor version change, however keeping the site exactly the same but moving the static site generator from zola to hugo would be a major version change.

(These guidelines are subject to change 😂)

## Content

Content is stored in [markdown text](https://commonmark.org/help/) files located within the `content` directory. Files named `_index.md` are called "sections", and files by any other name ending in `.md` are called "pages". For more information you can read the [zola](https://getzola.com) documentation. It is written in markdown and inserted into the html via the "[template](#templates)", which is indicated on the top of the content.

## Templates

Templates are in the `templates` directory. Their purpose is to decide where in the html the content goes. The content is accessible to the template as a variable named either `section.content` or `page.content`, depending on the context.

## Styling

This website uses [tailwindcss](https://tailwindcss.com/) for most of its styling. Additional styling can be added in the `sass/input.scss` file, but usually it is not necessary to add any custom styling. This file is compiled by zola from sass into normal css, and then from there it is read by tailwind which adds whatever additional styling is referenced in the html, resulting in a file called `style.css`, which is what is used by the website.

### Typography

The tailwind [typography plugin](https://tailwindcss.com/docs/typography-plugin) is used to style content that is generated from markdown. Any child elements that are nested within an element that has the class `prose` will receive the styling. The default styling can further be customized in the `tailwind.config.js` file.

## Dependencies and Tools

* [zola](https://getzola.com)@0.17.2
* node@14.0.0
* [tailwindcss](https://tailwindcss.com/)
* [tailwind typography plugin](https://tailwindcss.com/docs/typography-plugin)

## Deployments

This site is deployed using [cloudflare pages](https://pages.cloudflare.com). Access is granted to the project's code repository by this site's admin's cloudflare dash. When a branch is pushed a build is triggered and a new version of the site is deployed. If the branch is the "production" branch then the new version will be deployed at [https://b00k.club](https://b00k.club), otherwise it's deployed to some throwaway branch, usually a truncated version of the version's git branch.

Here are some additional things to know about deployments

* There is a file called `_headers` which is a convention used by cloudflare pages to set HTTP headers for the static site
* `ZOLA_VERSION=0.17.2` must be explicitly set in cloudflare pages build settings
* `NODE_VERSION=14.0.0` must be explicitly set in cloudflare pages build settings
* There is a `BUILD_OPTS` env variable in the `package.json`'s `build-deploy` script, where customizations can be passed, e.g. `BUILD_OPTS="--base-url https://b00k.club"
* Cloudflare supplies an environment variable called `CF_PAGES_URL`, and this is needed when deploying
* There's a file, `CHANGELOG.md`, that helps track what's changed as the site evolves

## Notes:

* This site was initially generated using a [GitHub template](https://github.com/asimpletune/zola-tailwindcss) for making zola static sites that work well with tailwindcss.
* The `npm run serve` script runs two long-running tasks in parallel and allows both to write simultaneously to STDOUT by using [a mixture of `wait` and sending jobs to the background](https://www.cyberciti.biz/faq/how-to-run-command-or-code-in-parallel-in-bash-shell-under-linux-or-unix/)
* Sometimes important changes for styling need to be made in the `tailwind.config.js` file
* Builds can break when deployed, and a common place to look is needing to add or update an enviornment variable for cloudflare's "pages" product