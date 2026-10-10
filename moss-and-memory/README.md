# Moss & Memory: terrarium site assets

Working files for the Moss & Memory bespoke terrarium website.

- Live site (artifact): https://claude.ai/artifact/SA4w2mTEnYzzwVs138Pcuh
- Brand & visual pack (copy + Flux prompts): https://claude.ai/code/artifact/0fbdcfbf-f3fe-4824-bbbb-0b1c5dd76fef

| Path | What it is |
| --- | --- |
| `index.html` | Standalone copy of the current site (open in a browser) |
| `plants.json` | Plant library data used by the site (60 plants; `img` is null until thumbnails are rendered) |
| `terrarium-plant-catalogue.xlsx` / `.csv` | 60-plant catalogue from Grow Tropicals (5 Oct 2026) with a Flux prompt per plant |
| `reference-vessels/` | Screenshots of the three stocked belly bottles, for use as FLUX.1 Kontext input images |

## Vessels (all designs use these until further notice)

| Size | Product | Dimensions |
| --- | --- | --- |
| 5 L | RHS Plants "Plant terrarium bottle 5 litre set" | approx. 30 cm tall (unconfirmed) |
| 15 L | RHS Plants "Plant terrarium bottle 15 litre set" | approx. 42 cm tall (unconfirmed) |
| 35 L | Brambly Cottage "Whipe Terrarium Bottle 35 Litre Set" (Wayfair) | 55.5 × 39.3 cm |

Note: `reference-vessels/` shows the 5 L and 15 L bottles planted, not empty; crop or edit them before using them as Kontext inputs for the empty Step 1 frame.

## Reference photos added 6 Oct 2026
Full product photos captured from rhsplants.co.uk (15 L set: Ø30 × H44 cm, £51.99, in stock on 6 Oct).
`rhs-15l-empty-tagged.webp` and `rhs-5l-empty-tagged.webp` show the empty bottles. Remove the neck tag with Kontext before using them as a base.
`rhs-15l-product-page.webp` is a screenshot of the product page.
