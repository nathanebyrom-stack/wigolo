# AOE Engineering Website — Development Log

Working log for the autonomous development pass. Newest entries at the top of
each session block. This file travels with the repo so future sessions have
full context.

---

## Session: Autonomous completion pass (this session)

### Scope
Full audit + launch-readiness pass per the standing brief: fix errors, finish
essential pages/content, tighten design consistency and mobile, complete SEO/
accessibility/performance, final QA. No publishing, no paid services, no
destructive changes without approval.

### Starting state (verified before work began)
- 5 pages: index, about, capabilities, sectors, contact — all previously
  built, reviewed in-browser, and pushed (`7c2ed83`).
- Branding: brushed-metal AOE logo (inline SVG), graphite/white/blue palette,
  Poppins display type — approved, not touched in this pass except where
  explicitly noted.
- Contact details verified by client: davidogden@aoeengineering.com,
  07771 873 177, Dorney House address — already live everywhere.
- No analytics, no third-party trackers, no cookies currently set by the
  site itself (Google Fonts stylesheet is the only third-party request).

### Plan (priority order, per brief section 8)
1. **P1 — critical errors**: re-verify no broken links/consoles errors after
   recent edits; confirm all 5 pages still render clean.
2. **P2 — essential completeness**: Privacy & Cookies page, custom 404 page,
   robots.txt/sitemap.xml (currently entirely missing — real gaps).
3. **P3 — design consistency/mobile/commercial**: skip-to-content link,
   visible focus states, `aria-current` on active nav — accessibility/UX
   polish that also helps conversion (keyboard/screen-reader users can
   actually reach the CTAs).
4. **P4 — SEO/accessibility/performance**: canonical URLs, Open Graph/Twitter
   card meta + a real rendered OG image, Organization JSON-LD structured
   data, automated accessibility audit (axe-core via Playwright).
5. **P5 — final QA**: cross-page link audit, console-error sweep, responsive
   screenshot pass, commit + push.

### Decisions made without asking (recorded per brief section 3)
- **Canonical domain**: used `https://www.aoeengineering.com/` for
  canonical/OG URLs, since that's the live domain this redesign targets.
  **Flag for client**: if this redesign deploys somewhere else first (staging
  subdomain, different domain), these need updating — documented below.
- **OG image**: no hosted photography exists, so I rendered a branded 1200×630
  share-preview image from the site's own logo/palette (dark graphite, logo
  mark, tagline) rather than leaving `og:image` empty or using a placeholder
  box. Same treatment for a 180×180 apple-touch-icon.
- **Privacy & Cookies page**: wrote it to honestly reflect current reality —
  no analytics, no tracking cookies, the enquiry form sends mail via the
  visitor's own email client (nothing is stored on a server). This needs
  re-review the moment analytics/CRM integration is added.
- **No individual product sub-pages**: kept product/capability detail as
  anchor sections within `capabilities.html` rather than splitting into
  separate URLs per product line — matches the original approved IA, avoids
  an unrequested structural rebuild, and anchors already give each capability
  a linkable, SEO-indexable fragment.

### Outstanding questions for the client (none block further progress)
- Confirm final deployment domain (affects canonical/OG/sitemap URLs).
- Confirm whether analytics (GA4, etc.) should be added — none included yet,
  deliberately, since adding tracking without instruction would be an
  overreach.
- Confirm company's actual trading address for cookie/privacy policy
  jurisdiction wording if different from the registered office.

### Completed this session

**P1 — audit (no bugs found, but set up permanent QA tooling)**
- Installed `axe-core` + Playwright locally (scratchpad only, not a repo
  dependency) and wrote a reusable audit script that checks every page for:
  console errors, page errors, failed network requests, and automated
  accessibility violations.
- Baseline result: 0 console/page/network errors on all 5 existing pages.
  ~20 real accessibility violations found by axe (see below) — all fixed.

