"use client";

import * as React from "react";

import { ADVENTURES, getAdventure } from "./adventures";
import { slotsForYear, toISODate } from "./calendar";
import {
  getHydrated,
  getServerHydrated,
  getServerSnapshot,
  getSnapshot,
  refreshFromStorage,
  setState,
  subscribe,
  type SaveErrorReason,
} from "./external-store";
import { createId, emptyState, storageFootprint, STORAGE_KEY } from "./storage";
import type {
  AdventureRecord,
  CalendarSlot,
  Expense,
  JournalEntry,
  Settings,
  Status,
  TuraState,
} from "./types";

interface StoreValue {
  state: TuraState;
  /** False during SSR and the first client render, before LocalStorage is read. */
  hydrated: boolean;
  /** Set when a write fails, so the UI can warn that data is at risk. */
  saveError: SaveErrorReason | null;
  footprint: number;

  recordFor: (adventureId: string) => AdventureRecord;
  setStatus: (adventureId: string, status: Status) => void;
  toggleCheck: (adventureId: string, itemId: string) => void;
  resetChecks: (adventureId: string) => void;
  setNotes: (adventureId: string, notes: string) => void;
  toggleFavourite: (adventureId: string) => void;

  slotsFor: (year: number) => CalendarSlot[];
  assignSlot: (slot: CalendarSlot, adventureId: string | null) => void;
  updateSlot: (slot: CalendarSlot, patch: Partial<CalendarSlot>) => void;

  addExpense: (expense: Omit<Expense, "id" | "createdAt">) => void;
  deleteExpense: (id: string) => void;

  addJournalEntry: (entry: Omit<JournalEntry, "id" | "createdAt">) => void;
  updateJournalEntry: (id: string, patch: Partial<JournalEntry>) => void;
  deleteJournalEntry: (id: string) => void;

  recordSpin: (adventureId: string) => void;
  updateSettings: (patch: Partial<Settings>) => void;
  importState: (state: TuraState) => void;
  resetAll: () => void;
}

const StoreContext = React.createContext<StoreValue | null>(null);

/**
 * The record shape used when nothing has been stored for an adventure.
 *
 * `updatedAt` is only stamped on write, so this stays referentially predictable
 * and never causes a render loop.
 */
function defaultRecord(adventureId: string): AdventureRecord {
  return {
    adventureId,
    status: "idea",
    checked: [],
    notes: "",
    favourite: false,
    updatedAt: "",
  };
}

function patchRecord(
  adventureId: string,
  patch: (record: AdventureRecord) => AdventureRecord,
) {
  setState((previous) => {
    const current = previous.records[adventureId] ?? defaultRecord(adventureId);
    return {
      ...previous,
      records: {
        ...previous.records,
        [adventureId]: {
          ...patch(current),
          updatedAt: new Date().toISOString(),
        },
      },
    };
  });
}

