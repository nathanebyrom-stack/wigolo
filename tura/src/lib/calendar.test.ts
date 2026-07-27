import { describe, expect, it } from "vitest";

import {
  daysUntil,
  formatCountdown,
  formatSlotDate,
  fromISODate,
  generateSlotsForYear,
  lastSaturdayOf,
  midMonthSaturdayOf,
  monthGrid,
  nearestSaturday,
  slotsForYear,
  toISODate,
} from "./calendar";
import type { CalendarSlot } from "./types";

const SETTINGS = { birthday: "1990-06-30", amberAnchorMonth: 0 };

function dayOfWeek(iso: string) {
  return fromISODate(iso).getDay();
}

describe("date helpers", () => {
  it("round-trips ISO dates without timezone drift", () => {
    expect(toISODate(new Date(2026, 0, 1))).toBe("2026-01-01");
    expect(toISODate(fromISODate("2026-12-31"))).toBe("2026-12-31");
  });

  it("finds the last Saturday of a month", () => {
    // 2026: January ends on a Saturday the 31st.
    expect(toISODate(lastSaturdayOf(2026, 0))).toBe("2026-01-31");
    // February 2026 ends on Saturday the 28th.
    expect(toISODate(lastSaturdayOf(2026, 1))).toBe("2026-02-28");

    for (let year = 2024; year <= 2030; year++) {
      for (let month = 0; month < 12; month++) {
        const d = lastSaturdayOf(year, month);
        expect(d.getDay()).toBe(6);
        expect(d.getMonth()).toBe(month);
        // There must be no later Saturday in the same month.
        const daysInMonth = new Date(year, month + 1, 0).getDate();
        expect(d.getDate() + 7).toBeGreaterThan(daysInMonth);
      }
    }
  });

  it("finds the Saturday nearest the 15th", () => {
    for (let year = 2024; year <= 2030; year++) {
      for (let month = 0; month < 12; month++) {
        const d = midMonthSaturdayOf(year, month);
        expect(d.getDay()).toBe(6);
        expect(d.getMonth()).toBe(month);
        // Never more than three days from the 15th, or it is not the nearest.
        expect(Math.abs(d.getDate() - 15)).toBeLessThanOrEqual(3);
      }
    }
  });

  it("snaps an arbitrary date to the nearest Saturday", () => {
    // 2026-06-30 is a Tuesday; the nearest Saturday is the 27th.
    expect(toISODate(nearestSaturday(new Date(2026, 5, 30)))).toBe("2026-06-27");
    // A Saturday stays put.
    expect(toISODate(nearestSaturday(new Date(2026, 5, 27)))).toBe("2026-06-27");
  });
});

describe("calendar rules", () => {
  const slots = generateSlotsForYear(2026, SETTINGS);

  it("produces 12 green, 6 amber and 1 red slot", () => {
    expect(slots.filter((s) => s.tier === "green")).toHaveLength(12);
    expect(slots.filter((s) => s.tier === "amber")).toHaveLength(6);
    expect(slots.filter((s) => s.tier === "red")).toHaveLength(1);
    expect(slots).toHaveLength(19);
  });

  it("puts every slot on a Saturday", () => {
    for (const slot of slots) {
      expect(dayOfWeek(slot.date)).toBe(6);
    }
  });

  it("budgets green at £300, amber at £200 and red at £1,000", () => {
    expect(slots.find((s) => s.tier === "green")?.budget).toBe(300);
    expect(slots.find((s) => s.tier === "amber")?.budget).toBe(200);
    expect(slots.find((s) => s.tier === "red")?.budget).toBe(1000);
  });

  it("places green on the last Saturday of every month", () => {
    const green = slots.filter((s) => s.tier === "green");
    green.forEach((slot) => {
      const d = fromISODate(slot.date);
      expect(toISODate(lastSaturdayOf(d.getFullYear(), d.getMonth()))).toBe(
        slot.date,
      );
    });
    expect(new Set(green.map((s) => fromISODate(s.date).getMonth())).size).toBe(12);
  });

  it("places amber every other month, mid-month", () => {
    const months = slots
      .filter((s) => s.tier === "amber")
      .map((s) => fromISODate(s.date).getMonth())
      .sort((a, b) => a - b);
    expect(months).toEqual([0, 2, 4, 6, 8, 10]);
  });

  it("shifts the amber rhythm when the anchor month is odd", () => {
    const months = generateSlotsForYear(2026, {
      ...SETTINGS,
      amberAnchorMonth: 1,
    })
      .filter((s) => s.tier === "amber")
      .map((s) => fromISODate(s.date).getMonth())
      .sort((a, b) => a - b);
    expect(months).toEqual([1, 3, 5, 7, 9, 11]);
  });

  it("puts red on the Saturday nearest the birthday, once a year", () => {
    const red = slots.find((s) => s.tier === "red")!;
    expect(red.id).toBe("red-2026");
    expect(red.date).toBe("2026-06-27");
    expect(Math.abs(daysUntil(red.date, new Date(2026, 5, 30)))).toBeLessThanOrEqual(3);
  });

  it("keeps the red slot inside its own year for a new-year birthday", () => {
    for (const birthday of ["1990-01-01", "1990-12-31"]) {
      for (let year = 2024; year <= 2032; year++) {
        const red = generateSlotsForYear(year, { ...SETTINGS, birthday }).find(
          (s) => s.tier === "red",
        )!;
        expect(red.date.startsWith(String(year))).toBe(true);
        expect(dayOfWeek(red.date)).toBe(6);
      }
    }
  });

  it("gives every slot a unique, deterministic id", () => {
    expect(new Set(slots.map((s) => s.id)).size).toBe(slots.length);
    expect(generateSlotsForYear(2026, SETTINGS)).toEqual(slots);
  });

  it("returns slots in date order", () => {
    const dates = slots.map((s) => s.date);
    expect([...dates].sort()).toEqual(dates);
  });
});

