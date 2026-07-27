# ATIS Manipolatori — site information retrieval

**Target:** https://www.atismanipolatori.com
**Retrieved:** 2026-07-27
**Method:** search-index retrieval only (see *Retrieval status* below)

---

## Retrieval status — read first

| Task | Status |
|---|---|
| Retrieve all information | **Substantial** — company, products, services, certifications, distributor network, full site taxonomy. Sourced from the search index, not from page source |
| Label images and video | **Structure recovered, individual assets not labelled** — the site's own photo/video gallery taxonomy is mapped below, but no image or video file could be opened |

**Why.** This session's environment enforces an egress network policy that denies
all outbound HTTPS except an allow-list (Anthropic endpoints, package registries,
GitHub). Every direct fetch returns `403` at the proxy *before* reaching the target:

- `curl https://www.atismanipolatori.com` → `CONNECT tunnel failed, response 403`
- Identical 403 for `https://example.com`, so this is **not** ATIS blocking us —
  it is the session's own policy blocking every non-allow-listed host
- `WebFetch` returns `403 Forbidden` for every URL including `example.com`
- Playwright/Chromium routes through the same proxy and fails identically
- Re-tested mid-task; still blocked

Only web **search** works, since it terminates inside the allowed Anthropic API
surface. Everything below is therefore genuine ATIS site content recovered from
indexed titles and snippets — but it is snippet-level, not verified page source.

**What this means for the media half.** I recovered the *organisation* of the
site's media — a 26-category photo gallery and a ~12-category video gallery,
with the site's own category names, which are themselves labels. What I could
not do is open individual `<img>`/`<video>` elements to read `src`, `alt`,
`poster` and captions, or view the assets to describe them. **No invented labels
appear below.** Where an asset was not seen, it is marked as such.

**To unblock:** re-run in an environment whose network policy allows
`www.atismanipolatori.com` (plus `youtube.com` / `img.youtube.com` for video
thumbnails). Network policy is fixed when the environment is created — see
https://code.claude.com/docs/en/claude-code-on-the-web.

---

## Company profile

ATIS Srl designs and builds **pneumatic industrial manipulators** for the safe
handling of heavy, fragile, bulky or hazardous loads.

- **Founded:** 2006
- **Background:** prior sector experience — the Storia page says *"trentennale"*
  (thirty years); another indexed page says *"40 years"*.
  ⚠️ These conflict across pages; verify against the live site
- **Positioning:** highly specialised in industrial handling, covering design and
  manufacture, with per-customer bespoke solutions
- **Core claim:** near-eliminates operator physical effort, sharply reducing
  injury and occupational-illness risk
- **Platform:** WordPress — a `/wp-content/uploads/2025/10/` asset path is indexed
- **LinkedIn:** https://www.linkedin.com/company/atismanipulators/

### Contact details

| Field | Value |
|---|---|
| Address | Via Trento, 112–114 — 38017 Mezzolombardo (TN), Italy |
| Phone | +39 0461 662031 |
| Fax | +39 0461 662484 |
| Email | atis@atismanipolatori.com |

⚠️ A separate domain `atis-srl.it` also surfaced with a *Contatti* page. Whether
it is a legacy domain, a related entity or an unrelated company was **not**
verified — do not assume it is the same business.

### Working method (`/en/company/method/`)

The stated process: collaborate with the customer to understand and analyse
their real handling need, design the product together, then build it to high
quality and safety standards. The technical office develops the tooling **around
the product to be lifted** — every gripping system is unique. Sophisticated **3D
design software** simulates the handling motion, and that simulation is shared
with the customer before build. Framed throughout as a "made-to-measure" product.

### Quality and certifications

- **ISO 9001** — quality management system to UNI EN ISO 9001, with scope
  declared as *"design, manufacture, commercialization, installation and
  post-sale assistance of manipulators"*
- Published policy PDF: `/wp-content/uploads/2025/10/Politica-qualita-ATIS.pdf`
- **CE marking / Machinery Directive** — certifies conformity with European
  construction and safety requirements
- **ATEX** — manipulators available ATEX-certified for potentially explosive
  atmospheres, with a dedicated video gallery category
