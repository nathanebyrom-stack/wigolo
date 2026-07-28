# Site media audit

Crawls a site, inventories **every image and video**, and labels each one from
the signals the page itself provides. Built for the ATIS Manipolatori media
estate — a 26-category photo gallery plus a video gallery — but the target is a
flag, so it works on any site.

Zero dependencies. Node ≥ 20.

## Why it exists

The retrieval half of this task ran into a hard blocker: this environment's
egress policy denies all non-allow-listed hosts, so no page of the target site
could be fetched (`403` at the proxy for every host, `example.com` included).
This app is the part that *can* be built under that block — so the moment it
runs somewhere with network access, the labelling is one command.

## Usage

```bash
# Full crawl
node audit.mjs --url https://www.atismanipolatori.com --out ./out

# Just the photo galleries, faster
node audit.mjs --url https://www.atismanipolatori.com \
  --include '/Applicazioni/' --max-pages 300 --delay 500 --out ./out

# Offline: label a page you already have on disk
node audit.mjs --from-html ./saved-page.html --url https://site/page --out ./out
```

| Flag | Default | Meaning |
|---|---|---|
| `--url` | — | Start URL (required unless `--from-html`) |
| `--out` | `./out` | Output directory |
| `--max-pages` | 400 | Page cap |
| `--delay` | 800 | Milliseconds between requests |
| `--timeout` | 20000 | Per-request timeout |
| `--include` | — | Regex; only crawl matching URLs |
| `--exclude` | — | Regex; skip matching URLs |
| `--ignore-robots` | off | Crawl regardless of robots.txt |
| `--from-html` | — | Parse a local file instead of crawling |
| `--quiet` | off | Suppress per-page logging |

## Outputs

| File | Contents |
|---|---|
| `catalogue.json` | Full structured result — every asset with all extracted context |
| `catalogue.md` | Readable catalogue, grouped by page, plus accessibility summary |
| `assets.csv` | Flat asset list, for bulk alt-text work in a spreadsheet |

## The labelling rule

**A label is never invented.** Every label records the signal it came from, and
signals are ranked by how authoritative they are:

| Signal | Kind | Trustworthy as a description? |
|---|---|---|
| `figcaption` | authored | Yes |
| `alt` | authored | Yes |
| `aria-label` | authored | Yes |
| `title` | authored | Yes |
| `link-text` | contextual | Usually |
| `heading` | contextual | Only names the section, not the image |
| `filename` | weak hint | Rarely |

An asset whose only signal is a heading or a filename is flagged
`needsVisualReview`. An asset with no signal at all gets `label: null` — never a
guess. Those are the ones to route to a human or a vision model.

Opaque filenames are rejected rather than dressed up: `IMG_4471.jpg`,
`a1b2c3d4.png` and `1200.jpg` all yield no label, because they describe nothing.

## What it catches

- `<img>`, including lazy-loaded `data-src` / `data-lazy-src` / `data-original`
- `srcset` candidates with their descriptors, and `<picture>` sources
- CSS `background-image` in inline styles — how older gallery themes carry photos
- `<video>` with `poster` and every `<source>`
- YouTube and Vimeo embeds, normalised to a watch URL, with the YouTube thumbnail
- Direct `<a href>` links to video files

For accessibility it distinguishes three states that matter and are usually
conflated: `alt` **missing** (a real defect), `alt` **empty** (valid — declares
the image decorative), and CSS background images (cannot carry alt at all).

## Politeness

Defaults are deliberately conservative: sequential requests, 800 ms apart,
robots.txt respected, 400-page cap. Point it at sites you are entitled to audit.

## Tests

```bash
node --test test/*.test.mjs
```

18 tests over a fixture page that reproduces the awkward cases — figcaption
scoping, missing vs empty alt, lazy loading, opaque filenames, embeds,
background images, robots parsing, and report rendering.

The fixture caught three real bugs during development: a `<figure>` that had
already closed leaking its caption onto later elements, `IMG_4471.jpg`
collapsing to the label `"4471"` after boilerplate stripping, and an incorrect
missing-alt count.
