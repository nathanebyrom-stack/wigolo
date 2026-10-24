# AOE Engineering — website redesign

Standalone static site for AOE Engineering Ltd, modernised for the UK sector.
No build step, no dependencies — open `index.html` directly or serve the
folder with any static file server.

```
python3 -m http.server 8080   # then visit http://localhost:8080
```

## Structure

- `index.html`, `about.html`, `capabilities.html`, `sectors.html`, `contact.html`,
  `privacy.html`, `404.html`
- `assets/css/style.css` — design system (graphite / white / blue, Poppins display type)
- `assets/js/main.js` — sticky header, mobile nav, scroll reveal, animated stats, contact form
- `assets/fonts/` — self-hosted Poppins/Inter (see below)
- `assets/img/` — rendered OG share image + favicons (see below)
- `robots.txt`, `sitemap.xml` — assume deployment at `www.aoeengineering.com`;
  update both if the real domain differs
- `DEVELOPMENT_LOG.md` — full history of what's been built, decided and
  verified, for continuity across sessions

## Zero external dependencies

Every request this site makes is to itself. Fonts (Poppins, Inter) are
self-hosted in `assets/fonts/` rather than loaded from Google Fonts — nothing
is fetched from any third-party domain, no cookie or third-party request of
any kind occurs. There is also no analytics, no tracking, and the enquiry
form is a client-side `mailto:` builder (nothing is sent to or stored on a
server unless the visitor actually sends the resulting email). See
`privacy.html` for the full, honest disclosure.

## Notes before publishing

- **Imagery**: all visuals are custom-built inline SVG (hero illustration, card
  icons, diagrams) rather than stock photography, so nothing depends on an
  external image host or can render as a broken/placeholder image. The one
  exception is `assets/img/og-image.png` and the favicon PNGs, which are
  rendered once from the same design system (not stock) for social-share
  previews and browser tabs.
- **Contact details**: verified by the client — `davidogden@aoeengineering.com`,
  07771 873 177, and the Dorney House / Burnham registered office address are
  all confirmed real and live across the footer and contact page.
- **ATIS partnership**: kept to the same modest, supplier-credit level of
  prominence as the current AOE site (a labelled section and a footer line),
  not a co-branded hero. Only the ATIS product lines relevant to UK
  installation were used (mounting options, product families) — no
  Italy-specific distributor/company material.
- **Compliance references** (LOLER 1998, PUWER 1998, UKCA marking, Machinery
  (Safety) Regulations 2008) are real UK regulations relevant to lifting
  equipment; copy should be reviewed by whoever owns compliance sign-off
  before publishing.
