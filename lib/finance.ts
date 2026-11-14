export type TransactionType = "income" | "expense";

export interface Transaction {
  id: string;
  title: string;
  category: string;
  /** ISO date, `YYYY-MM-DD`. */
  date: string;
  amount: number;
  type: TransactionType;
}

export const EXPENSE_CATEGORIES = [
  "Kebutuhan",
  "Makanan",
  "Tagihan",
  "Transportasi",
  "Hiburan",
  "Pendidikan",
  "Kesehatan",
  "Lainnya",
] as const;

export const INCOME_CATEGORIES = ["Pemasukan", "Freelance", "Bonus", "Investasi"] as const;

export const DEFAULT_BUDGET = 5_000_000;

const idr = new Intl.NumberFormat("id-ID", {
  style: "currency",
  currency: "IDR",
  maximumFractionDigits: 0,
});

/** Formats rupiah using Indonesian grouping, e.g. `Rp 8.500.000`. */
export function formatMoney(value: number): string {
  const safe = Number.isFinite(value) ? Math.round(value) : 0;
  return idr.format(safe).replace(/\u00a0/g, " ");
}

/** Formats a month label such as `November 2026`. */
export function formatMonth(monthKey: string): string {
  const [year, month] = monthKey.split("-").map(Number);
  if (!year || !month) return monthKey;
  return new Date(Date.UTC(year, month - 1, 1)).toLocaleDateString("id-ID", {
    month: "long",
    year: "numeric",
    timeZone: "UTC",
  });
}

/** Formats an ISO date as `5 Nov`. */
export function formatShortDate(iso: string): string {
  const date = new Date(`${iso}T00:00:00`);
  if (Number.isNaN(date.getTime())) return iso;
  return date.toLocaleDateString("id-ID", { day: "numeric", month: "short" });
}

export function totalsOf(transactions: readonly Transaction[]) {
  let income = 0;
  let expense = 0;
  for (const item of transactions) {
    if (!Number.isFinite(item.amount)) continue;
    if (item.type === "income") income += item.amount;
    else expense += item.amount;
  }
  return { income, expense, balance: income - expense };
}

export interface BudgetStatus {
  budget: number;
  spent: number;
  /** Share of the budget already spent, unclamped so overruns stay visible. */
  percent: number;
  /** Share of the budget already spent, clamped to `0..100` for display. */
  displayPercent: number;
  remaining: number;
  overBudget: boolean;
}

export function budgetStatus(spent: number, budget: number): BudgetStatus {
  const safeBudget = budget > 0 ? budget : 0;
  const safeSpent = Number.isFinite(spent) ? spent : 0;
  const percent = safeBudget === 0 ? (safeSpent > 0 ? 100 : 0) : (safeSpent / safeBudget) * 100;
  return {
    budget: safeBudget,
    spent: safeSpent,
    percent,
    displayPercent: Math.max(0, Math.min(100, percent)),
    remaining: safeBudget - safeSpent,
    overBudget: safeBudget > 0 && safeSpent > safeBudget,
  };
}

export interface CategoryTotal {
  category: string;
  amount: number;
}

/** Expense totals per category, largest first. */
export function expensesByCategory(transactions: readonly Transaction[]): CategoryTotal[] {
  const totals = new Map<string, number>();
  for (const item of transactions) {
    if (item.type !== "expense") continue;
    totals.set(item.category, (totals.get(item.category) ?? 0) + item.amount);
  }
  return [...totals.entries()]
    .map(([category, amount]) => ({ category, amount }))
    .sort((a, b) => b.amount - a.amount);
}

/** Expense totals per day for one `YYYY-MM` month, covering every day in it. */
export function dailyExpenses(
  transactions: readonly Transaction[],
  month: string,
): { day: number; amount: number }[] {
  const [year, monthNumber] = month.split("-").map(Number);
  if (!year || !monthNumber) return [];
  const days = new Date(Date.UTC(year, monthNumber, 0)).getUTCDate();
  const series = Array.from({ length: days }, (_, index) => ({ day: index + 1, amount: 0 }));
  for (const item of transactions) {
    if (item.type !== "expense" || item.date.slice(0, 7) !== month) continue;
    const day = Number(item.date.slice(8, 10));
    if (day >= 1 && day <= days) series[day - 1].amount += item.amount;
  }
  return series;
}

/** The newest `YYYY-MM` present in the data, falling back to the current month. */
export function latestMonth(transactions: readonly Transaction[], now = new Date()): string {
  let newest = "";
  for (const item of transactions) {
    const key = item.date.slice(0, 7);
    if (/^\d{4}-\d{2}$/.test(key) && key > newest) newest = key;
  }
  if (newest) return newest;
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
}

const CSV_HEADER = ["tanggal", "judul", "kategori", "jenis", "jumlah"] as const;

function csvCell(value: string): string {
  return /[",\n]/.test(value) ? `"${value.replace(/"/g, '""')}"` : value;
}

/** Serialises transactions as CSV with a stable, documented header. */
export function toCsv(transactions: readonly Transaction[]): string {
  const rows = transactions.map((item) =>
    [item.date, item.title, item.category, item.type, String(Math.round(item.amount))]
      .map(csvCell)
      .join(","),
  );
  return [CSV_HEADER.join(","), ...rows].join("\n");
}

function splitCsvLine(line: string): string[] {
  const cells: string[] = [];
  let current = "";
  let quoted = false;
  for (let index = 0; index < line.length; index += 1) {
    const char = line[index];
    if (quoted) {
      if (char === '"') {
        if (line[index + 1] === '"') {
          current += '"';
          index += 1;
        } else {
          quoted = false;
        }
      } else {
        current += char;
      }
      continue;
    }
    if (char === '"') quoted = true;
    else if (char === ",") {
      cells.push(current);
      current = "";
    } else current += char;
  }
  cells.push(current);
  return cells;
}

export interface CsvParseResult {
  transactions: Transaction[];
  skipped: number;
}

/**
 * Parses CSV produced by {@link toCsv}. Unknown headers are tolerated as long as
 * the required columns exist in any order.
 */
export function parseCsv(text: string): CsvParseResult {
  const lines = text
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter((line) => line.length > 0);
  if (lines.length === 0) return { transactions: [], skipped: 0 };

  const header = splitCsvLine(lines[0]).map((cell) => cell.trim().toLowerCase());
  const index = {
    date: header.indexOf("tanggal"),
    title: header.indexOf("judul"),
    category: header.indexOf("kategori"),
    type: header.indexOf("jenis"),
    amount: header.indexOf("jumlah"),
  };
  if (Object.values(index).some((value) => value === -1)) {
    throw new Error("Header CSV harus berisi kolom: tanggal, judul, kategori, jenis, jumlah.");
  }

  const transactions: Transaction[] = [];
  let skipped = 0;
  lines.slice(1).forEach((line, row) => {
    const cells = splitCsvLine(line);
    const amount = Number(cells[index.amount]);
    const type = cells[index.type]?.trim();
    const date = cells[index.date]?.trim();
    const title = cells[index.title]?.trim();
    const valid =
      /^\d{4}-\d{2}-\d{2}$/.test(date) &&
      title.length > 0 &&
      Number.isFinite(amount) &&
      amount > 0 &&
      (type === "income" || type === "expense");
    if (!valid) {
      skipped += 1;
      return;
    }
    transactions.push({
      id: `csv-${Date.now()}-${row}`,
      title,
      category: cells[index.category]?.trim() || "Lainnya",
      date,
      amount,
      type: type as TransactionType,
    });
  });

  return { transactions, skipped };
}
