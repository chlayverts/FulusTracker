import { demoTransactions } from "./demo";
import { DEFAULT_BUDGET } from "./finance";
import { loadState, saveState } from "./storage";

/**
 * Minimal external store for the persisted finance state.
 *
 * `useSyncExternalStore` needs a stable snapshot and a server snapshot, which is
 * exactly what a localStorage-backed value requires: the prerendered HTML uses
 * the demo data, then the browser swaps in whatever the user saved last time
 * without a hydration mismatch.
 */
export interface FinanceState {
  transactions: typeof demoTransactions;
  budget: number;
}

const serverSnapshot: FinanceState = { transactions: demoTransactions, budget: DEFAULT_BUDGET };

let snapshot: FinanceState = serverSnapshot;
let loaded = false;
let listeners = new Set<() => void>();

function getSnapshot(): FinanceState {
  if (!loaded) {
    loaded = true;
    const stored = loadState();
    if (stored) snapshot = { transactions: stored.transactions, budget: stored.budget };
  }
  return snapshot;
}

function getServerSnapshot(): FinanceState {
  return serverSnapshot;
}

function subscribe(listener: () => void): () => void {
  listeners.add(listener);
  return () => {
    listeners = new Set([...listeners].filter((entry) => entry !== listener));
  };
}

function write(next: FinanceState): void {
  loaded = true;
  snapshot = next;
  saveState(next);
  for (const listener of listeners) listener();
}

export function updateTransactions(transactions: FinanceState["transactions"]): void {
  write({ transactions, budget: snapshot.budget });
}

export function updateBudget(budget: number): void {
  write({ transactions: snapshot.transactions, budget });
}

export function resetToDemo(): void {
  write({ transactions: demoTransactions, budget: DEFAULT_BUDGET });
}

export const financeStore = { subscribe, getSnapshot, getServerSnapshot };
