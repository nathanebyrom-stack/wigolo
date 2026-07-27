/**
 * Browser smoke test.
 *
 * Loads each route in an iPhone-sized viewport, fails on console errors or
 * uncaught exceptions, and asserts the key element of each screen is present.
 * Run against a dev or production server: `node scripts/smoke.mjs [baseUrl]`.
 */
import { chromium, devices } from "playwright";

const base = process.argv[2] ?? "http://localhost:3000";
const shot = process.env.SMOKE_SHOTS;

const ROUTES = [
  { path: "/", expect: "The next fifteen" },
  { path: "/calendar", expect: "Calendar" },
  { path: "/budget", expect: "Budget" },
  { path: "/journal", expect: "Journal" },
  { path: "/stats", expect: "Statistics" },
  { path: "/roulette", expect: "roulette" },
  { path: "/book", expect: "book" },
  { path: "/settings", expect: "Settings" },
  { path: "/adventure/wasdale-head", expect: "TURA-001" },
];

// Tile hosts are unreachable in CI sandboxes; that is not an app failure.
const IGNORE = [
  /tile\.opentopomap\.org/i,
  /arcgisonline\.com/i,
  /tile-cyclosm/i,
  /Failed to load resource/i,
  /net::ERR/i,
  /favicon/i,
];

// Use a pre-provisioned Chromium when the environment supplies one, so the
// script works without a browser download.
const browser = await chromium.launch({
  executablePath: process.env.CHROMIUM_PATH || undefined,
});
const context = await browser.newContext({
  ...devices["iPhone 14 Pro"],
  // Deterministic: every run starts with an empty LocalStorage.
  storageState: undefined,
});
const page = await context.newPage();

let failures = 0;
const problems = [];

page.on("console", (msg) => {
  if (msg.type() !== "error") return;
  const text = msg.text();
  if (IGNORE.some((re) => re.test(text))) return;
  problems.push(`console error: ${text}`);
});
page.on("pageerror", (error) => {
  problems.push(`uncaught: ${error.message}`);
});

for (const route of ROUTES) {
  problems.length = 0;
  const url = `${base}${route.path}`;
  try {
    const response = await page.goto(url, {
      waitUntil: "domcontentloaded",
      timeout: 30000,
    });
    if (!response || response.status() >= 400) {
      throw new Error(`HTTP ${response?.status() ?? "no response"}`);
    }
    await page.waitForTimeout(1200);

    const body = await page.locator("body").innerText();
    if (!body.toLowerCase().includes(route.expect.toLowerCase())) {
      throw new Error(`missing expected text "${route.expect}"`);
    }

    // Nothing should ever scroll the page sideways on a phone.
    const overflow = await page.evaluate(
      () => document.documentElement.scrollWidth - window.innerWidth,
    );
    if (overflow > 1) {
      throw new Error(`horizontal overflow of ${overflow}px`);
    }

    if (problems.length > 0) throw new Error(problems.join(" | "));

    if (shot) {
      const name = route.path === "/" ? "home" : route.path.replaceAll("/", "-");
      await page.screenshot({ path: `${shot}/${name}.png`, fullPage: false });
    }

    console.log(`  ok    ${route.path}`);
  } catch (error) {
    failures += 1;
    console.log(`  FAIL  ${route.path} — ${error.message}`);
  }
}

await browser.close();
console.log(failures === 0 ? "\nall routes ok" : `\n${failures} route(s) failed`);
process.exit(failures === 0 ? 0 : 1);
