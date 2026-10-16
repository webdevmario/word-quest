import { useSyncExternalStore } from 'react';

import type { AppData } from '@/game/types';
import { loadData, saveData } from '@/services/storage';

type Listener = () => void;

/**
 * A tiny store: one AppData object, saved after every change. Components read
 * it with useAppData(); every change goes through updateData().
 */
let state: AppData = loadData();
const listeners = new Set<Listener>();

export const getData = () => state;

export function subscribe(listener: Listener) {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

/** Applies a change to a copy of the data, saves it, and notifies readers. */
export function updateData<T>(change: (draft: AppData) => T): T {
  const draft = structuredClone(state);
  const result = change(draft);
  state = draft;
  saveData(state);
  listeners.forEach((l) => l());
  return result;
}

/** Re-reads storage. Used by tests. */
export function resetStore(data: AppData = loadData()) {
  state = data;
  listeners.forEach((l) => l());
}

export function useAppData<T>(selector: (data: AppData) => T): T {
  return useSyncExternalStore(subscribe, () => selector(state));
}