export function StoreProvider({ children }: { children: React.ReactNode }) {
  const snapshot = React.useSyncExternalStore(
    subscribe,
    getSnapshot,
    getServerSnapshot,
  );
  const hydrated = React.useSyncExternalStore(
    subscribe,
    getHydrated,
    getServerHydrated,
  );

  // Keep two tabs — or a tab and the installed app — in step.
  React.useEffect(() => {
    function onStorage(event: StorageEvent) {
      if (event.key === STORAGE_KEY) refreshFromStorage();
    }
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, []);

  const { state, saveError } = snapshot;

  const value = React.useMemo<StoreValue>(
    () => ({
      state,
      hydrated,
      saveError,
      footprint: storageFootprint(state),

      recordFor: (adventureId) =>
        state.records[adventureId] ?? defaultRecord(adventureId),

      setStatus: (adventureId, status) =>
        patchRecord(adventureId, (record) => ({
          ...record,
          status,
          completedOn:
            status === "completed"
              ? (record.completedOn ?? toISODate(new Date()))
              : undefined,
        })),

      toggleCheck: (adventureId, itemId) =>
        patchRecord(adventureId, (record) => ({
          ...record,
          checked: record.checked.includes(itemId)
            ? record.checked.filter((id) => id !== itemId)
            : [...record.checked, itemId],
        })),

      resetChecks: (adventureId) =>
        patchRecord(adventureId, (record) => ({ ...record, checked: [] })),

      setNotes: (adventureId, notes) =>
        patchRecord(adventureId, (record) => ({ ...record, notes })),

      toggleFavourite: (adventureId) =>
        patchRecord(adventureId, (record) => ({
          ...record,
          favourite: !record.favourite,
        })),

      slotsFor: (year) => slotsForYear(year, state.settings, state.slots),

      assignSlot: (slot, adventureId) =>
        setState((previous) => ({
          ...previous,
          slots: {
            ...previous.slots,
            [slot.id]: {
              ...slot,
              ...previous.slots[slot.id],
              id: slot.id,
              date: slot.date,
              tier: slot.tier,
              adventureId: adventureId ?? undefined,
            },
          },
        })),

      updateSlot: (slot, patch) =>
        setState((previous) => ({
          ...previous,
          slots: {
            ...previous.slots,
            [slot.id]: {
              ...slot,
              ...previous.slots[slot.id],
              ...patch,
              id: slot.id,
            },
          },
        })),

      addExpense: (expense) =>
        setState((previous) => ({
          ...previous,
          expenses: [
            ...previous.expenses,
            {
              ...expense,
              id: createId("exp"),
              createdAt: new Date().toISOString(),
            },
          ],
        })),

      deleteExpense: (id) =>
        setState((previous) => ({
          ...previous,
          expenses: previous.expenses.filter((expense) => expense.id !== id),
        })),

      addJournalEntry: (entry) =>
        setState((previous) => ({
          ...previous,
          journal: [
            { ...entry, id: createId("jrn"), createdAt: new Date().toISOString() },
            ...previous.journal,
          ],
        })),

      updateJournalEntry: (id, patch) =>
        setState((previous) => ({
          ...previous,
          journal: previous.journal.map((entry) =>
            entry.id === id ? { ...entry, ...patch } : entry,
          ),
        })),

      deleteJournalEntry: (id) =>
        setState((previous) => ({
          ...previous,
          journal: previous.journal.filter((entry) => entry.id !== id),
        })),

      recordSpin: (adventureId) =>
        setState((previous) => ({
          ...previous,
          spins: [
            { adventureId, at: new Date().toISOString() },
            ...previous.spins,
          ].slice(0, 50),
        })),

      updateSettings: (patch) =>
        setState((previous) => ({
          ...previous,
          settings: { ...previous.settings, ...patch },
        })),

      importState: (next) => setState(() => next),

      resetAll: () => setState(() => emptyState()),
    }),
    [state, hydrated, saveError],
  );

  return <StoreContext value={value}>{children}</StoreContext>;
}

export function useStore(): StoreValue {
  const value = React.useContext(StoreContext);
  if (!value) {
    throw new Error("useStore must be used inside <StoreProvider>");
  }
  return value;
}

/** The record for one adventure, with a stable default when nothing is stored. */
export function useAdventureRecord(adventureId: string): AdventureRecord {
  const { state } = useStore();
  return state.records[adventureId] ?? defaultRecord(adventureId);
}

/**
 * The next 15 adventures by popularity.
 *
 * Anything completed or skipped drops out, so the list stays a genuine "what
 * next" rather than a static leaderboard. Favourites are lifted to the top.
 */
export function useNextFifteen() {
  const { state } = useStore();
  const records = state.records;

  return React.useMemo(
    () =>
      ADVENTURES.filter((adventure) => {
        const status = records[adventure.id]?.status ?? "idea";
        return status !== "completed" && status !== "skipped";
      })
        .map((adventure) => ({
          adventure,
          record: records[adventure.id] ?? defaultRecord(adventure.id),
        }))
        .sort((a, b) => {
          if (a.record.favourite !== b.record.favourite) {
            return a.record.favourite ? -1 : 1;
          }
          return b.adventure.popularity - a.adventure.popularity;
        })
        .slice(0, 15),
    [records],
  );
}

/** Slots for a year that have a real adventure attached, in date order. */
export function usePlannedSlots(year: number) {
  const { state } = useStore();
  const { settings, slots } = state;

  return React.useMemo(
    () =>
      slotsForYear(year, settings, slots)
        .filter((slot) => slot.adventureId && getAdventure(slot.adventureId))
        .map((slot) => ({
          slot,
          adventure: getAdventure(slot.adventureId as string)!,
        })),
    [year, settings, slots],
  );
}