**P2/P4 — accessibility fixes (0 axe violations across all 7 pages now)**
- Added a `<main id="main-content">` landmark to every page (was entirely
  missing — caused the bulk of axe's "region"/"landmark-one-main" findings).
- Added a "Skip to main content" link (visually hidden until focused) —
  keyboard users could not previously bypass the nav to reach content.
- Added visible `:focus-visible` outlines site-wide — interactive elements
  had no visible keyboard focus state before this.
- Fixed heading hierarchy: `process-step`, `sector-tile`, `timeline-item`
  (was `<h4>`), and `info-row`/`footer-col` (was `<h5>`) all skipped levels
  under their section's `<h2>`. Normalised all to `<h3>` and updated the
  matching CSS selectors. Added two visually-hidden `<h2>`s (sectors.html's
  card grid, contact.html's info/form section) where no heading existed at
  all before the first `<h3>`.
- Fixed a real color-contrast failure: the footer's "UK Handling & Lifting"
  tagline (blue-600 on near-black) measured ~3.5:1 — added a
  `.site-footer`-scoped override to blue-500, now ~4.9:1 (passes WCAG AA).
- Added `aria-current="page"` to the active nav link (was visual-only via a
  CSS class, invisible to screen readers).

**P2 — new pages**
- `privacy.html` — Privacy & Cookies policy. Honest, specific content: no
  analytics/tracking cookies exist on this site; the only third party is
  the Google Fonts request; the enquiry form is a client-side `mailto:`
  builder, so nothing is received or stored unless the visitor actually
  sends the resulting email. Covers UK GDPR rights + ICO complaint route.
  Linked from the footer on every page.
- `404.html` — on-brand error page (same header/footer/palette), clear
  routes back to the homepage or Contact. Standard filename for automatic
  recognition on most static hosts (GitHub Pages, Netlify, etc.).

**P4 — SEO & technical**
- `robots.txt` and `sitemap.xml` (neither existed before).
- Canonical URL, Open Graph, and Twitter Card meta on every indexable page.
- Organization JSON-LD structured data (name, address, phone, email,
  LinkedIn) on every page — validated as well-formed JSON.
- Rendered two real image assets from the site's own design (no stock
  imagery, nothing hosted externally): a 1200×630 Open Graph share image
  and a 180×180 `apple-touch-icon.png`, both in `assets/img/`.

**P5 — QA**
- Full internal link + in-page-anchor audit (custom script): every `href`
  across all 7 pages resolves to an existing file or a real `id` — zero
  broken links/anchors.
- Re-ran the full axe + console-error audit after every fix batch.
- Visual regression pass (desktop + mobile, all 7 pages) to confirm the
  structural changes above caused no layout shift; spot-checked the
  reveal-on-scroll animation still fires correctly under real scroll input
  after the `<main>` wrapper was added (12/12 elements, as before).

**P5 — final copy QA**
- Extracted and read the full rendered text of all 7 pages (not just the
  source HTML) to proofread as a visitor would see it. Found and fixed one
  factual drift: copy said "Fifteen years" / stat counters showed "15+"
  years in UK industry, calculated from the 2009 founding date — but the
  current date means that's now 17 years. Updated both the About page H1
  and both homepage stat counters (hero + stats bar) to 17. Everything else
  read clean: consistent British English, no typos found, no unsupported
  claims, numbers consistent with each other across pages.

**P5 — external link security/UX**
- The footer's LinkedIn icon link opened in the same tab with no
  `rel="noopener"` on all 7 pages (inconsistent with the Privacy page's
  external links, which already had both). Added `target="_blank"
  rel="noopener"` everywhere for consistency and to avoid the
  `window.opener` reverse-tabnabbing risk. Re-verified: still 0 violations,
  0 errors, 0 broken links.

### Still outstanding (not blocking, queued for next pass)
- Extend the hero animation/badge-row treatment from the homepage to the
  inner pages' `page-hero` banners, for visual consistency (cosmetic, not
  a gap).
- No dedicated service-worker/offline support, no build-time minification —
  reasonable for a static brochure site of this size; flagging only because
  the brief mentioned "page speed" explicitly. Current pages have zero
  render-blocking resources besides the Google Fonts stylesheet and are
  already very light (no raster images on-page).
- Self-hosting Poppins/Inter instead of the Google Fonts CDN would remove
  the one third-party request entirely — not done this session because
  this sandbox cannot fetch the font binaries to vendor them in; flagging
  as a worthwhile follow-up.