- Every manipulator is tested in **real and extreme working conditions**

⚠️ The certifications page cites **ATEX 94/9/CE**. That directive was repealed
and replaced by **2014/34/EU** in April 2016 — the reference is a decade out of
date and is worth flagging to the site owner.

### Careers (`/Azienda/Carriera`)

Open-role page recruiting **designers/engineers (progettisti)**, **service
technicians (tecnici di assistenza)** and **assembly operators (operatori
assemblaggio)**.

---

## Product lines

All four lines are pneumatic and share one defining trait: **no electrical
supply required** — only shop compressed air at **5–7 bar**, cutting installation
time and simplifying work-cell setup.

### ATISmirus — rigid articulated arm
- Parallelogram vertical movement
- **Cantilever / overhang loads up to 600 kg**
- Described as the smallest in its category; unconstrained movement in any
  direction, with precision and naturalness
- Robust and versatile — the general-purpose line
- Sub-models **ATISMIRUS 100** and **ATISMIRUS 200** appear in distributor listings
- `/Prodotti/ATISMIRUS` · EN `/en/industrial-manipulators/atismirus/`

### ATISlinear — rigid vertical movement
- Slides on **overhead guide rails**, flange connecting via trolley
- Vertical **and** horizontal travel
- **Max capacity 450 kg**
- Very small footprint — for space-constrained applications
- `/Prodotti/ATISLINEAR`

### ATISacer — dual-rope
- Pneumatic **double-rope** manipulators, **up to 150 kg**
- Compact, with a **dual safety rope**
- For products with a defined centre of gravity
- `/manipolatori-industriali/acer/`

### ATISferax — lever manipulators
- For **limited spaces and intensive production cycles**
- **Column-mounted**, **overhead arms**, or **overhead sliding**
- Integrable with customised gripping equipment, fitted with the manual or
  pneumatic movements the handling cycle requires
- `/Prodotti/ATISFERAX`

### Product terminology used on the site
*Manipolatori pneumatici* · *bilanciatori* (balancers) · **azzeratori di peso**
(literally "weight zeroers") · *azzeratori di gravità*. The "zero the weight"
framing is the site's central marketing concept and has its own page:
`/Movimentazione-manuale-dei-carichi/Azzeratori-di-peso`

---

## Gripping systems (*Sistemi di presa*)

Developed **in-house** to handle any product type, adapted to customer needs,
available operating space and the specific product, with explicit attention to
workstation ergonomics. Customisable per application.

| Type | URL |
|---|---|
| Hook | `/en/gripping-systems/atis-manipulators-with-hook-systems/` |
| Integrated forks | `/sistemi-di-presa/manipolatori-atis-con-forche-integrate/` |
| Suction cups | `/Sistemi-di-presa/Manipolatori-a-ventose` |
| Magnets | (magnetic manipulators) |
| Mechanical / pneumatic clamps | `/en/gripping-systems/atis-manipulators-with-pneumatic-clamps/` |

Integrated forks are pitched on rapid, effortless handling in tight spaces, with
millimetric control and better manoeuvrability than traditional systems — for
feeding production lines and handling bulky loads.

Index: `/Sistemi-di-presa/Sistemi-di-presa`

---

## Configurations (*Esecuzioni*) — `/Esecuzioni`

Multiple installation configurations — column-mounted, suspended, and further
variants — selected by available space, operation frequency and environmental
conditions. All four families (ATISMIRUS, ATISACER, ATISLINEAR, ATISFERAX) offer
solution and construction variants so the unit fits the customer's production
context.

---

## Distributor network

A global network of distributors and agents, with an active call for new sales
partners abroad (`/en/Company/Sales-Partners`, `/Azienda/Distributori`).

| Region | Countries |
|---|---|
| Europe | Austria, Belgium, Finland, France, Germany, Ireland, Luxembourg, Netherlands, Poland, United Kingdom, Czech Republic, Romania, Serbia, Spain, Switzerland, Turkey, Hungary |
| Americas | Argentina, Brazil, Canada, Colombia, Mexico, United States |
| Asia | Indonesia, Israel, Thailand, Vietnam |
| Africa | Algeria, Tunisia |
| Oceania | New Zealand |

