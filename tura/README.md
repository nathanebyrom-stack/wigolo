# TURA

A premium, mobile-first adventure planner for two adults. Sixty-four real
places — camping, coast, mountains, forests, lakes, hiking, kayaking, sailing,
wild swimming and bushcraft — with a calendar that already knows when you are
going, a budget that knows what it should cost, and a book that fills itself in
afterwards.

Everything is stored on the device. No account, no server, no network calls
except map tiles.

## The rules the app is built around

| Rule | Where it lives | Verified by |
| --- | --- | --- |
| 75% of adventures are UK-based | 48 of 64 catalogue entries | `src/lib/catalogue.test.ts` |
| 50% are two-night, adults-only, uninterrupted escapes | 32 of 64 | `src/lib/catalogue.test.ts` |
| **Green** — last Saturday of every month, ~£300 | 12 slots a year | `src/lib/calendar.test.ts` |
| **Amber** — Saturday nearest mid-month, every other month, ~£200 | 6 slots a year | `src/lib/calendar.test.ts` |
| **Red** — one yearly birthday adventure, ~£1,000 | 1 slot a year | `src/lib/calendar.test.ts` |

Every calendar entry, journal entry and book page carries the adventure's
reference number (`TURA-001` … `TURA-064`).

## What is in it

- **Bleed-through scrolling map** — a Leaflet map fixed behind the page, flying
  to whichever adventure has scrolled into view, with translucent panels over
  it. Terrain, satellite and outdoors tile styles, none needing an API key.
- **The next fifteen** — the catalogue ranked by popularity, with anything
  completed or skipped dropped and favourites lifted to the top.
- **Check-offs and status tracking** — a checklist built per adventure from its
  length, terrain and specific kit, plus six statuses from idea to completed.
- **Calendar** — the nineteen dates a year the rules produce, with tier colours,
  budgets, and an adventure picker that sorts by what actually fits the budget.
- **Budget tracker** — planned against actual, by year, by tier, by trip and by
  expense category.
- **Journal and memories** — dated entries with photographs, a rating, the
  conditions and a quotable line, grouped by year.
- **Digital adventure book** — one page per completed adventure, turned by
  swipe or arrow key, built from the journal.
- **Adventure roulette** — popularity-weighted, with limits on cost, travel
  time, terrain, UK-only and two-night-escapes-only.
- **Statistics** — nights away, miles covered, spend against plan, terrain
  coverage, regions and countries, and the longest run of consecutive months out.
- **PWA and offline** — installable, and the shell, catalogue, your plan and
  previously viewed map tiles all work with no signal.

## Running it

```bash
npm install
npm run dev          # http://localhost:3000
```

```bash
npm run build && npm run start
```

## Checks

```bash
npm run check        # typecheck + lint + unit tests
npm test             # 34 unit tests: catalogue composition, calendar rules
npm run smoke        # every route loads on an iPhone viewport, no console errors
npm run journey      # 31 end-to-end checks, including offline
npm run a11y         # axe-core over every route, dark and light
```

`smoke`, `journey` and `a11y` need a server running and a Chromium binary. Set
`CHROMIUM_PATH` if Playwright's own download is unavailable:

```bash
CHROMIUM_PATH=/path/to/chrome npm run journey
```

## How it is put together

```
src/
  app/                    routes — all statically prerendered
  components/
    adventure/            cards, badges, status picker, category icons
    calendar/             slot <-> adventure assignment sheets
    journal/              rating input and display
    map/                  Leaflet wrapper, bleed-through backdrop, tile styles
    screens/              one component per route
    ui/                   shadcn/ui components (Radix primitives, vendored)
  lib/
    adventures.ts         the 64-entry catalogue
    calendar.ts           the green/amber/red slot rules
    checklist.ts          per-adventure checklist generation
    external-store.ts     LocalStorage store behind useSyncExternalStore
    store.tsx             React context, hooks and every mutation
    stats.ts              statistics derivation
    types.ts              the domain model
scripts/
  generate-icons.mjs      rasterises the app icon into every size needed
  smoke.mjs               route smoke test
  journey.mjs             end-to-end journey test
  a11y.mjs                accessibility audit
public/
  sw.js                   service worker: shell, assets, pages, map tiles
```

State lives in a plain module (`external-store.ts`) that React subscribes to
with `useSyncExternalStore`. That gives a stable server snapshot for SSR, swaps
to the LocalStorage value on hydration without a cascading render, and keeps two
tabs in step through the `storage` event.

The shadcn/ui components are vendored into `src/components/ui` rather than
pulled with the CLI, which is how shadcn works anyway — the components are
source you own. `components.json` is present so `shadcn add` still works.

## Storage

Everything sits under one LocalStorage key, `tura.state.v1`, versioned so
migrations stay possible. Browsers allow roughly 5 MB, so journal photographs
are downscaled to 1280px and re-encoded before they are stored, with a cap of
six per entry. Settings has an export and import for backups and moving between
devices, and the app warns rather than failing silently if a write is rejected.

## Attribution

Map tiles are (c) OpenStreetMap contributors, with terrain rendering by
OpenTopoMap (CC-BY-SA), outdoors rendering by CyclOSM, and satellite imagery (c)
Esri, Maxar and Earthstar Geographics. The attribution control is deliberately
left visible.
