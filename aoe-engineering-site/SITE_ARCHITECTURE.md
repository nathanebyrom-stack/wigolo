# AOE Engineering — Site Architecture

## Pages

| Page | File | Nav label | Indexable | Notes |
|---|---|---|---|---|
| Home | `index.html` | Home | Yes | Animated hero, "What We Do" cards, approach, sectors preview, ATIS partner spotlight, stats, compliance strip, CTA |
| About | `about.html` | About | Yes | Company story, timeline (2009→today), values, mission quote |
| Capabilities | `capabilities.html` | Capabilities | Yes | Service detail — see anchor map below |
| Sectors | `sectors.html` | Sectors | Yes | 6 sector cards + cross-sector compliance strip |
| Contact | `contact.html` | Contact | Yes | Info card (address/email/phone/hours/company no.) + enquiry form |
| Privacy & Cookies | `privacy.html` | *(footer only, not in primary nav)* | Yes | Linked from every page's footer |
| 404 | `404.html` | *(not linked)* | **No** (`noindex`) | On-brand error page; standard filename for static-host auto-detection |

No individual product/service sub-pages exist as separate URLs — this was
a deliberate IA decision (see PROJECT_BRIEF.md / DEVELOPMENT_LOG.md), not
an oversight. Each capability gets a linkable, SEO-indexable anchor on the
Capabilities page instead.

## Capabilities page anchor map

| Anchor | Section |
|---|---|
| `capabilities.html#lifting` | Hoists, Grippers & Tooling |
| `capabilities.html#cranes` | Gantry & Overhead Cranes |
| `capabilities.html#manipulators` | Intelligent Manipulators (ATIS range detail) |
| `capabilities.html#specialist` | Specialist automotive/aerospace handling |
| `capabilities.html#care` | Care & Aftersales |

The homepage's six "What We Do" cards each deep-link to one of these
anchors (`capabilities.html#lifting` is used by both the Hoists and the
Grippers cards, since they're one combined section).

## Global structure (every page)

```
<body>
  <a class="skip-link" href="#main-content">        (accessibility: bypass nav)
  <svg> shared logo gradient/filter <defs> </svg>    (one per document)
  <header class="site-header">                       (sticky, logo + nav + CTA)
  <main id="main-content"> ... page content ... </main>
  <footer class="site-footer">                       (4-column + legal bar)
  <script> inline year + main.js </script>
</body>
```

## Shared assets

- `assets/css/style.css` — single stylesheet, every page loads the same
  file (not split per-page) — see DESIGN_SYSTEM.md for why that's
  deliberate (cache reuse across page navigations on a small multi-page
  site).
- `assets/js/main.js` — sticky header shadow, mobile nav toggle,
  reveal-on-scroll, animated stat counters, contact form mailto builder,
  `aria-current` active-nav marking.
- `assets/fonts/` — self-hosted Poppins/Inter, see DEVELOPMENT_LOG.md.
- `assets/img/` — rendered OG share image + favicon PNGs (not stock).
- `robots.txt`, `sitemap.xml` — assume `www.aoeengineering.com`; update if
  the real deployment domain differs.

## Interactive preview (not part of the deployed site)

A single-file, router-based version of this entire site was built for
in-conversation click-through demos, published as a Claude Artifact. It's
a build artifact for demoing, not a deployment target — the real site is
the 7 files above. If it ever needs rebuilding, the generation approach
(extract `<main>`/`<header>`/`<footer>` from each page, rewrite
`file.html#anchor` links to a flat `#page--anchor` hash token, combine into
one DOM with `.route-page` show/hide, inline a hash-router) is documented
in DEVELOPMENT_LOG.md.