---

## MEDIA — photo gallery (`/Applicazioni/Applicazioni-Foto`)

The site's main image repository, organised as a **numbered 26-category
taxonomy** by industry/product, each category holding sub-pages of photographed
installations. These category names are **the site's own labels**, recovered
from indexed page titles.

### Categories confirmed with live URLs

| # | Category | Sub-page(s) confirmed | URL |
|---|---|---|---|
| 01 | Automotive | `Sedili` (seats), `Ruote` (wheels) | `/Applicazioni/Applicazioni-Foto/01.-Automotive/Sedili` · `.../Ruote` |
| 02 | Scatole-Fusti-Pallet (boxes, drums, pallets) | `4.-Sacchi` (sacks), `5.-Pallet` | `/Applicazioni/Applicazioni-Foto/02.-Scatole-Fusti-Pallet/4.-Sacchi` · `.../5.-Pallet` |
| 08 | Bobine (coils/reels) | `Bobine` | `/Applicazioni/Applicazioni-Foto/08.-Bobine/Bobine` |
| 09 | Bottiglie (bottles) | `Bottiglie` | `/Applicazioni/Applicazioni-Foto/09.-Bottiglie/Bottiglie` |
| 13 | Stampi-Fonderia-Fusioni (moulds, foundry, castings) | `Fusioni-motori` (engine castings) | `/Applicazioni/Applicazioni-Foto/13.-Stampi-Fonderia-Fusioni/Fusioni-motori` |
| 14 | Arredamenti (furniture) | `Arredamenti` | `/Applicazioni/Applicazioni-Foto/14.-Arredamenti/Arredamenti` |
| 16 | Lamiere (sheet metal) | `Lamiere` | `/Applicazioni/Applicazioni-Foto/16.-Lamiere/Lamiere` |
| 17 | Elettromeccanica (electromechanical) | `1.-Motori-elettrici` (electric motors, rotors, stators) | `/Applicazioni/Applicazioni-Foto/17.-Elettromeccanica/1.-Motori-elettrici` |

### Full category list as reported by the index page

Automotive · Boxes/Drums/Pallets · Sacks · Windows & frames · Crates ·
Cylinders · Various appliances · Coils · Bottles · Gres slabs · Sanitaryware ·
Glassware · Foundry moulds & castings · Furnishings · Mechanics · Sheet metal ·
Electromechanics · Plant maintenance · Solar/photovoltaic panels · Profiles ·
Thermal furnishings (termoarredi) · Surface-treatment plants · Medical sector ·
Special applications · Various · Trade shows

⚠️ The numbering above (01, 02, 08, 09, 13, 14, 16, 17) is **confirmed from
indexed URLs**. The remaining numbers in the 01–26 range are inferred from the
index-page category list and are **not** individually URL-confirmed.

### Image-level labelling — not done

**No individual image was retrieved, viewed or labelled.** That requires reading
each gallery page's `<img>` elements (`src`, `alt`, `title`, caption) and viewing
the files — both blocked. No placeholder descriptions have been written, because
a label for an image nobody has seen would be invented rather than retrieved.

A working run would produce, per image: source URL, existing `alt` text and
whether it is missing or empty (likely an accessibility finding given the site's
age and its legacy URL generations), file weight and dimensions, the gallery
category and sub-page it belongs to, a description of the depicted
manipulator/application, and a suggested alt text.

---

## MEDIA — video gallery (`/Applicazioni/Applicazioni-Video`)

A parallel video gallery, organised by the same industry logic but with a
**flatter, unnumbered slug scheme**.

### Categories confirmed with live URLs

