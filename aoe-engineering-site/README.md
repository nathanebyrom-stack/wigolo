# AOE Engineering — website redesign

Standalone static site for AOE Engineering Ltd, modernised for the UK sector.
No build step, no dependencies — open `index.html` directly or serve the
folder with any static file server.

```
python3 -m http.server 8080   # then visit http://localhost:8080
```

## Structure

- `index.html`, `about.html`, `capabilities.html`, `sectors.html`, `contact.html`
- `assets/css/style.css` — design system (graphite / white / blue, Poppins display type)
- `assets/js/main.js` — sticky header, mobile nav, scroll reveal, animated stats, contact form

## Notes before publishing

- **Imagery**: all visuals are custom-built inline SVG (hero illustration, card
  icons, diagrams) rather than stock photography, so nothing depends on an
  external image host or can render as a broken/placeholder image.
- **Email address**: `enquiries@aoeengineering.com` is a plausible address
  built from the real domain, not a verified inbox — confirm it exists (or
  swap it in `contact.html` and the footer of every page) before going live.
- **Phone number**: intentionally left out. No verified number was available
  during this build, and publishing an unverified one seemed worse than
  omitting it — add the real number to `contact.html` and the footer.
- **ATIS partnership**: kept to the same modest, supplier-credit level of
  prominence as the current AOE site (a labelled section and a footer line),
  not a co-branded hero. Only the ATIS product lines relevant to UK
  installation were used (mounting options, product families) — no
  Italy-specific distributor/company material.
- **Compliance references** (LOLER 1998, PUWER 1998, UKCA marking, Machinery
  (Safety) Regulations 2008) are real UK regulations relevant to lifting
  equipment; copy should be reviewed by whoever owns compliance sign-off
  before publishing.
