# r3ply-zola-theme
A Zola theme that adds comments to static websites.

## Installation

First, clone the theme into a directory named `r3ply` within your Zola website's `themes` directory, e.g.

```
# from within your project's root directory
git clone https://github.com/r3ply/r3ply-zola-theme.git themes/r3ply
```

Then, add the theme to the top of your zola config file

```toml
theme="r3ply"
```

Also add the required taxonomies to your zola config file:

```toml
###############################
#### Begin r3ply taxonomy #####
###############################

[[taxonomies]]
name = "commenters"
feed = true

[[taxonomies]]
name = "subjects"
feed = true

[[taxonomies]]
name = "threads"
feed = false

[[taxonomies]]
name = "replies"
feed = true

###############################
##### End r3ply taxonomy ######
###############################
```

Finally, copy over the `comments` directory from the theme to your site's content directory.

```
cp -r themes/r3ply/content/comments content
```

Next see [setting up r3ply](#setting-up-r3ply-for-your-project).

## Setting up r3ply for your project

(_Make sure you've [installed](#installation) the theme. See above._)

First, install the r3ply CLI.

```
# install r3ply cli tool
npm install -g @r3ply/cli
```

Then initialize your project with r3ply.

```
# initialize r3ply at project root
re init
```

Then copy this config to your project at `static/r3ply.config.toml`:

```toml
#:schema https://r3ply.com/schemas/v0.0.1/config/site.v0.0.1.json
version = "0.0.1"
enabled = true

[[site]]
domain = "site.local.test"
r3ply = "cli.r3ply.test"
signet = "A2hioZg5Y-YnjzgOgs4bQw"
issued = 2026-06-21
label = "CLI"

[comments]
"paths*" = ["!/", "!{,/}comments{,/}"]

[comments.email]
enabled = true
"&comment_{}" = "comment.template.md"

[moderation]
enabled = true
github = [ ]
webhook = [ ]

  [[moderation.local]]
  "file_path_{}" = "content/comments/{{ comment.ts_rcvd }}_{{ comment.id[:8] }}-{{ author.pseudonym[:7] }}.md"
  enabled = true
```

Then set your config as the default.

```
# set config as default
re config set-default static/r3ply.config.toml
```

Finally, add this r3ply comment template to static/comment.template.md.

```toml
+++
title = {{ comment.txt[:120] | trim | json_encode }}
authors = {{ [author.pseudonym] | str }}
date = {{ email.date }}
slug = {{ comment.id[:8] | json_encode }}

[taxonomies]
# groups comments by author
commenters = {{ [author.pseudonym[:7]] | str }}
# groups comments by subject
subjects = {{ [comment.subject.path[1:-1] if comment.subject.path is ending_with(pat="/") else comment.subject.path[1:]] | str }}
# groups comments by thread (the thread is the comment + its replies, and their replies, etc...)
# "all" is a special thread of all comments (used mainly because each tax. term generates an RSS feed)
threads = {{ [comment.id[:8]] | str }}

# used to groups comments by replies (i.e. a comments direct children)
# first member is always itself, so that an RSS feed is guaranteed to exist
# second member is optionally a parent comment, i.e. this comment is replying to it
replies = {{ [comment.id[:8], ...([comment.subject.fragment[1:9]] if (comment.subject.fragment and comment.subject.fragment[:8] != "#:~:text") else [])] | str }}

[extra.email]
dkim = {{ email.auth.dkim }}
dmarc = {{ email.auth.dmarc }}
spf = {{ email.auth.spf }}

[extra.comment]
document = {{ (comment.subject.path[1:-1] if comment.subject.path is ending_with(pat="/") else comment.subject.path[1:]) | json_encode }}
root = {{ comment.subject.fragment is undefined or comment.subject.fragment[:8] == "#:~:text" }}
in_reply_to = {{ comment.subject.fragment | json_encode if comment.subject.fragment else false }}
ctx = {{ __tera_context | str | json_encode }}
+++

{{ comment.html }}
```

This template above will save comments under `/content/comments/` in a format like `1782372989_deaf4441-a4231af.md`.

When you're done your static directory should have at least these files:

```
static
├── comment.template.md
└── r3ply.config.toml
```

You should now be able use the r3ply zola theme. Read on to learn how to use it.

## Usage

### Adding comments

You can simulate receiving comments by using the r3ply CLI command, e.g.

```
# Saves the comment as a file under `/content/comments/`
re simulate email --filter comment --moderate --subject "/demo/"
```

This will save comments under the directory `/content/comments/`. If you just want to see comment output you can remove the `--moderate` flag.

Run `re --help` for more information on using the r3ply CLI tool, or visit the r3ply [CLI docs](https://r3ply.com/docs/cli/).

### Rendering Comments

Use the r3ply macro to render comments. You simply pass in a list of comments (as [Zola pages](https://www.getzola.org/documentation/content/page/)).

For example:

```jinja
{% import "r3ply/templates/r3ply.html" as r3ply %}

<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Document</title>
</head>
<body>
  {% block comments %}
  {% block choose_comments %}
    {% set comments = get_section(path="comments/_index.md") | get(key="pages") %}
  {% endblock choose_comments %}
  {% block render_comments %}
    {{ r3ply::render_comments_sorted_by_activity(comments=comments) }}
  {% endblock render_comments %}
  {% endblock comments %}
</body>
</html>
```
The macro will automatically find which of the comments from the list are root comments, as well as render the thread with the most recent activity first.

If you want to render a comment subtree from a specific parent (i.e. not going all the way to the root comment), then you can pass in an optional parameter `starting_from_id` that accepts the ID (i.e. `slug`) of the parent comment.

### Customizing Comments

To customize rendering you should add a template called `r3ply.override.html` and supply a new implementation of the `write_thread` macro.

For example:

```jinja
{% import "r3ply.html" as base %}

{# Override url decode #}
{%- macro urldecode(encoded) -%}
  {{ base::urldecode(encoded=encoded) }}
{%- endmacro -%}

{# Override mailto #}
{%- macro mailto(to, subject, body) -%}
  {{ base::mailto(to=to, subject=subject, body=body) }}
{%- endmacro -%}

{# Override get ancestors #}
{%- macro get_ancestors(child, stop_at_id=false) -%}
  {{ base::get_ancestors(child=child, stop_at_id=stop_at_id) }}
{%- endmacro -%}

{# Override get descendants #}
{%- macro get_descendants(parent) -%}
  {{ base::get_descendants(parent=parent) }}
{%- endmacro -%}

{# Override render comments #}
{%- macro render_comments_sorted_by_activity(comments, starting_from_id=false) -%}
  {{ base::render_comments_sorted_by_activity(comments=comments, starting_from_id=starting_from_id) }}
{%- endmacro -%}

{# Override write thread #}
{% macro write_thread(parent, comments) %}
{% set children = comments | filter(attribute="taxonomies.replies.1", value=parent.slug) | sort(attribute="extra.latest_activity") | reverse %}
<details open class="w-xl">
  <summary class="border-b">
    <span class="inline-flex gap-2">
      <span class="text-red-400"><span class="text-gray-600">#</span>{{ parent.slug }}</span>
      <span>|</span>
      <time datetime="{{ parent.date }}" class="text-blue-400">
        <span class="text-yellow-500">{{ parent.date | date(format="%Y-%m-%d") }}</span>
        <span>{{ parent.date | date(format="%H:%M") }}</span>
      </time>
    </span>
  </summary>
  <article class="my-2">
  {{ parent.content | safe }}
  </article>
  {% set subject = "/" ~ parent.taxonomies.subjects[0] ~ "/#" ~ parent.slug %}
  <div class="m-2">
    <a class="px-2 py-1 rounded-xl border text-purple-400"
    href="{{ r3ply::mailto(to=config.extra.domain | default(value='CHANGE_ME'),
    subject=subject,
    body='') }}">reply</a>
  </div>
  <div class="ml-4 pt-2">
    {% for child in children %}
      {# Note: see comment in theme template for why this is `comments::` instead of `self::` #}
      {{ self::write_thread(parent=child, comments=comments) }}
    {% endfor %}
  </div>
</details>
{% endmacro  %}
```


With the result being something like

![Screenshot of what resulting code snippet looks like](./Screenshot%202026-06-24%20at%2018.06.47.png)

In this example, the base `r3ply` macro namespace is imported, and each of its macros are re-implemented by calling the underlying `r3ply` macro namespace, however the `write_thread` macro is customized.

Unfortunately this is necessary until tera2 comes out and the new version of Zola along with it. Otherwise macro namespaces are very fragile with themes. Fortunately, if you do it like this then you will avoid a lot of subtle and frustrating bugs later.

To customize the rendering you need to add a template called `comments.html` to your project's template directory, with a macro called `write_thread` that accepts a `parent` and `comments` argument.

For example, the basic `write_thread` macro could be modified to use tailwind classes:

## Project Structure

Comments are stored as files within the comments section (i.e. `/content/comments/`), and they must have the expected front-matter. As long as you use the template in this documentation it should be fine.

### The `base.html` file

While it is not essential, more often than not you're going to want by extending the `base.html` file located within `themes/r3ply/templates`. It has a very simple block structure that can be overridden. If you're used to having your own `base.html` file, then I recommend naming it `base.override.html`, making some high level overrides there, and then further extending it using your own templates.

The reason why there's a `base.html` file to begin with is that there are many templates for the various taxonomies specified within the comments, and the theme tries to provide a batteries included approach. However, it's quite normal to extend or override this `base.html` file yourself.

### The comments section

This will give you a comments section that will display all comments, as well as provide a comments RSS/Atom feed (assuming `generate_feed` is enabled). This will allow people, such as the site maintainer, to subscribe to all comments via RSS, so they can be aware when there are new submissions.

### Taxonomies

A few taxonomies are used by the commenting system as well, each with their own purpose.

- `subjects`: this represents the original article that the comment was in response to. There is an RSS/Atom feed generated for this, allowing people to receive notifications if any comments are submitted to a specific article.
- `commenters`: gathers all comments by a certain author. There is an RSS/Atom feed generated for this, so people may receive notifications via their RSS reader when a specific author comments on the site.
- `threads`: each comment is the parent of its own thread. There is no RSS/Atom feed generated for this taxonomy.
- `replies`: each comment reply to a comment references its parent as well as itself. There is an RSS/Atom feed generated for this, allowing people to receive notifications of any replies made to a specific comment.

### Customizing Taxonomies

You can change how the taxonomies are rendered like so:

```jinja
{# This is example is for overriding the threads/list rendering #}
{% extends "r3ply/templates/threads/list.html" %}
{% import "r3ply.override.html" as r3ply %}


{% block render_comments %}
{{ r3ply::render_comments_sorted_by_activity(comments=comments) }}
{% endblock render_comments %}
```

In the above example, the `threads/list.html` template is overridden to use a different rendering of comments. See [the usage](#usage) above for more details on how that works.

You can do something similar with any of the [taxonomies](#taxonomies) or the [comments](#the-comments-section) section.