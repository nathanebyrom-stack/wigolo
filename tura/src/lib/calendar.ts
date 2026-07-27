import type { CalendarSlot, Settings, Tier } from "./types";
import { TIER_META } from "./types";

/**
 * The TURA calendar rules.
 *
 *   Green  — the last Saturday of every month, about £300.
 *   Amber  — the Saturday nearest mid-month, every other month, about £200.
 *   Red    — one adventure a year, on the Saturday nearest the birthday, ~£1,000.
 *
 * Slots are generated deterministically from the rules, so the same year always
 * produces the same slot ids. Anything the couple changes is stored against the
 * slot id and merged back over the generated set.
 */

const DAY_MS = 86_400_000;

/** yyyy-mm-dd in local time — never use toISOString(), it shifts the date. */
export function toISODate(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

export function fromISODate(iso: string): Date {
  const [y, m, d] = iso.split("-").map(Number);
  return new Date(y, (m ?? 1) - 1, d ?? 1);
}

/** The last Saturday in a given month. `month` is 0-indexed. */
export function lastSaturdayOf(year: number, month: number): Date {
  // Day 0 of the next month is the last day of this one.
  const last = new Date(year, month + 1, 0);
  const shift = (last.getDay() - 6 + 7) % 7;
  return new Date(year, month + 1, 0 - shift);
}

/** The Saturday closest to the 15th of a given month. */
export function midMonthSaturdayOf(year: number, month: number): Date {
  const mid = new Date(year, month, 15);
  // Distance to the Saturday before and the Saturday after the 15th. Unless the
  // 15th is itself a Saturday these sum to 7, so they can never tie.
  const back = (mid.getDay() - 6 + 7) % 7;
  const forward = (6 - mid.getDay() + 7) % 7;
  return back > 0 && back < forward
    ? new Date(year, month, 15 - back)
    : new Date(year, month, 15 + forward);
}

/** The Saturday nearest a date — the birthday adventure lands on a weekend. */
export function nearestSaturday(d: Date): Date {
  const day = d.getDay();
  // Saturday is 6. Offsets of -6..+6, pick the smallest absolute move.
  const forward = (6 - day + 7) % 7;
  const back = (day - 6 + 7) % 7;
  return forward <= back
    ? new Date(d.getFullYear(), d.getMonth(), d.getDate() + forward)
    : new Date(d.getFullYear(), d.getMonth(), d.getDate() - back);
}

function slotId(tier: Tier, year: number, month: number): string {
  return `${tier}-${year}-${String(month + 1).padStart(2, "0")}`;
}

/**
 * Every slot the rules produce for one year, in date order.
 * 12 green + 6 amber + 1 red = 19 slots.
 */
export function generateSlotsForYear(
  year: number,
  settings: Pick<Settings, "birthday" | "amberAnchorMonth">,
): CalendarSlot[] {
  const slots: CalendarSlot[] = [];

  // Green — last Saturday, every month.
  for (let month = 0; month < 12; month++) {
    slots.push({
      id: slotId("green", year, month),
      date: toISODate(lastSaturdayOf(year, month)),
      tier: "green",
      budget: TIER_META.green.budget,
    });
  }

  // Amber — mid-month Saturday, every other month from the anchor.
  const anchor = ((settings.amberAnchorMonth % 2) + 2) % 2;
  for (let month = anchor; month < 12; month += 2) {
    slots.push({
      id: slotId("amber", year, month),
      date: toISODate(midMonthSaturdayOf(year, month)),
      tier: "amber",
      budget: TIER_META.amber.budget,
    });
  }

  // Red — one a year, on the Saturday nearest the birthday.
  const birthday = fromISODate(settings.birthday);
  const thisYearsBirthday = new Date(
    year,
    birthday.getMonth(),
    birthday.getDate(),
  );
  let redDate = nearestSaturday(thisYearsBirthday);
  // A birthday in the first or last days of the year can throw the nearest
  // Saturday into the neighbouring year — take the one inside this year instead.
  if (redDate.getFullYear() !== year) {
    const day = thisYearsBirthday.getDay();
    const forward = (6 - day + 7) % 7;
    redDate =
      redDate < thisYearsBirthday
        ? new Date(year, birthday.getMonth(), birthday.getDate() + forward)
        : new Date(year, birthday.getMonth(), birthday.getDate() - ((day - 6 + 7) % 7));
  }
  slots.push({
    id: `red-${year}`,
    date: toISODate(redDate),
    tier: "red",
    budget: TIER_META.red.budget,
  });

  return slots.sort((a, b) => a.date.localeCompare(b.date));
}

/**
 * Generated slots for a year, with any stored overrides merged on top.
 * Stored slots that fall inside the year but are no longer generated (because
 * settings changed) are kept, so an assigned adventure is never silently lost.
 */
export function slotsForYear(
  year: number,
  settings: Pick<Settings, "birthday" | "amberAnchorMonth">,
  stored: Record<string, CalendarSlot>,
): CalendarSlot[] {
  const generated = generateSlotsForYear(year, settings);
  const seen = new Set(generated.map((s) => s.id));

  const merged = generated.map((slot) => {
    const override = stored[slot.id];
    return override ? { ...slot, ...override, tier: slot.tier } : slot;
  });

  const orphans = Object.values(stored).filter(
    (s) => !seen.has(s.id) && s.date.startsWith(String(year)) && s.adventureId,
  );

  return [...merged, ...orphans].sort((a, b) => a.date.localeCompare(b.date));
}

/** What a slot actually costs: the couple's override, else the tier target. */
export function slotBudget(slot: CalendarSlot): number {
  return slot.budgetOverride ?? slot.budget;
}

export function isPast(iso: string, today = new Date()): boolean {
  return fromISODate(iso).getTime() < startOfDay(today).getTime();
}

export function startOfDay(d: Date): Date {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate());
}

