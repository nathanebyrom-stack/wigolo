# AOE Engineering — Design System

Source of truth: `assets/css/style.css`. This file documents it for quick
reference — if the two ever disagree, the CSS file wins; update this file
to match, not the other way round.

## Colour tokens

| Token | Hex | Use |
|---|---|---|
| `--graphite-950` | `#0d1013` | Footer background |
| `--graphite-900` | `#14181d` | Hero/page-hero background, header dark overlays |
| `--graphite-800` | `#1c222a` | Dark-section gradients |
| `--graphite-700` | `#272f3a` | Dark card accents, icon strokes |
| `--graphite-600` | `#3a4552` | Structural line art (gantry, steel) |
| `--graphite-400` | `#596672` | Secondary/muted body text on light backgrounds |
| `--steel-300` | `#9aa7b5` | Muted text on dark backgrounds |
| `--steel-100` | `#dbe2e9` | Hairline borders on light backgrounds |
| `--white` / `--off-white` | `#ffffff` / `#f4f6f8` | Light section backgrounds |
| `--blue-700/600/500/100` | `#0043c4` / `#0057e7` / `#2e7bff` / `#e7f0ff` | Primary brand blue — CTAs, links, accents, chips |
| `--amber-500` | `#e8912a` | Reserved, lightly used |
| Safety yellow (inline, not tokenised) | `#ffc72c` | Manipulator-arm joint pins in the hero illustration only — deliberately real-machinery colouring, not part of the UI palette |

**Note on `--graphite-400`:** darkened from the original `#6b7684` to
`#596672` after an axe-core contrast audit measured the *rendered* pixel
colour (anti-aliasing-aware) at 4.48:1 against white — just under the
4.5:1 AA requirement. See DEVELOPMENT_LOG.md for the investigation. Don't
lighten this token back without re-testing contrast on the real rendered
page, not just the raw hex value in isolation.

## Typography

- Display face: **Poppins** (500/600/700/800) — headings, nav, buttons,
  eyebrows, stat numbers. Confident, bold, geometric — carries the
  "engineering credibility" tone.
- Body face: **Inter** (400–600, shipped as one variable font) — paragraph
  text, form fields, footer copy.
- Both self-hosted in `assets/fonts/` (see DEVELOPMENT_LOG.md) — zero
  external font requests.
- No fixed type-scale file; sizes are set per-component in `style.css`
  (e.g. hero `h1` is `clamp(2.3rem, 4.2vw, 3.4rem)`).

## Layout

- Max content width: `1240px` (`--container`), centred, `24px` side gutter.
- Radii: `--radius-sm: 10px`, `--radius-md: 16px`, `--radius-lg: 24px`.
  Buttons and badges use fully-rounded pills (`border-radius: 999px`), not
  the radius tokens — an intentional, already-approved choice (soft pill
  CTAs against sharp-cornered content cards), not an oversight.
- Shadows: four tiers (`--shadow-sm/md/lg/blue`) — cards lift from `sm` to
  `md`/`lg` on hover; the primary CTA button carries its own blue-tinted
  shadow (`--shadow-blue`) rather than a neutral one.

## Components

- **`.card`** — white card, hairline border, `shadow-sm` at rest, lifts to
  `shadow-lg` + top accent bar on hover. Icon tile rotates slightly and
  inverts to dark-on-blue on hover.
- **`.btn-primary` / `.btn-ghost`** — pill buttons. Ghost variant needs an
  explicit light-text override on dark backgrounds (`.hero .btn-ghost`,
  `.section--dark .btn-ghost`) — this was a real bug once (invisible text),
  fixed; don't introduce a new dark section without checking ghost buttons
  inside it still have a light-text rule.
- **`.hero-badge` / `.compliance-pill`** — small pill chips for
  LOLER/PUWER/UKCA/aftercare credentials. Used in the homepage hero, every
  inner page's `page-hero`, and a dedicated compliance section further
  down several pages — intentional repetition, not duplication to fix.
- **`.logo-mark`** — the brushed-metal AOE wordmark, inline SVG with a
  shared `<linearGradient>`/`<filter>` `<defs>` block injected once near
  the top of `<body>` on every page (gradient IDs must stay unique
  per-document, not per-element, if this pattern is ever duplicated).

## Motion

- Reveal-on-scroll (`.reveal` → `.reveal.is-visible`) via IntersectionObserver,
  with a 4-second `setTimeout` safety net so nothing stays permanently
  hidden if the observer is ever missed, and a `.js`-gated CSS rule so
  content is visible by default if JavaScript fails entirely.
- Homepage hero rig animation (crane arm sway, trolley float, radar-sweep
  arc, pulsing status chips) — pure CSS keyframes, `prefers-reduced-motion`
  respected (all animations disabled under that media query).
- No JS animation libraries (GSAP etc.) — not needed at this site's scale;
  CSS keyframes keep it dependency-free.

## Imagery

No stock or AI-generated photography anywhere. Every visual — the hero
crane/manipulator illustration, all card icons, the gantry-crane diagram on
Capabilities, the logo — is hand-built inline SVG using the palette above.
The rendered OG share image and favicons (`assets/img/`) are the one
exception: real PNG files, but rendered from this same design system (not
sourced externally), via a one-off Playwright screenshot of an HTML/SVG
template — see DEVELOPMENT_LOG.md if these ever need regenerating.
