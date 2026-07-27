import { ADVENTURES, getAdventure } from "./adventures";
import { distanceMiles } from "./format";
import { slotBudget, slotsForYear } from "./calendar";
import { CATEGORIES, TIERS } from "./types";
import type { Category, Tier, TuraState } from "./types";

export interface TuraStats {
  completed: number;
  planned: number;
  booked: number;
  shortlisted: number;
  /** Catalogue entries neither completed nor skipped. */
  remaining: number;
  totalCatalogue: number;

  nightsAway: number;
  uninterruptedEscapes: number;
  milesFromHome: number;
  countriesVisited: string[];
  regionsVisited: string[];

  spentTotal: number;
  plannedBudget: number;
  /** Positive means under the plan. */
  variance: number;

  byCategory: { category: Category; completed: number; total: number }[];
  byTier: { tier: Tier; completed: number; planned: number }[];
  ukShare: number;
  averageRating: number | null;
  journalEntries: number;
  photos: number;
  longestStreakMonths: number;
}

/**
 * Everything the statistics screen shows, derived in one pass.
 *
 * "Completed" is driven by the adventure record rather than the calendar, so an
 * adventure done off-plan still counts.
 */
export function computeStats(state: TuraState, year: number): TuraStats {
  const records = Object.values(state.records);
  const completedIds = records
    .filter((r) => r.status === "completed")
    .map((r) => r.adventureId);
  const completedAdventures = completedIds
    .map(getAdventure)
    .filter((a): a is NonNullable<typeof a> => Boolean(a));

  const countStatus = (status: string) =>
    records.filter((r) => r.status === status).length;

  const nightsAway = completedAdventures.reduce((sum, a) => sum + a.nights, 0);
  const uninterruptedEscapes = completedAdventures.filter(
    (a) => a.nights >= 2 && a.adultsOnly,
  ).length;

  const milesFromHome = completedAdventures.reduce(
    // Out and back, which is what actually gets driven.
    (sum, a) => sum + distanceMiles(state.settings.home, a.coords) * 2,
    0,
  );

  const countriesVisited = [
    ...new Set(completedAdventures.map((a) => a.country)),
  ].sort();
  const regionsVisited = [
    ...new Set(completedAdventures.map((a) => a.region)),
  ].sort();

  const spentTotal = state.expenses.reduce((sum, e) => sum + e.amount, 0);

  const yearSlots = slotsForYear(year, state.settings, state.slots);
  const plannedBudget = yearSlots
    .filter((slot) => slot.adventureId)
    .reduce((sum, slot) => sum + slotBudget(slot), 0);

  const byCategory = CATEGORIES.map((category) => ({
    category,
    completed: completedAdventures.filter((a) => a.categories.includes(category))
      .length,
    total: ADVENTURES.filter((a) => a.categories.includes(category)).length,
  }));

  const byTier = TIERS.map((tier) => ({
    tier,
    completed: completedAdventures.filter((a) => a.tier === tier).length,
    planned: yearSlots.filter((s) => s.tier === tier && s.adventureId).length,
  }));

  const ukCompleted = completedAdventures.filter((a) => a.uk).length;
  const ratings = state.journal.map((e) => e.rating).filter((r) => r > 0);

  return {
    completed: completedAdventures.length,
    planned: countStatus("planned"),
    booked: countStatus("booked"),
    shortlisted: countStatus("shortlisted"),
    remaining:
      ADVENTURES.length -
      records.filter((r) => r.status === "completed" || r.status === "skipped")
        .length,
    totalCatalogue: ADVENTURES.length,

    nightsAway,
    uninterruptedEscapes,
    milesFromHome,
    countriesVisited,
    regionsVisited,

    spentTotal: spentTotal,
    plannedBudget,
    variance: plannedBudget - spentTotal,

    byCategory,
    byTier,
    ukShare:
      completedAdventures.length === 0
        ? 0
        : Math.round((ukCompleted / completedAdventures.length) * 100),
    averageRating:
      ratings.length === 0
        ? null
        : ratings.reduce((a, b) => a + b, 0) / ratings.length,
    journalEntries: state.journal.length,
    photos: state.journal.reduce((sum, e) => sum + e.photos.length, 0),
    longestStreakMonths: longestMonthlyStreak(state),
  };
}

/**
 * The longest run of consecutive calendar months containing at least one
 * completed adventure — the number the couple will actually compete over.
 */
function longestMonthlyStreak(state: TuraState): number {
  const months = new Set<string>();

  for (const record of Object.values(state.records)) {
    if (record.status === "completed" && record.completedOn) {
      months.add(record.completedOn.slice(0, 7));
    }
  }
  for (const entry of state.journal) {
    months.add(entry.date.slice(0, 7));
  }

  if (months.size === 0) return 0;

  const sorted = [...months].sort();
  let best = 1;
  let run = 1;

  for (let i = 1; i < sorted.length; i++) {
    if (isNextMonth(sorted[i - 1], sorted[i])) {
      run += 1;
      best = Math.max(best, run);
    } else {
      run = 1;
    }
  }
  return best;
}

function isNextMonth(a: string, b: string): boolean {
  const [ay, am] = a.split("-").map(Number);
  const [by, bm] = b.split("-").map(Number);
  return ay * 12 + am + 1 === by * 12 + bm;
}
