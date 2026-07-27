import { describe, expect, it } from "vitest";

import { ADVENTURES, getAdventure } from "./adventures";
import { buildChecklist, checklistProgress } from "./checklist";
import { CATEGORIES, TIERS } from "./types";

describe("catalogue composition", () => {
  it("holds 64 adventures with unique ids and sequential references", () => {
    expect(ADVENTURES).toHaveLength(64);
    expect(new Set(ADVENTURES.map((a) => a.id)).size).toBe(64);
    ADVENTURES.forEach((adventure, index) => {
      expect(adventure.ref).toBe(`TURA-${String(index + 1).padStart(3, "0")}`);
    });
  });

  it("is 75% UK-based", () => {
    const uk = ADVENTURES.filter((a) => a.uk).length;
    expect(uk).toBe(48);
    expect(uk / ADVENTURES.length).toBe(0.75);
  });

  it("is 50% two-night, adults-only escapes", () => {
    const escapes = ADVENTURES.filter(
      (a) => a.nights === 2 && a.adultsOnly,
    ).length;
    expect(escapes).toBe(32);
    expect(escapes / ADVENTURES.length).toBe(0.5);
  });

  it("marks every multi-night adventure as adults-only and no others", () => {
    for (const adventure of ADVENTURES) {
      expect(adventure.adultsOnly).toBe(adventure.nights >= 2);
    }
  });

  it("has plausible coordinates for every entry", () => {
    for (const adventure of ADVENTURES) {
      expect(Number.isFinite(adventure.coords.lat)).toBe(true);
      expect(Number.isFinite(adventure.coords.lng)).toBe(true);
      expect(Math.abs(adventure.coords.lat)).toBeLessThanOrEqual(90);
      expect(Math.abs(adventure.coords.lng)).toBeLessThanOrEqual(180);
    }
  });

  it("places every UK adventure inside the UK bounding box", () => {
    for (const adventure of ADVENTURES.filter((a) => a.uk)) {
      expect(adventure.coords.lat).toBeGreaterThan(49.8);
      expect(adventure.coords.lat).toBeLessThan(61);
      expect(adventure.coords.lng).toBeGreaterThan(-8.5);
      expect(adventure.coords.lng).toBeLessThan(2);
    }
  });

  it("covers every category and tier", () => {
    for (const category of CATEGORIES) {
      expect(
        ADVENTURES.some((a) => a.categories.includes(category)),
      ).toBe(true);
    }
    for (const tier of TIERS) {
      expect(ADVENTURES.some((a) => a.tier === tier)).toBe(true);
    }
  });

  it("carries real content on every entry — no placeholders", () => {
    for (const adventure of ADVENTURES) {
      expect(adventure.summary.length).toBeGreaterThan(60);
      expect(adventure.highlights.length).toBeGreaterThanOrEqual(3);
      expect(adventure.kit.length).toBeGreaterThanOrEqual(2);
      expect(adventure.categories.length).toBeGreaterThanOrEqual(1);
      expect(adventure.popularity).toBeGreaterThan(0);
      expect(adventure.popularity).toBeLessThanOrEqual(100);
      expect(adventure.estimatedCost).toBeGreaterThan(0);
      expect(adventure.bestSeasons.length).toBeGreaterThanOrEqual(1);
      for (const text of [...adventure.highlights, ...adventure.kit]) {
        expect(text.trim().length).toBeGreaterThan(10);
        expect(text.toLowerCase()).not.toContain("lorem");
        expect(text).not.toContain("TODO");
      }
    }
  });

  it("resolves adventures by id", () => {
    expect(getAdventure("wasdale-head")?.ref).toBe("TURA-001");
    expect(getAdventure("does-not-exist")).toBeUndefined();
  });
});

describe("checklists", () => {
  it("builds a longer checklist for a two-night escape than a day trip", () => {
    const escape = ADVENTURES.find((a) => a.nights === 2)!;
    const dayTrip = ADVENTURES.find((a) => a.nights === 0)!;
    expect(buildChecklist(escape).length).toBeGreaterThan(
      buildChecklist(dayTrip).length,
    );
  });

  it("gives every item a stable, unique id", () => {
    for (const adventure of ADVENTURES) {
      const items = buildChecklist(adventure);
      expect(new Set(items.map((i) => i.id)).size).toBe(items.length);
      expect(buildChecklist(adventure).map((i) => i.id)).toEqual(
        items.map((i) => i.id),
      );
    }
  });

  it("includes the uninterrupted-escape items only on two-night trips", () => {
    const escape = ADVENTURES.find((a) => a.nights === 2)!;
    const dayTrip = ADVENTURES.find((a) => a.nights === 0)!;
    const labels = (id: string) => buildChecklist(getAdventure(id)!).map((i) => i.label);

    expect(labels(escape.id)).toContain(
      "Out-of-office on, notifications off, both of you",
    );
    expect(labels(dayTrip.id)).not.toContain(
      "Out-of-office on, notifications off, both of you",
    );
  });

  it("reports progress accurately", () => {
    const items = buildChecklist(ADVENTURES[0]);
    expect(checklistProgress(items, [])).toEqual({
      done: 0,
      total: items.length,
      percent: 0,
    });
    expect(checklistProgress(items, items.map((i) => i.id)).percent).toBe(100);
    // Unknown ids must not inflate the count.
    expect(checklistProgress(items, ["nope"]).done).toBe(0);
  });
});