describe("stored slot merging", () => {
  it("merges an assigned adventure over the generated slot", () => {
    const generated = generateSlotsForYear(2026, SETTINGS);
    const target = generated.find((s) => s.tier === "green")!;
    const stored: Record<string, CalendarSlot> = {
      [target.id]: { ...target, adventureId: "wasdale-head", budgetOverride: 420 },
    };

    const merged = slotsForYear(2026, SETTINGS, stored);
    const found = merged.find((s) => s.id === target.id)!;
    expect(found.adventureId).toBe("wasdale-head");
    expect(found.budgetOverride).toBe(420);
    expect(merged).toHaveLength(19);
  });

  it("never lets a stored slot change its own tier", () => {
    const generated = generateSlotsForYear(2026, SETTINGS);
    const target = generated.find((s) => s.tier === "green")!;
    const merged = slotsForYear(2026, SETTINGS, {
      [target.id]: { ...target, tier: "red" },
    });
    expect(merged.find((s) => s.id === target.id)?.tier).toBe("green");
  });

  it("keeps an assigned slot that the rules no longer generate", () => {
    const orphan: CalendarSlot = {
      id: "amber-2026-02",
      date: "2026-02-14",
      tier: "amber",
      budget: 200,
      adventureId: "buttermere-round",
    };
    const merged = slotsForYear(2026, SETTINGS, { "amber-2026-02": orphan });
    expect(merged.some((s) => s.id === "amber-2026-02")).toBe(true);
    expect(merged).toHaveLength(20);
  });

  it("drops an unassigned orphan rather than cluttering the year", () => {
    const merged = slotsForYear(2026, SETTINGS, {
      "amber-2026-02": {
        id: "amber-2026-02",
        date: "2026-02-14",
        tier: "amber",
        budget: 200,
      },
    });
    expect(merged).toHaveLength(19);
  });
});

describe("presentation helpers", () => {
  it("formats a slot date the way the calendar shows it", () => {
    expect(formatSlotDate("2026-06-27")).toBe("Sat 27 June");
  });

  it("counts days relative to a fixed today", () => {
    const today = new Date(2026, 5, 20);
    expect(daysUntil("2026-06-27", today)).toBe(7);
    expect(daysUntil("2026-06-20", today)).toBe(0);
    expect(daysUntil("2026-06-13", today)).toBe(-7);
    expect(formatCountdown("2026-06-21", today)).toBe("tomorrow");
    expect(formatCountdown("2026-06-19", today)).toBe("yesterday");
    expect(formatCountdown("2026-06-27", today)).toBe("in 7 days");
    expect(formatCountdown("2026-06-13", today)).toBe("7 days ago");
  });

  it("builds a full six-week Monday-first month grid", () => {
    const grid = monthGrid(2026, 5, new Date(2026, 5, 20));
    expect(grid).toHaveLength(42);
    expect(dayOfWeek(grid[0].date)).toBe(1);
    expect(grid.filter((c) => c.inMonth)).toHaveLength(30);
    expect(grid.filter((c) => c.isToday)).toHaveLength(1);
    expect(grid.find((c) => c.isToday)?.date).toBe("2026-06-20");
  });
});
