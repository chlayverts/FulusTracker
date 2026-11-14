import { DEFAULT_BUDGET, type Transaction, type TransactionType } from "./finance";

const STATE_KEY = "fulustracker:state:v1";
const THEME_KEY = "fulustracker:theme";

export interface PersistedState {
  transactions: Transaction[];
  budget: number;
}

export type Theme = "light" | "dark";

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

export function isTransaction(value: unknown): value is Transaction {
  if (!isRecord(value)) return false;
  const type = value.type as TransactionType;
  return (
    typeof value.id === "string" &&
    typeof value.title === "string" &&
    value.title.length > 0 &&
    typeof value.category === "string" &&
    typeof value.date === "string" &&
    /^\d{4}-\d{2}-\d{2}$/.test(value.date) &&
    typeof value.amount === "number" &&
    Number.isFinite(value.amount) &&
    value.amount > 0 &&
    (type === "income" || type === "expense")
  );
}

/** Reads persisted state, dropping malformed entries instead of failing the app. */
export function loadState(): PersistedState | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(STATE_KEY);
    if (!raw) return null;
    const parsed: unknown = JSON.parse(raw);
    if (!isRecord(parsed) || !Array.isArray(parsed.transactions)) return null;
    const transactions = parsed.transactions.filter(isTransaction);
    const budget =
      typeof parsed.budget === "number" && Number.isFinite(parsed.budget) && parsed.budget >= 0
        ? parsed.budget
        : DEFAULT_BUDGET;
    return { transactions, budget };
  } catch {
    return null;
  }
}

export function saveState(state: PersistedState): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(STATE_KEY, JSON.stringify(state));
  } catch {
    // Storage can be full or blocked (private mode); the app keeps working in memory.
  }
}

export function clearState(): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.removeItem(STATE_KEY);
  } catch {
    // ignore
  }
}

export function loadTheme(): Theme | null {
  if (typeof window === "undefined") return null;
  try {
    const value = window.localStorage.getItem(THEME_KEY);
    return value === "light" || value === "dark" ? value : null;
  } catch {
    return null;
  }
}

export function saveTheme(theme: Theme): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(THEME_KEY, theme);
  } catch {
    // ignore
  }
}