| Category | URL | Subject per indexed title |
|---|---|---|
| Presentazione ATIS | `/Applicazioni/Applicazioni-Video` (index) | Company/manipulator presentation |
| Automotive | `/Applicazioni/Applicazioni-Video/Automotive` | Automotive handling |
| Bobine | `/Applicazioni/Applicazioni-Video/Bobine` | *"Manipolatori pneumatici ATIS bobine — azzeratori di peso bobine"* |
| Direttiva ATEX | `/Applicazioni/Applicazioni-Video/Direttiva-ATEX` | *"manipolatori pneumatici per ambienti esplosivi soggetti a direttiva ATEX"* |
| Imballaggi e contenitori | `/Applicazioni/Applicazioni-Video/Imballaggi-e-contenitori` | *"movimentazione scatole, sacchi, cassette e altro ancora"* |
| Lamiere | `/Applicazioni/Applicazioni-Video/Lamiere` | *"Manipolatori per lamiere, bilanciatori di carico, azzeratori di peso"* |
| Arredi | `/Applicazioni/Applicazioni-Video/Arredi` | *"movimentare termoarredi in sicurezza ed efficienza"* |
| Vetri e serramenti | `/Applicazioni/Applicazioni-Video/Vetri-e-serramenti` | Glass and window frames |
| Meccanica | (category reported on index) | Mechanics |
| Motori | (category reported on index) | Motors |
| Pannelli solari / Fotovoltaici | (category reported on index) | Solar / photovoltaic panels |
| Varie | `/web/index.php/Applicazioni/Applicazioni-Video/Varie` | Miscellaneous |

### External video — YouTube

References recovered from search metadata. **None was opened**, so none is
labelled or verified beyond its indexed title.

| Reference | URL |
|---|---|
| Official channel | https://www.youtube.com/manipolatori |
| Playlist "Manipolatori ATIS" | https://www.youtube.com/playlist?list=PL1A52C12DFE5A3884 |
| *"Manipolatore pneumatico industriale ATIS: le potenzialità dei bilanciatori che azzerano il peso!"* (indexed as June 2011) | https://www.youtube.com/watch?v=UXaP3EFNqt0 |
| *"40200062 Manipolatore pneumatico a funi ATIS per sacchi e fusti"* | https://www.youtube.com/watch?v=nJMykWVhHio |

Channel framing per search: application demonstrations across industries, around
ergonomics, workplace safety and productivity.

### Video-level labelling — not done

Whether the on-site gallery **embeds YouTube** or self-hosts video files could
not be determined without page source. No video file, poster frame, duration or
caption was retrieved. The `40200062` prefix on one title looks like an internal
job or article number — a useful key if you have access to ATIS systems.

---

## Site structure

The site runs **three coexisting URL generations**, which matters for any crawl,
audit or migration:

1. **Legacy PHP:** `/web/index.php/...`
2. **Capitalised paths:** `/Prodotti/ATISMIRUS`, `/Azienda/Qualita`, `/Applicazioni/Applicazioni-Foto/...`
3. **Modern lowercase slugs:** `/manipolatori-industriali/acer/`, `/sistemi-di-presa/...`, `/blog/...`

Plus a parallel English tree under `/en/`. The `/wp-content/` path confirms
WordPress underneath.

### Italian pages
- `/` · `/web/index.php/` — home
- `/Prodotti` · `/manipolatori-industriali/` — products index
- `/Prodotti/ATISMIRUS` · `/Prodotti/ATISLINEAR` · `/Prodotti/ATISFERAX`
- `/manipolatori-industriali/acer/`
- `/Esecuzioni`
- `/Sistemi-di-presa/Sistemi-di-presa` · `/Sistemi-di-presa/Manipolatori-a-ventose`
- `/sistemi-di-presa/manipolatori-atis-con-forche-integrate/`
- `/Applicazioni/Applicazioni-Foto` (+ 26 categories)
- `/Applicazioni/Applicazioni-Video` (+ ~12 categories)
- `/Servizi/Soluzioni-personalizzate`
- `/web/index.php/Azienda/Storia` — history
- `/Azienda/Qualita` — ISO 9001
- `/Azienda/Sicurezza-e-certificazioni` — CE, Machinery Directive, ATEX
- `/Azienda/Distributori` — dealer & distributor search
- `/Azienda/Carriera` — careers
- `/Movimentazione-manuale-dei-carichi/Manipolatori-industriali-ATIS`
- `/Movimentazione-manuale-dei-carichi/Vantaggi-nell-uso-dei-manipolatori-industriali-ATIS`
- `/Movimentazione-manuale-dei-carichi/Movimentazione-di-bobine-Efficienza-e-Sicurezza-con-i-Manipolatori-ATIS`
- `/Movimentazione-manuale-dei-carichi/Azzeratori-di-peso`
- `/wp-content/uploads/2025/10/Politica-qualita-ATIS.pdf`

