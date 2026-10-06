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
