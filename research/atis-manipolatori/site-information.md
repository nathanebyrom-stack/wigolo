# ATIS Manipolatori — site information retrieval

**Target:** https://www.atismanipolatori.com
**Retrieved:** 2026-07-27
**Method:** search-index retrieval only (see *Retrieval status* below)

---

## Retrieval status — read first

Two halves of this task landed differently:

| Task | Status |
|---|---|
| Retrieve all information | **Partial** — everything below is retrieved, but from the search index, not from the pages themselves |
| Label images and video | **Blocked** — no media could be reached, so nothing was labelled |

**Why.** This session's environment has an egress network policy that denies all
outbound HTTPS except an allow-list (Anthropic endpoints, package registries,
GitHub). Every direct fetch path returns `403` at the proxy *before* reaching the
target:

- `curl https://www.atismanipolatori.com` → `CONNECT tunnel failed, response 403`
- The same 403 occurs for `https://example.com`, so this is **not** ATIS blocking
  us — it is the session's own policy blocking all non-allow-listed hosts.
- `WebFetch` (the managed fetch tool) returns `403 Forbidden` for every URL
  including `example.com`, so it is subject to the same policy.
- Chromium/Playwright would route through the same proxy and fail identically.

Only web **search** works, because it terminates inside the allowed Anthropic
API surface. So the information below comes from search-result snippets and
indexed page titles — it is real, attributable content from the site, but it is
neither the complete page text nor a verified crawl.

**Consequence for the media half.** Labelling images and video requires reading
`<img>`/`<video>` elements (src, alt, poster, caption) and viewing the assets.
None of that is reachable. Writing labels without seeing the media would be
fabrication, so the media inventory below lists only what search surfaced, with
no invented descriptions.

**To unblock:** re-run in an environment whose network policy allows
`www.atismanipolatori.com` (and `img.youtube.com` / `www.youtube.com` for the
video thumbnails). Network policy is chosen when the environment is created —
see https://code.claude.com/docs/en/claude-code-on-the-web. With that host
allow-listed, a full crawl plus media labelling is straightforward.

---

## Company profile

ATIS Srl designs and builds **pneumatic industrial manipulators** for the safe
handling of heavy, fragile or hazardous loads.

- **Founded:** 2006.
- **Background:** built on prior sector experience — the site states *"trentennale"*
  (thirty years) on the Storia page and *"40 years"* on another indexed page.
  ⚠️ The two figures conflict across pages; verify against the live site.
- **Positioning:** highly specialised in industrial handling, covering both design
  and manufacture, with custom solutions engineered per customer.
- **Quality:** ISO 9001 certified (dedicated *Qualità* page).
- **Core claim:** the manipulators near-eliminate operator physical effort,
  sharply reducing injury and occupational-illness risk.

### Contact details

| Field | Value |
|---|---|
| Address | Via Trento, 112–114 — 38017 Mezzolombardo (TN), Italy |
| Phone | +39 0461 662031 |
| Fax | +39 0461 662484 |
| Email | atis@atismanipolatori.com |

⚠️ A separate domain `atis-srl.it` also surfaced with a *Contatti* page. Whether
it is a legacy domain, a related entity, or an unrelated company was **not**
verified — do not treat it as the same business without checking.

---

## Product lines

All four lines are pneumatic and share a common trait: **no electrical supply
required** — only shop compressed air at **5–7 bar**, which cuts installation
time and simplifies work-cell setup.

### ATISmirus — rigid articulated arm
- Parallelogram vertical movement.
- Handles **cantilever / overhang loads up to 600 kg**.
- Described as the smallest in its category; movement in any direction without
  constraint, with precision and naturalness.
- Robust and versatile — the general-purpose line.
- Distributor listings reference sub-models **ATISMIRUS 100** and **ATISMIRUS 200**.
- URL: `/Prodotti/ATISMIRUS` · EN: `/en/industrial-manipulators/atismirus/`

### ATISacer — dual-rope
- Pneumatic **double-rope** manipulators, **up to 150 kg**.
- Compact design with a **dual safety rope**.
- Suited to products with a defined centre of gravity.
- URL: `/manipolatori-industriali/acer/`

### ATISlinear — rigid vertical movement
- Rigid vertical movement; slides on **overhead guide rails**, the flange
  connecting to the rails via trolley.
- Gives vertical **and** horizontal travel.
- **Max capacity 450 kg.**
- Very small footprint — the choice where space is constrained.
- URL: `/Prodotti/ATISLINEAR`

### ATISferax — lever manipulators
- For **limited spaces and intensive production cycles**.
- Available **column-mounted**, with **overhead arms**, or **overhead sliding**.
- Integrable with **customised gripping equipment**, designed to the specific
  application and fitted with the manual or pneumatic movements the handling
  cycle needs.
- URL: `/Prodotti/ATISFERAX`

---

## Gripping systems (*Sistemi di presa*)

Developed **in-house** to handle any product type, adapted to customer needs,
available operating space and the specific product, with explicit attention to
workstation ergonomic principles. Customisable per application.

| Type | Notes |
|---|---|
| Hook | `/en/gripping-systems/atis-manipulators-with-hook-systems/` |
| Integrated forks | Rapid, safe, effortless handling in tight spaces; millimetric control and better manoeuvrability than traditional systems; feeding production lines, bulky loads. `/sistemi-di-presa/manipolatori-atis-con-forche-integrate/` |
| Suction cups | `/Sistemi-di-presa/Manipolatori-a-ventose` |
| Magnets | Magnetic manipulators |
| Mechanical / pneumatic clamps | `/en/gripping-systems/atis-manipulators-with-pneumatic-clamps/` |

Index page: `/Sistemi-di-presa/Sistemi-di-presa`

---

## Configurations (*Esecuzioni*)

