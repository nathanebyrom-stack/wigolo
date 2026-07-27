/**
 * End-to-end journey test.
 *
 * Drives the app the way the couple would: pick an adventure, tick the
 * checklist, book it into a calendar date, log an expense, write it up, then
 * check the book, the statistics and that everything survives a reload and
 * going offline.
 *
 * Run against a running server: `node scripts/journey.mjs [baseUrl]`
 */
import { chromium, devices } from "playwright";

const base = process.argv[2] ?? "http://localhost:3000";
const shots = process.env.JOURNEY_SHOTS;

const IGNORE = [
  /tile\.opentopomap\.org/i,
  /arcgisonline\.com/i,
  /tile-cyclosm/i,
  /Failed to load resource/i,
  /net::ERR/i,
  /favicon/i,
];

const results = [];
let problems = [];

function check(name, condition, detail = "") {
  results.push({ name, ok: Boolean(condition), detail });
  console.log(`  ${condition ? "ok  " : "FAIL"}  ${name}${detail ? ` — ${detail}` : ""}`);
}

const browser = await chromium.launch({
  executablePath: process.env.CHROMIUM_PATH || undefined,
});
const context = await browser.newContext(devices["iPhone 14 Pro"]);
const page = await context.newPage();

page.on("console", (msg) => {
  if (msg.type() !== "error") return;
  const text = msg.text();
  if (IGNORE.some((re) => re.test(text))) return;
  problems.push(`console: ${text}`);
});
page.on("pageerror", (error) => problems.push(`uncaught: ${error.message}`));

async function shot(name) {
  if (shots) await page.screenshot({ path: `${shots}/j-${name}.png` });
}

// ── 1. Explore ───────────────────────────────────────────────────────────────
await page.goto(`${base}/`, { waitUntil: "domcontentloaded" });
await page.waitForTimeout(1200);

const ranked = page.locator("ol li article").first();
check("explore shows the ranked list", await ranked.isVisible());

const topTitle = await ranked.locator("h3").innerText();
check("top-ranked card has a real title", topTitle.length > 10, topTitle);

const cardCount = await page.locator("ol > li > article").count();
check("exactly 15 ranked adventures", cardCount === 15, `saw ${cardCount}`);

const mapPane = page.locator(".leaflet-container");
check("bleed-through map mounted behind the content", await mapPane.count() === 1);

// ── 2. Adventure detail ──────────────────────────────────────────────────────
await page.goto(`${base}/adventure/wasdale-head`, { waitUntil: "domcontentloaded" });
await page.waitForTimeout(900);

check(
  "detail page shows the reference",
  (await page.locator("body").innerText()).includes("TURA-001"),
);

const checkboxes = page.getByRole("checkbox");
const checkboxCount = await checkboxes.count();
check("checklist rendered", checkboxCount > 8, `${checkboxCount} items`);

await checkboxes.nth(0).click();
await checkboxes.nth(1).click();
await page.waitForTimeout(400);
const progressText = await page.locator("#checklist-heading + p").innerText();
check("check-offs recorded", progressText.startsWith("2 of"), progressText);

await page.getByRole("radio", { name: "Booked" }).click();
await page.waitForTimeout(400);
check(
  "status set to booked",
  (await page.getByRole("radio", { name: "Booked" }).getAttribute("aria-checked")) ===
    "true",
);
await shot("detail");

// ── 3. Book it into the calendar ─────────────────────────────────────────────
await page.getByRole("button", { name: /put it in the calendar/i }).click();
await page.waitForTimeout(600);

const slotButtons = page.locator('[data-slot="sheet-content"] ul li button');
const slotCount = await slotButtons.count();
check("future calendar dates offered", slotCount > 10, `${slotCount} dates`);

const firstSlotLabel = await slotButtons.first().innerText();
await slotButtons.first().click();
await page.waitForTimeout(700);
check("slot assigned without error", !firstSlotLabel.includes("undefined"));

// ── 4. Calendar reflects it ──────────────────────────────────────────────────
await page.goto(`${base}/calendar`, { waitUntil: "domcontentloaded" });
await page.waitForTimeout(900);

const calendarText = await page.locator("body").innerText();
check("calendar shows the adventure reference", calendarText.includes("TURA-001"));
check("green tier count updated", /[1-9]\/12/.test(calendarText));
await shot("calendar");

// ── 5. Budget ────────────────────────────────────────────────────────────────
await page.goto(`${base}/budget`, { waitUntil: "domcontentloaded" });
await page.waitForTimeout(900);

check(
  "booked trip appears in the budget",
  (await page.locator("body").innerText()).includes("TURA-001"),
);

