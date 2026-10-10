# Moss & Memory: weekly social image batch

Goal: inspiration images for Instagram and Pinterest, and for customers. Terrariums shown in real room
settings with varied planting. One batch a week, delivered to the **Social Library** page and this folder.

**Timing (user's rule, 10 Oct):** all image work runs at the end of the week, on spare Claude allowance.
The social batch runs Sunday evening, and leftover website image work (gallery, figure sets, plant thumbnails) on
Saturdays. Commit after every approved image, so a run stopped by the usage limit keeps its work.
The user posts them by hand; nothing is ever published to a social account automatically.

## Hard rules (same as the website)
- Vessel: only the three stocked pale-teal recycled-glass belly bottles with natural cork (RHS 5 L, RHS 15 L,
  Whipe 35 L). Start every image from an approved real-bottle frame, never Krea text-to-image (it can't hold the shape).
- No figures inside the glass. A figure set may stand beside the bottle.
- At least two colour accents in the planting, not just green (purple velvet plant, red/pink fittonia,
  Black Bat begonia, silver aluminium plant, red-spotted begonia).
- Reject anything with a warped or changed bottle, melted figures, hands, text or logos, or a floating light inside the glass.
  The LED is in the cork.
- Every caption ends with "Concept render", because these are AI renders of pieces not yet built.

## Method (see renders/README.md for what worked and what failed)
1. Pick a base frame from `renders/` (5 L: flagship-5l-base / flagship-5l-lit; 15 L: scroll/step3-plants /
   scroll/step5-light; 35 L: flagship-35l-base / flagship-35l-colour).
2. One Kontext change per edit (`renders/tools/gen.py kontext`, guidance 2.5, 28 steps):
   `Place this exact terrarium on [SURFACE] in [ROOM + TIME]. [LIGHTING MOOD]. Keep the bottle shape, glass,
   cork, plants and soil exactly the same. Photorealistic interior photograph.`
3. Planting variety comes from recolouring existing plants or swapping bases, never inventing new plants (it fails).
   When Kontext over-applies an edit, mask-blend only the wanted region from the edited frame (same camera).
4. Rolling ZeroGPU quota: run renders in a background retry loop (try, wait 120 s, retry). Aim for 6–10
   approved images per batch, and stop at about 2 hours.
5. Crop and export each approved image twice: Instagram 4:5 at 1080 × 1350, and Pinterest 2:3 at 1000 × 1500 (WebP, q≈85).
   Outpaint with Kontext only if a crop would cut the bottle.

## Rotation (log every combination in `log.csv`; don't repeat a vessel + surface + room within 4 weeks)
- Surface: oak coffee table · bedside nightstand beside linen · bookshelf · fireplace mantel · marble kitchen
  island · walnut sideboard · home-office desk · windowsill (indirect light, never direct sun) · console table in a hallway
- Room + time: Scandinavian living room at golden hour · cosy lounge after dark · sunlit reading nook ·
  candlelit dining room · calm bedroom at dusk · minimalist studio flat in the morning
- Lighting: soft window light with warm accents · low-key candlelight · blue-hour dusk through the window ·
  LED glow on after dark
- Season (when relevant): Christmas garland and warm lights (Nov–Dec) · Valentine's (late Jan–Feb) ·
  Mother's Day (Mar) · spring brightness (Apr–May)
- Planting variant: base colour accents · deeper reds · silver and purple · lush ferns with one red accent

## Captions (write both for every image)
- Instagram: 2–3 short sentences in the brand voice (warm and calm, plain words, no hype), one line on the
  occasion or room, a soft call to action ("Design yours: link in bio"), then 8–15 hashtags mixing broad and niche
  (#terrarium #bottlegarden #closedterrarium #plantdecor #livingart #giftideas #ukmade …), last line "Concept render".
- Pinterest: a title under 100 characters, front-loaded with keywords ("Closed bottle terrarium on an oak coffee
  table: living décor idea"), and a description of 2–3 sentences with natural keywords (terrarium gift, low-maintenance
  plant décor, bottle garden), ending with "Concept render".

## Delivery
- `social/images/YYYY-MM-DD/<slug>-ig.webp` and `<slug>-pin.webp`, plus `social/captions.json` (append) and `log.csv`.
- Republish the **Social Library** artifact (URL in `social/LIBRARY_URL`) with the new batch on top: image previews,
  a download link for each format, and copy buttons for each caption.