The range covers multiple installation configurations — column-mounted,
suspended, and further variants — selected by available space, operation
frequency and environmental conditions. All four model families (ATISMIRUS,
ATISACER, ATISLINEAR, ATISFERAX) offer solution and construction variants so the
unit can be fitted optimally into the customer's production context.

Index page: `/Esecuzioni`

---

## Application sectors

Automotive · food · pharmaceutical · ceramics · glass · mechanical engineering ·
chemicals · plastics · textiles · electronics · logistics · warehousing ·
metallurgy.

Documented application cases include: moulds/dies (*stampi*), reels and coils
(*bobine*), sacks and drums (*sacchi e fusti*), engines/motors, and aluminium
panels.

---

## Site structure — URLs discovered

The site carries **three URL generations simultaneously**, which matters for any
crawl or migration work:

1. **Legacy PHP:** `/web/index.php/...`
2. **Capitalised paths:** `/Prodotti/ATISMIRUS`, `/Azienda/Qualita`
3. **Modern lowercase slugs:** `/manipolatori-industriali/acer/`, `/sistemi-di-presa/...`

Plus a parallel English tree under `/en/`.

### Italian
- `/` and `/web/index.php/` — home
- `/Prodotti` · `/manipolatori-industriali/` — products index
- `/Prodotti/ATISMIRUS` · `/Prodotti/ATISLINEAR` · `/Prodotti/ATISFERAX`
- `/manipolatori-industriali/acer/`
- `/Esecuzioni` — configurations
- `/Sistemi-di-presa/Sistemi-di-presa` — gripping systems index
- `/Sistemi-di-presa/Manipolatori-a-ventose`
- `/sistemi-di-presa/manipolatori-atis-con-forche-integrate/`
- `/web/index.php/Azienda/Storia` — history
- `/Azienda/Qualita` — quality / ISO 9001
- `/Azienda/Distributori` — dealer & distributor search
- `/Movimentazione-manuale-dei-carichi/Manipolatori-industriali-ATIS`
- `/Movimentazione-manuale-dei-carichi/Vantaggi-nell-uso-dei-manipolatori-industriali-ATIS`
- `/Movimentazione-manuale-dei-carichi/Movimentazione-di-bobine-Efficienza-e-Sicurezza-con-i-Manipolatori-ATIS`
- `/blog/manipolatore-pneumatico-industriale-per-stampi/`

### English
- `/en/` — home
- `/en/company/` · `/en/Company/Presentation` · `/en/company/method/`
- `/en/contacts/`
- `/en/solutions/`
- `/en/industrial-manipulators/atismirus/`
- `/en/gripping-systems/atis-manipulators-with-hook-systems/`
- `/en/gripping-systems/atis-manipulators-with-pneumatic-clamps/`
- `/en/blog/atis-manipulators-the-ultimate-solution-for-manual-load-handling/`
- `/en/blog/industrial-pneumatic-motor-manipulator/`
- `/en/blog/industrial-pneumatic-manipulator-for-aluminium-panels/`

⚠️ This list is what search surfaced, **not** a crawl. `sitemap.xml` was not
retrievable, so the site almost certainly has more pages — particularly blog
posts and per-sector case pages.

⚠️ One indexed English page title reads *"Manipolatori INDEVA®, sistemi di
movimentazione evoluti…"* on `/en/solutions/`. INDEVA is a **competitor brand**
(Scaglia Indeva). A competitor trademark appearing in an ATIS page title is
either a comparison page or a stale/incorrect meta title worth flagging to the
site owner.

---

## Media inventory

### Images — none retrieved

**No image could be inventoried or labelled.** Doing so requires reading each
page's `<img>` elements for `src`, `alt`, `title` and surrounding caption, and
viewing the files. Both are blocked by the network policy described at the top.

No placeholder labels have been written, because a label describing an image
nobody has seen would be invented rather than retrieved.

What a working run would produce per image: source URL, existing alt text (and
whether it is missing/empty — likely an accessibility finding given the site's
age), rendered dimensions and file weight, page and section context, a written
description of the depicted subject, and a suggested alt text.

### Video — references only, not labelled

Search surfaced an ATIS video presence on YouTube. These are **link references
from search metadata**; none was opened, so none is labelled or verified.

| Reference | URL | Verified |
|---|---|---|
| Official channel | https://www.youtube.com/manipolatori | ❌ not opened |
| Playlist "Manipolatori ATIS" | https://www.youtube.com/playlist?list=PL1A52C12DFE5A3884 | ❌ not opened |
| "Manipolatore pneumatico industriale ATIS: le potenzialità dei bilanciatori che azzerano il peso!" (indexed as June 2011) | https://www.youtube.com/watch?v=UXaP3EFNqt0 | ❌ not opened |
| "40200062 Manipolatore pneumatico a funi ATIS per sacchi e fusti" | https://www.youtube.com/watch?v=nJMykWVhHio | ❌ not opened |

Channel description per search: demonstrations of manipulator applications
across industries, framed around ergonomics, workplace safety and productivity.

Whether any video is **embedded on the site itself** (vs. living only on
YouTube) could not be determined without page source.

---

## Confidence notes

- Everything above is sourced from search-result snippets and indexed titles for
  pages on `atismanipolatori.com`. It is genuine site content, but it is
  **snippet-level**, not full page text.
- Specific figures worth re-verifying on the live site before any external use:
  the 600 / 450 / 150 kg capacities, the 5–7 bar air requirement, the
  thirty-vs-forty years discrepancy, and the contact block.
- No pricing, no lead times, no dimensional drawings and no datasheet PDFs were
  retrieved. A `/Prodotti` PDF catalogue exists on DirectIndustry (third-party
  host) and would be a good secondary source once network access allows.