### Italian blog
- `/blog/manipolatore-pneumatico-industriale-per-stampi/` — hook tooling for mould changes; ATISmirus 100 on a self-supporting base for machine tooling
- `/blog/manipolatore-pneumatico-industriale-per-bobine-e-rotoli/` — pneumatic clamp for coils and rolls
- `/blog/nuovo-manipolatore-azzeratore-di-peso-atis-con-sistema-multiplo-di-presa-per-diverse-tipologie-di-prodotto/` — multi-grip tool handling bags, drums and boxes with one tool
- `/blog/manipolatore-pneumatico-per-sollevamento-motori-efficienza-sicurezza-e-zero-sforzi/` — engine lifting

### English pages
- `/en/` — home
- `/en/company/` · `/en/Company/Presentation` · `/en/company/method/`
- `/en/Company/Sales-Partners` · `/en/About-us-and-our-partners-in-the-world`
- `/en/contacts/` · `/en/solutions/`
- `/en/industrial-manipulators/atismirus/`
- `/en/gripping-systems/atis-manipulators-with-hook-systems/`
- `/en/gripping-systems/atis-manipulators-with-pneumatic-clamps/`
- `/en/blog/atis-manipulators-the-ultimate-solution-for-manual-load-handling/`
- `/en/blog/industrial-pneumatic-motor-manipulator/`
- `/en/blog/industrial-pneumatic-manipulator-for-aluminium-panels/`

⚠️ This is what search surfaced, **not** a crawl. `sitemap.xml` was not
retrievable, so more pages certainly exist — especially gallery sub-pages, where
26 photo categories each with multiple sub-pages implies well over a hundred
pages not individually enumerated here.

---

## Application sectors

Automotive · food · pharmaceutical · ceramics · glass · mechanical engineering ·
chemicals · plastics · textiles · electronics · logistics · warehousing ·
metallurgy · foundry · electromechanical · medical · solar/photovoltaic ·
furniture · sanitaryware · surface treatment.

Documented application cases: moulds and dies (*stampi*), coils and reels
(*bobine e rotoli*), sacks and drums (*sacchi e fusti*), boxes and crates,
pallets, engines and motors, electric motors/rotors/stators, aluminium panels,
sheet metal for laser-cutting and bending lines, car seats, car wheels, bottles,
gres slabs, glass and window frames, thermal radiators (*termoarredi*).

---

## Findings worth raising with the site owner

1. **Conflicting company age** — "thirty years" of prior experience on the Storia
   page vs "40 years" elsewhere.
2. **Outdated ATEX citation** — the certifications page cites ATEX **94/9/CE**,
   repealed and replaced by **2014/34/EU** in April 2016.
3. **Competitor trademark in a page title** — `/en/solutions/` carries an indexed
   title referencing **INDEVA®**, a Scaglia Indeva brand. Either a comparison
   page or a stale/incorrect meta title; worth checking either way.
4. **Three coexisting URL generations** plus a `/web/index.php/` legacy tree —
   likely duplicate-content and canonical-tag issues, and a migration left
   unfinished.
5. **Media accessibility is unverified and probably weak** — a photo gallery this
   large on a site carrying legacy URL structures is a strong candidate for
   missing `alt` attributes, but this could not be confirmed without page source.

---

## Confidence notes

- All ATIS facts above derive from search-result snippets and indexed titles for
  pages on `atismanipolatori.com`. Genuine site content, but **snippet-level**.
- Re-verify before external use: the 600 / 450 / 150 kg capacities, the 5–7 bar
  air requirement, the thirty-vs-forty-years discrepancy, the contact block, and
  the distributor country list.
- Not retrieved: pricing, lead times, dimensional drawings, datasheet PDFs, the
  full photo/video category numbering, and every individual media asset.
- A general-presentation PDF catalogue exists on DirectIndustry (third-party
  host) — a good secondary source once network access allows.