/** Whole days from today until the slot date; negative once it has passed. */
export function daysUntil(iso: string, today = new Date()): number {
  return Math.round(
    (fromISODate(iso).getTime() - startOfDay(today).getTime()) / DAY_MS,
  );
}

const MONTHS = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];

export const MONTH_NAMES = MONTHS;
export const MONTH_SHORT = MONTHS.map((m) => m.slice(0, 3));

const WEEKDAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

/** "Sat 28 March" — the format used through the calendar and journal. */
export function formatSlotDate(iso: string): string {
  const d = fromISODate(iso);
  return `${WEEKDAYS[d.getDay()]} ${d.getDate()} ${MONTHS[d.getMonth()]}`;
}

/** "28 Mar 2026" — compact, for lists and the adventure book. */
export function formatShortDate(iso: string): string {
  const d = fromISODate(iso);
  return `${d.getDate()} ${MONTH_SHORT[d.getMonth()]} ${d.getFullYear()}`;
}

/** Human countdown: "in 3 days", "tomorrow", "12 days ago". */
export function formatCountdown(iso: string, today = new Date()): string {
  const days = daysUntil(iso, today);
  if (days === 0) return "today";
  if (days === 1) return "tomorrow";
  if (days === -1) return "yesterday";
  if (days > 0) return `in ${days} days`;
  return `${Math.abs(days)} days ago`;
}

/**
 * A month grid for the calendar view: 6 rows of 7 days, Monday-first,
 * padded with the neighbouring months so the grid is always full.
 */
export interface CalendarCell {
  date: string;
  inMonth: boolean;
  isToday: boolean;
}

export function monthGrid(
  year: number,
  month: number,
  today = new Date(),
): CalendarCell[] {
  const first = new Date(year, month, 1);
  // Monday-first offset: Monday 0 … Sunday 6.
  const offset = (first.getDay() + 6) % 7;
  const start = new Date(year, month, 1 - offset);
  const todayISO = toISODate(startOfDay(today));

  return Array.from({ length: 42 }, (_, i) => {
    const d = new Date(start.getFullYear(), start.getMonth(), start.getDate() + i);
    const iso = toISODate(d);
    return { date: iso, inMonth: d.getMonth() === month, isToday: iso === todayISO };
  });
}

export const WEEKDAY_INITIALS = ["M", "T", "W", "T", "F", "S", "S"];

export const WEEKDAY_NAMES = [
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
  "Sunday",
];

/**
 * The same grid split into six weeks.
 *
 * `role="grid"` requires `role="row"` between the grid and its cells, so the
 * markup has to be nested rather than a single flat 42-cell list.
 */
export function monthWeeks(
  year: number,
  month: number,
  today = new Date(),
): CalendarCell[][] {
  const cells = monthGrid(year, month, today);
  return Array.from({ length: 6 }, (_, week) =>
    cells.slice(week * 7, week * 7 + 7),
  );
}
