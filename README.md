# leetcode-patterns

The site behind **[LeetCode Patterns](https://vasyop.github.io/leetcode-patterns/)** — a book about
the patterns behind LeetCode problems.

This repository is private. The GitHub Pages site it publishes is public.

## What lives where

| Path                          | What it is                                                           |
| ----------------------------- | -------------------------------------------------------------------- |
| `index.html`                  | The viewer shell.                                                      |
| `assets/styles.css`           | All styling, light and dark.                                           |
| `assets/app.js`               | Router, markdown rendering, outline, search. No build step.            |
| `content/`                    | The book itself — **generated, do not edit here.**                     |
| `content/manifest.json`       | Chapter order, titles and word counts, rewritten on every publish.     |
| `.github/workflows/pages.yml` | Assembles `_site/` and deploys it to Pages on every push to `main`.    |

## Where the chapters come from

The markdown is authored in the private `template` repository, under `book/`, and pushed here by:

```sh
node scripts/publish-book.mjs            # from the authoring repo
node scripts/publish-book.mjs --dry-run  # see what would be published
```

That script only ever rewrites `content/`. Everything else here — the viewer, the workflow, this
README — is maintained by hand and is safe from it.

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
- `Ctrl`/`⌘` + `K`, or `/`, opens full-text search across every chapter.
- `j` / `k` and the arrow keys step through chapters.
