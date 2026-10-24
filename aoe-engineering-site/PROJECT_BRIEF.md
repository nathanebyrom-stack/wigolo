# AOE Engineering — Project Brief

## What the business does
AOE Engineering Ltd designs, sources and supports industrial lifting and
handling equipment for UK manufacturers — hoists, grippers, gantry/overhead
cranes, and intelligent manipulators — either as its own build or as a
stand-alone delivery-management service (AOE brings together the right
partners and suppliers and carries the delivery risk).

Founded 2009 in Burnham, Berkshire (renamed from Andron Handling Solutions
Ltd by Gary Adams and David Ogden). £60M+ of equipment delivered. UK supply
and service partner for ATIS pneumatic manipulators (Italian manufacturer,
30+ years) — AOE is the distributor/service partner, not the manufacturer;
site copy is written to keep that distinction explicit throughout.

## Who buys
Engineering, operations and procurement contacts at UK manufacturers across
automotive, aerospace & defence, food & beverage, pharmaceutical/life
sciences, and general manufacturing/logistics — anyone specifying or
replacing lifting/handling equipment on a production line.

## What differentiates it
- Manages the whole delivery (design, sourcing, partner/supplier
  management, installation, aftercare) rather than just selling a product
  off a catalogue.
- Backs equipment it doesn't manufacture itself (the ATIS partnership) with
  its own UK engineering and aftercare team, rather than just reselling.
- Full lifecycle support: scheduled maintenance, statutory LOLER thorough
  examinations, operator training — not just a one-off sale.

## Primary call to action
"Talk to our engineers" / "Request a consultation" — get a named enquiry
(load, product, cycle time, timeline) into davidogden@aoeengineering.com,
either via the mailto-building contact form or directly by phone/email.

## Source rules
- No content reused from any previous AOE website build (this is a from-new
  redesign, not a migration).
- ATIS product/mounting information is drawn from ATIS's own published
  materials, limited to what's relevant to UK installation — no
  Italy-specific distributor/company material carried over.
- Contact details (email, phone, registered office address) are
  client-verified, not guessed.
- No stock photography; no AI-generated photography. All imagery is custom
  inline SVG built from the brand's own palette — see DESIGN_SYSTEM.md.

## Colours to use / avoid
Use: graphite, white, engineering blue (see DESIGN_SYSTEM.md for exact
tokens) with safety-yellow as a small machinery-accent only.
Avoid: no colours have been specifically ruled out by the client; the
palette was chosen to match the brief ("graphites, whites, blue") and to
read as credible UK industrial engineering rather than generic tech/SaaS.

## Target platform
Static HTML/CSS/JS, zero build step, zero external dependencies (fonts are
self-hosted — see DEVELOPMENT_LOG.md for why). Deployable to any static
host (GitHub Pages, Netlify, Cloudflare Pages, etc.) with no server-side
requirement. `robots.txt`/`sitemap.xml` assume deployment at
`www.aoeengineering.com` — update both if the real domain differs.

## Unverified / [CONFIRM] items
- Final deployment domain (SEO meta currently assumes www.aoeengineering.com)
- Whether analytics/tracking should be added (currently none, by design —
  see privacy.html, which states plainly that none exists)
- Company's actual trading address for cookie/privacy jurisdiction wording,
  if different from the registered office used throughout
