# AOE Engineering — Reusable Patterns & Lessons

Patterns and gotchas from this build worth carrying into future company-site
work. Not AOE-specific content — the technique, not the copy.

## No-JS-safe scroll reveal

Pattern: give `<html>` a `.js` class via a synchronous inline script at the
very top of `<head>`, and scope the *hidden* starting state of
`.reveal` elements to `.js .reveal` rather than bare `.reveal`. If
JavaScript fails to load entirely, content stays visible by default
instead of permanently stuck at `opacity: 0`.

```css
.js .reveal{opacity:0; transform:translateY(24px); transition:opacity .7s, transform .7s;}
.js .reveal.is-visible{opacity:1; transform:translateY(0);}
```

**Gotcha hit here:** writing `html.js .reveal{...}` (element selector +
class) instead of `.js .reveal{...}` (class + class) changes specificity
just enough that `.reveal.is-visible` (two classes) no longer wins the
cascade — content silently stayed invisible after reveal fired. Keep both
rules at matching specificity.

## `backdrop-filter` breaks `position: fixed` descendants

A `backdrop-filter` (or `filter`/`transform`/`perspective`) on an ancestor
creates a new CSS containing block for any `position: fixed` descendant —
it stops being positioned relative to the viewport and instead positions
relative to that filtered ancestor. Hit this with a frosted-glass sticky
header containing a `position: fixed` mobile nav flyout: the flyout
rendered squashed into the header's own ~70px height instead of covering
the viewport. Fix: put the blur on a `::before` pseudo-element instead of
the header element itself, so the header stays unfiltered and doesn't
intercept its fixed-position children.

## Testing "animates on scroll" needs a *real* scroll, not a teleport

`page.evaluate(() => window.scrollTo(0, y))` in rapid succession can
interact badly with `scroll-behavior: smooth` (CSS) and under-deliver
IntersectionObserver callbacks — giving a false "nothing is revealing"
result that isn't how real users experience the page. Test with
`page.mouse.wheel(0, delta)` in a loop instead; it matches real input and
gave the true (passing) result when the teleport method gave a false
negative.

## axe-core measures rendered pixels, not CSS values, for contrast

A hex value that passes a manual WCAG contrast calculation (or an isolated
test page) can still fail on the real page, because axe-core samples the
actual rendered/anti-aliased pixel colour, which shifts slightly with font,
weight and sub-pixel rendering. A colour sitting within ~0.05 of the 4.5:1
boundary is not safely passing — it's one font-rendering difference away
from failing. Give muted/secondary text real margin (aim for ≥5:1), not a
value that only just clears the line in one test.

## Lighthouse's `link-text` audit doesn't read `aria-label`

It flags generic link text ("Learn more", "click here") by reading literal
text content, not the computed accessible name — so adding `aria-label`
alone won't satisfy it (though it does genuinely help screen-reader users).
Fix properly by making the *visible* text itself specific per instance
("Explore gantry cranes" instead of "Learn more") — it fixes the audit, is
more robust for assistive tech, and reads better for sighted users too.

## Self-hosting Google Fonts without guessing

Fetch Google's own generated CSS for the exact family/weight list already
in use (with a real browser UA), parse out only the `/* latin */`
`@font-face` blocks (skip cyrillic/greek/vietnamese subsets for an
English-only site), download the referenced `.woff2` URLs, and point local
`@font-face` rules at the downloaded files. A single file shared across
several declared weights (e.g. Inter at 400/500/600 all resolving to the
same URL) usually means that family ships as a variable font — confirm by
file size (meaningfully larger than a single static weight) rather than
assuming it's an error.

## Single-page interactive demo from a real multi-page static site

To let someone click through a real multi-page site inside a sandboxed
preview (e.g. a Claude Artifact) without rebuilding it as a SPA from
scratch: extract each page's `<header>`/`<main>`/`<footer>`
programmatically, rewrite `page.html` and `page.html#anchor` links to a
flat hash token (`#page` / `#page--anchor` — artifact/iframe sandboxes
often only support bare anchor tokens in `location.hash`, not
`#key=value`), wrap each page's content in a `.route-page[data-page]` div
shown/hidden by a small hash-router, and keep the *exact* same CSS/JS
behaviour (reveal-on-scroll, counters) unchanged — IntersectionObserver
handles elements moving from `display:none` to visible correctly without
extra re-triggering code.

## Platform-contract adjustments for a sandboxed preview

A `mailto:` form-submit handler that works perfectly on a real deployed
site may silently do nothing inside a sandboxed artifact viewer. Don't
let the UI claim an action happened ("your email client should now be
open") when the environment can't confirm it did — show the direct
contact details as visible, selectable text instead, framed honestly
("in this preview, email directly: ...").
