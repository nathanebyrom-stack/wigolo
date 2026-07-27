/**
 * Accessibility audit.
 *
 * Runs axe-core over every route at iPhone width, in both dark and light
 * themes, and fails on any serious or critical violation.
 *
 * Run against a running server: `node scripts/a11y.mjs [baseUrl]`
 */
import { createRequire } from "node:module";

import { chromium, devices } from "playwright";

const require = createRequire(import.meta.url);
const axePath = require.resolve("axe-core/axe.min.js");

const base = process.argv[2] ?? "http://localhost:3000";

const ROUTES = [
  "/",
  "/calendar",
  "/budget",
  "/journal",
  "/journal/new",
  "/book",
  "/roulette",
  "/stats",
  "/settings",
  "/offline",
  "/adventure/wasdale-head",
];

const browser = await chromium.launch({
  executablePath: process.env.CHROMIUM_PATH || undefined,
});

let total = 0;

for (const theme of ["dark", "light"]) {
  const context = await browser.newContext({
    ...devices["iPhone 14 Pro"],
    colorScheme: theme === "dark" ? "dark" : "light",
  });
  const page = await context.newPage();

  // next-themes reads this on boot, so the theme is applied before first paint.
  await page.addInitScript(
    (value) => window.localStorage.setItem("theme", value),
    theme,
  );

  console.log(`\n${theme}:`);

  for (const route of ROUTES) {
    await page.goto(`${base}${route}`, { waitUntil: "domcontentloaded" });
    await page.waitForTimeout(1100);
    await page.addScriptTag({ path: axePath });

    const { violations } = await page.evaluate(async () => {
      return await window.axe.run(document, {
        resultTypes: ["violations"],
        runOnly: {
          type: "tag",
          values: ["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "best-practice"],
        },
      });
    });

    const serious = violations.filter(
      (v) => v.impact === "serious" || v.impact === "critical",
    );

    total += serious.length;

    if (serious.length === 0) {
      console.log(`  ok    ${route}`);
    } else {
      console.log(`  FAIL  ${route}`);
      for (const violation of serious) {
        console.log(`          [${violation.impact}] ${violation.id}: ${violation.help}`);
        for (const node of violation.nodes.slice(0, 3)) {
          console.log(`            ${node.target.join(" ")}`);
          const summary = (node.failureSummary ?? "").split("\n")[1];
          if (summary) console.log(`              ${summary.trim()}`);
        }
      }
    }
  }

  await context.close();
}

await browser.close();

console.log(
  total === 0
    ? "\nno serious or critical accessibility violations"
    : `\n${total} serious/critical violation(s)`,
);
process.exit(total === 0 ? 0 : 1);
