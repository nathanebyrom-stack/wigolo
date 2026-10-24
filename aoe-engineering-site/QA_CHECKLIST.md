# AOE Engineering — QA Checklist

Last verified: this session (all green). Re-run the whole block below after
any change before considering it done — don't trust a change until it's
been through this, not just eyeballed.

## Setup (once per session)

```bash
cd aoe-engineering-site && python3 -m http.server 4173 &
mkdir -p /tmp/aoe-qa && cd /tmp/aoe-qa && npm init -y >/dev/null 2>&1
npm install playwright axe-core html-validate --no-save
```

## 1. Accessibility — axe-core via Playwright (target: 0 violations, every page)

Run a Playwright script that loads each of the 7 pages against
`localhost:4173`, injects `axe-core/axe.min.js`, runs `axe.run()`, and also
captures `console` errors, `pageerror` events and `requestfailed` events.
(Full script previously lived at the scratchpad path used during
development — rewrite it fresh each session rather than assuming a path
survives a container restart.) Current state: **0 violations, 0 console
errors, 0 failed requests across all 7 pages.**

## 2. HTML conformance — html-validate (target: exit 0)

```bash
npx html-validate -c <(cat <<'EOF'
{"extends": ["html-validate:recommended"], "rules": {"no-inline-style": "off", "require-sri": "off"}}
EOF
) aoe-engineering-site/*.html
```
Current state: **exit 0.** (Caught and fixed 27 real issues once — missing
button types, breakable phone numbers, two over-length `<title>`s. See
DEVELOPMENT_LOG.md.)

## 3. Internal link/anchor integrity (target: 0 broken)

Custom script: collect every `href` across all 7 pages; for `file.html`
confirm the file exists; for `file.html#anchor` confirm an `id="anchor"`
exists in that target file; for bare `#anchor` confirm it exists in the
same file. Skip `http(s)/mailto/tel/data:` links. Current state: **0
broken links/anchors.**

## 4. Lighthouse (target: Accessibility 100, Best Practices 100, SEO 100)

```bash
CHROME_PATH=/opt/pw-browsers/chromium npx lighthouse http://localhost:4173/<page>.html \
  --output=json --chrome-flags="--headless=new --no-sandbox" \
  --only-categories=performance,accessibility,best-practices,seo --quiet
```
Current state (all 7 pages): **Accessibility 100, Best Practices 100, SEO
100** (404.html's SEO score is lower by design — Lighthouse correctly
flags its intentional `noindex`; leave it). **Performance 98-99**, capped
by Python's bare dev server having no compression/cache headers — not a
code defect, verify properly once real hosting is chosen.

## 5. JSON-LD structured data (target: valid JSON on every indexable page)

```bash
python3 -c "
import re, json
for f in ['index.html','about.html','capabilities.html','sectors.html','contact.html','privacy.html']:
    text = open(f'aoe-engineering-site/{f}').read()
    for b in re.findall(r'<script type=\"application/ld\+json\">(.*?)</script>', text, re.S):
        json.loads(b)
    print(f, 'ok')
"
```
Current schema: `LocalBusiness` (with `openingHoursSpecification`) +
`BreadcrumbList` on the 5 inner pages that show a visible breadcrumb.

## 6. Functional — contact form

Fill all fields, submit, confirm `.form-success` becomes visible and the
constructed `mailto:` string (subject + body) is well-formed and under
length limits. Verified working.

## 7. Visual regression

Screenshot every page at desktop (1440px) and mobile (390px) after any CSS
change; confirm the reveal-on-scroll animation fires under *real* scroll
input (`page.mouse.wheel`), not just a teleporting `scrollTo` (which can
give false negatives — see DEVELOPMENT_LOG.md for why).

## Known non-issues (don't "fix" these again)

- Lighthouse Performance 98-99, not 100 — dev-server artifact, not code.
- 404.html SEO score lower than other pages — correct, it's `noindex`.
- `unused-css-rules` / `unminified-css` Lighthouse insights — deliberate
  trade-offs (one shared stylesheet, no build step) for a 5-page static
  site, not oversights.
