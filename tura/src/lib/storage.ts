import type { Settings, TuraState } from "./types";

export const STORAGE_KEY = "tura.state.v1";
export const STATE_VERSION = 1;

export const DEFAULT_SETTINGS: Settings = {
  partnerOne: "",
  partnerTwo: "",
  // 30 June — a mid-year default the couple replaces during setup.
  birthday: "1990-06-30",
  // Castleton, Peak District: roughly the centre of gravity for UK adventures.
  home: { lat: 53.3436, lng: -1.7772 },
  homeLabel: "Castleton, Derbyshire",
  amberAnchorMonth: 0,
  currency: "GBP",
  theme: "dark",
  mapStyle: "terrain",
  onboarded: false,
};

export function emptyState(): TuraState {
  return {
    version: STATE_VERSION,
    settings: { ...DEFAULT_SETTINGS, home: { ...DEFAULT_SETTINGS.home } },
    records: {},
    slots: {},
    expenses: [],
    journal: [],
    spins: [],
  };
}

/**
 * Parse whatever is in LocalStorage into a valid state.
 *
 * Anything missing or malformed falls back to the default rather than throwing:
 * a corrupt key should cost the couple their settings, not the whole app.
 */
export function parseState(raw: string | null): TuraState {
  if (!raw) return emptyState();

  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    return emptyState();
  }

  if (typeof parsed !== "object" || parsed === null) return emptyState();
  const data = parsed as Partial<TuraState>;
  const base = emptyState();

  return {
    version: STATE_VERSION,
    settings: {
      ...base.settings,
      ...(typeof data.settings === "object" && data.settings !== null
        ? data.settings
        : {}),
      home: {
        ...base.settings.home,
        ...(data.settings?.home ?? {}),
      },
    },
    records:
      typeof data.records === "object" && data.records !== null
        ? data.records
        : {},
    slots:
      typeof data.slots === "object" && data.slots !== null ? data.slots : {},
    expenses: Array.isArray(data.expenses) ? data.expenses : [],
    journal: Array.isArray(data.journal) ? data.journal : [],
    spins: Array.isArray(data.spins) ? data.spins : [],
  };
}

export function loadState(): TuraState {
  if (typeof window === "undefined") return emptyState();
  try {
    return parseState(window.localStorage.getItem(STORAGE_KEY));
  } catch {
    // Private browsing on iOS can throw on read as well as write.
    return emptyState();
  }
}

export type SaveResult = { ok: true } | { ok: false; reason: "quota" | "unavailable" };

export function saveState(state: TuraState): SaveResult {
  if (typeof window === "undefined") return { ok: false, reason: "unavailable" };
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    return { ok: true };
  } catch (error) {
    const quota =
      error instanceof DOMException &&
      (error.name === "QuotaExceededError" ||
        error.name === "NS_ERROR_DOM_QUOTA_REACHED");
    return { ok: false, reason: quota ? "quota" : "unavailable" };
  }
}

/** Rough size of the stored payload, so the app can warn before it fills up. */
export function storageFootprint(state: TuraState): number {
  try {
    return new Blob([JSON.stringify(state)]).size;
  } catch {
    return JSON.stringify(state).length;
  }
}

export function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

/** Stable ids without pulling in a uuid dependency. */
export function createId(prefix: string): string {
  const random =
    typeof crypto !== "undefined" && "randomUUID" in crypto
      ? crypto.randomUUID().slice(0, 8)
      : Math.random().toString(36).slice(2, 10);
  return `${prefix}_${Date.now().toString(36)}_${random}`;
}
