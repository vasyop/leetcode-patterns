# leetcode-patterns

The site behind **[LeetCode Patterns](https://vasyop.github.io/leetcode-patterns/)** — a book about
the patterns behind LeetCode problems.

The repository is public because GitHub Pages only serves a private repository on a paid plan.
That costs nothing in practice: the viewer fetches the chapters over `fetch()`, so everything
under `content/` is readable from the site either way.

## What lives where

| Path                          | What it is                                                           |
| ----------------------------- | -------------------------------------------------------------------- |
| `index.html`                  | The viewer shell.                                                      |
| `assets/styles.css`           | All styling, light and dark.                                           |
| `assets/app.js`               | Router, markdown rendering, outline, search. No build step.            |
| `content/`                    | The book itself — **generated, do not edit here.**                     |
| `content/manifest.json`       | Chapter order, titles and word counts, rewritten on every publish.     |
| `.nojekyll`                   | Stops Pages running the tree through Jekyll, which drops `_` paths.    |

There is no build step and no deploy workflow: Pages serves this branch directly, so a push to
`main` is the deploy.

## Where the chapters come from

The markdown is authored in the private `template` repository, under `book/`, and pushed here by:

```sh
node scripts/publish-book.mjs            # from the authoring repo
node scripts/publish-book.mjs --dry-run  # see what would be published
```

That script only ever rewrites `content/`. Everything else here — the viewer, this README — is
maintained by hand and is safe from it.

Two conventions carry over from `book/`:

- A name starting with `_` is a draft and is not published at all.
- A file at the top level is a chapter and appears in the contents. A file in a subdirectory,
  like `content/animations/`, is published and readable but stays out of the sidebar — the only
  way in is a link from a chapter. The manifest records this as `listed`.

## Running it locally

The viewer fetches markdown over `fetch()`, so it needs a server rather than `file://`:

```sh
python -m http.server 8000
# then open http://localhost:8000
```

## How the viewer treats the markdown

- Fenced blocks with a language are syntax highlighted; blocks without one are treated as ASCII
  diagrams and are never highlighted or reflowed.
- Relative `*.md` links are rewritten to in-app routes, so the same files still read correctly on
  GitHub.
- Headings get stable anchors, so `#/04-backtracking#pruning` deep links work.
- `Ctrl`/`⌘` + `K`, or `/`, opens full-text search across every published page, listed or not.
- `j` / `k` and the arrow keys step through chapters.
