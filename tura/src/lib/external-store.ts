import {
  emptyState,
  loadState,
  saveState,
  type SaveResult,
} from "./storage";
import type { TuraState } from "./types";

/**
 * The LocalStorage-backed store, kept outside React.
 *
 * React subscribes to this through `useSyncExternalStore`, which is the right
 * primitive for state that lives in an external system: it gives a stable
 * server snapshot for SSR, swaps to the real value on hydration without a
 * cascading render, and handles tearing between concurrent renders.
 */

export type SaveErrorReason = Exclude<SaveResult, { ok: true }>["reason"];

export interface StoreSnapshot {
  state: TuraState;
  saveError: SaveErrorReason | null;
}

/** Frozen so a stray mutation cannot desync the server and client renders. */
const SERVER_SNAPSHOT: StoreSnapshot = Object.freeze({
  state: emptyState(),
  saveError: null,
});

let snapshot: StoreSnapshot | null = null;
const listeners = new Set<() => void>();

function emit() {
  for (const listener of listeners) listener();
}

export function subscribe(listener: () => void): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

/**
 * Reads LocalStorage on first call and caches the result. The identity of the
 * returned object only changes when the data does, which is what
 * `useSyncExternalStore` requires.
 */
export function getSnapshot(): StoreSnapshot {
  if (snapshot === null) {
    snapshot = { state: loadState(), saveError: null };
  }
  return snapshot;
}

export function getServerSnapshot(): StoreSnapshot {
  return SERVER_SNAPSHOT;
}

/** True once the client snapshot has replaced the server one. */
export function getHydrated(): boolean {
  return true;
}

export function getServerHydrated(): boolean {
  return false;
}

export function setState(updater: (previous: TuraState) => TuraState): void {
  const previous = getSnapshot();
  const next = updater(previous.state);
  if (next === previous.state) return;

  const result = saveState(next);
  snapshot = { state: next, saveError: result.ok ? null : result.reason };
  emit();
}

/** Re-read LocalStorage — used when another tab writes to the same key. */
export function refreshFromStorage(): void {
  snapshot = { state: loadState(), saveError: snapshot?.saveError ?? null };
  emit();
}

/** Test hook: drops the cache so the next read hits LocalStorage again. */
export function resetCache(): void {
  snapshot = null;
}
