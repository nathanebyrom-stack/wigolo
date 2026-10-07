# Concept renders (in progress)

`step1-base-5l-empty.webp` is FLUX.1 Kontext-dev's edit of `reference-vessels/rhs-5l-planted.webp`
(cropped to the bottle, not padded). It has the empty RHS belly bottle on slate against charcoal, and it's the approved base for the scroll build.

## What we learned on the first run
- **FLUX.1 Krea-dev text-to-image doesn't hold the bottle shape.** It drew square-shouldered,
  teardrop and (with the word "demijohn") handled jugs. Don't use Krea for any frame with a bottle in it.
- **Kontext from the real product photo does.** Build the scroll sequence forwards from this base
  (add soil → plants → figures → LED on), one edit per step, feeding each output into the next.
- **Don't pad the reference with white bars to reach 4:5.** Kontext then invents a wine bottle.
  Crop to the bottle and accept the aspect ratio, or crop the output afterwards.
- The free ZeroGPU quota runs out after about 6 renders (roughly 90 s of GPU time each) and resets after 24 h.

## Tools
`tools/gen.py krea|kontext ...` calls the `mcp-tools` Gradio spaces. `tools/sheet.py` makes a contact sheet for review.

## Decision 6 Oct 2026: no figures inside the terrarium
Figures personalise a piece too much. No terrarium image may show figures inside the glass.
Figures are a separate selection: each set is photographed on its own, and on the site the sets sit
beside the terrarium or down the side of the screen. No more than 10 categories. Current range (8):

1. The Gathering: mixed-race group of six (one set)
2. Christmas: Santa, snowman, reindeer, small wrapped present
3. Valentine's: couple on a bench with a small red heart
4. Wedding: bride and groom
5. Family: two parents, two children
6. Pets: a dog and a cat
7. The Golfer: golfer with putter and pin flag
8. The Adventurer: hiker with backpack and walking pole

Scroll build Step 4 ("Choose Your Figures") shows the planted bottle unchanged, with a small figure set
standing on the slate beside it, never inside. Gallery and flagship renders drop the figures from their prompts.
Figure-set renders use Krea (no bottle in frame, so shape drift doesn't matter): studio macro shot of
hand-painted 1:87-scale figures on slate against charcoal, matching the scroll set-up.

## Run of 7 Oct 2026 (6 renders, then quota)
- **Approved master: `scroll-step3-planted-master.webp`.** The real RHS 15 L planted photo
  (`reference-vessels/rhs-15l-planted-full.webp`, cropped 150,20,850,950), restaged by Kontext onto slate
  against charcoal. It has real plants, real glass and real condensation. Steps 2, 1, 4 and 5 are edited
  from this frame so all five share one camera:
  - Step 2: remove all plants, leaving the flat soil, with pebbles visible at the bottom against the glass.
  - Step 1: from Step 2, remove all soil and pebbles, leaving clean empty glass.
  - Step 4: from Step 3, add a small set of hand-painted miniature figures standing on the slate BESIDE the bottle.
  - Step 5: from Step 4, turn on a warm LED glow from the cork.
- `empty-15l-from-tagged-photo.webp`: a good empty 15 L (tag removed) from a *different* photo, so its
  camera doesn't match the master. Keep it for flagships and size cards, not the scroll.
- Rejected: Kontext *adding* substrate or plants to an empty bottle. It gave a cocoa-powder mound,
  soil and pebble layers in the wrong order, and a cut-out fern with moss balls. Kontext removes things well
  and invents planting badly, so start from real planted photos.