await page.getByRole("button", { name: /add an expense/i }).first().click();
await page.waitForTimeout(600);
await page.getByLabel("What was it?").fill("Diesel to Wasdale");
await page.getByLabel("Amount").fill("86.40");
await page.getByRole("button", { name: /log it/i }).click();
await page.waitForTimeout(700);

const budgetText = await page.locator("body").innerText();
check("expense logged", budgetText.includes("Diesel to Wasdale"));
check("spend total updated", budgetText.includes("£86"));
await shot("budget");

// ── 6. Journal ───────────────────────────────────────────────────────────────
await page.goto(`${base}/journal/new`, { waitUntil: "domcontentloaded" });
await page.waitForTimeout(900);

await page.locator("#entry-adventure").click();
await page.waitForTimeout(400);
await page.getByRole("option", { name: /TURA-001/ }).click();
await page.waitForTimeout(300);

await page.getByLabel("Title").fill("The night the wind turned");
await page
  .getByLabel("How it went")
  .fill(
    "Left after work and had the tent up by nine. Woke at two to the fly sheet cracking like a sail.",
  );
await page.getByLabel("The line worth keeping").fill("Neither of us said anything for the last mile.");
await page.getByRole("radio", { name: "5 out of 5" }).click();
await page.getByRole("button", { name: /save entry/i }).click();
await page.waitForTimeout(1000);

const journalText = await page.locator("body").innerText();
check("journal entry saved", journalText.includes("The night the wind turned"));
check("entry linked to its adventure", journalText.includes("TURA-001"));
await shot("journal");

// ── 7. The adventure book ────────────────────────────────────────────────────
await page.goto(`${base}/book`, { waitUntil: "domcontentloaded" });
await page.waitForTimeout(900);

const bookText = await page.locator("body").innerText();
check("book has a page for the entry", bookText.includes("The night the wind turned"));
check("standout quote set in the book", bookText.includes("last mile"));
check("book paginates", /Page 1 of 1/.test(bookText));
await shot("book");

// ── 8. Statistics ────────────────────────────────────────────────────────────
await page.goto(`${base}/stats`, { waitUntil: "domcontentloaded" });
await page.waitForTimeout(900);

const statsText = await page.locator("body").innerText();
check("statistics counted the completed adventure", statsText.includes("Adventures done"));
check("nights away counted", statsText.includes("Nights away"));
check("spend carried into stats", statsText.includes("£86"));
await shot("stats");

// ── 9. Roulette ──────────────────────────────────────────────────────────────
await page.goto(`${base}/roulette`, { waitUntil: "domcontentloaded" });
await page.waitForTimeout(900);

await page.getByRole("button", { name: /^spin$/i }).click();
await page.waitForTimeout(2600);

const rouletteText = await page.locator("body").innerText();
check("roulette produced a result", /TURA-\d{3}/.test(rouletteText));
check("result offers a real next action", rouletteText.includes("Book it in"));
check(
  "completed adventure excluded from the pool",
  !rouletteText.split("Recent spins")[0].includes("TURA-001"),
);
await shot("roulette");

// ── 10. Persistence ──────────────────────────────────────────────────────────
await page.reload({ waitUntil: "domcontentloaded" });
await page.goto(`${base}/journal`, { waitUntil: "domcontentloaded" });
await page.waitForTimeout(900);
check(
  "data survives a reload",
  (await page.locator("body").innerText()).includes("The night the wind turned"),
);

// ── 11. Offline ──────────────────────────────────────────────────────────────
await page.goto(`${base}/`, { waitUntil: "load" });
// Give the service worker time to install and precache the shell.
await page.waitForTimeout(3000);

const swReady = await page.evaluate(async () => {
  if (!("serviceWorker" in navigator)) return false;
  const registration = await navigator.serviceWorker.getRegistration();
  return Boolean(registration?.active);
});
check("service worker active", swReady);

if (swReady) {
  await context.setOffline(true);
  await page.goto(`${base}/calendar`, { waitUntil: "domcontentloaded" });
  await page.waitForTimeout(1200);
  const offlineText = await page.locator("body").innerText();
  check("calendar still renders offline", offlineText.includes("Calendar"));
  check("plan still readable offline", offlineText.includes("TURA-001"));
  await shot("offline");
  await context.setOffline(false);
}

// ── 12. No runtime errors anywhere in the journey ────────────────────────────
check("no console errors or uncaught exceptions", problems.length === 0, problems.join(" | "));

await browser.close();

const failed = results.filter((r) => !r.ok);
console.log(
  failed.length === 0
    ? `\n${results.length} checks passed`
    : `\n${failed.length} of ${results.length} checks failed`,
);
process.exit(failed.length === 0 ? 0 : 1);
