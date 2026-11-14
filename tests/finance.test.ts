import { describe, expect, it } from "vitest";
import {
  budgetStatus,
  dailyExpenses,
  expensesByCategory,
  formatMoney,
  formatMonth,
  latestMonth,
  parseCsv,
  toCsv,
  totalsOf,
  type Transaction,
} from "../lib/finance";

const sample: Transaction[] = [
  { id: "1", title: "Gaji", category: "Pemasukan", date: "2026-11-01", amount: 8_500_000, type: "income" },
  { id: "2", title: "Belanja", category: "Kebutuhan", date: "2026-11-03", amount: 1_250_000, type: "expense" },
  { id: "3", title: "Kopi", category: "Makanan", date: "2026-11-05", amount: 85_000, type: "expense" },
  { id: "4", title: "Freelance", category: "Freelance", date: "2026-11-07", amount: 1_200_000, type: "income" },
  { id: "5", title: "Internet", category: "Tagihan", date: "2026-11-03", amount: 350_000, type: "expense" },
];

describe("formatMoney", () => {
  it("formats rupiah with Indonesian grouping", () => {
    expect(formatMoney(8_500_000)).toContain("8.500.000");
    expect(formatMoney(8_500_000)).toContain("Rp");
  });

  it("never throws on invalid input", () => {
    expect(formatMoney(Number.NaN)).toContain("0");
    expect(formatMoney(Number.POSITIVE_INFINITY)).toContain("0");
  });
});

describe("formatMonth", () => {
  it("renders an Indonesian month label", () => {
    expect(formatMonth("2026-11")).toBe("November 2026");
  });

  it("returns the input when the key is malformed", () => {
    expect(formatMonth("bukan-bulan")).toBe("bukan-bulan");
  });
});

describe("totalsOf", () => {
  it("splits income and expense and derives the balance", () => {
    expect(totalsOf(sample)).toEqual({
      income: 9_700_000,
      expense: 1_685_000,
      balance: 8_015_000,
    });
  });

  it("is zero for an empty list", () => {
    expect(totalsOf([])).toEqual({ income: 0, expense: 0, balance: 0 });
  });
});

describe("budgetStatus", () => {
  it("reports the remaining budget and usage share", () => {
    const status = budgetStatus(1_500_000, 5_000_000);
    expect(status.remaining).toBe(3_500_000);
    expect(status.percent).toBeCloseTo(30, 5);
    expect(status.displayPercent).toBeCloseTo(30, 5);
    expect(status.overBudget).toBe(false);
  });

  it("clamps the displayed share but keeps overruns visible", () => {
    const status = budgetStatus(7_500_000, 5_000_000);
    expect(status.overBudget).toBe(true);
    expect(status.percent).toBeCloseTo(150, 5);
    expect(status.displayPercent).toBe(100);
    expect(status.remaining).toBe(-2_500_000);
  });

  it("treats a zero budget as fully used when spending exists", () => {
    expect(budgetStatus(10_000, 0).percent).toBe(100);
    expect(budgetStatus(0, 0).percent).toBe(0);
    expect(budgetStatus(0, 0).overBudget).toBe(false);
  });
});

describe("expensesByCategory", () => {
  it("totals expenses per category, largest first", () => {
    expect(expensesByCategory(sample)).toEqual([
      { category: "Kebutuhan", amount: 1_250_000 },
      { category: "Tagihan", amount: 350_000 },
      { category: "Makanan", amount: 85_000 },
    ]);
  });

  it("ignores income rows", () => {
    expect(expensesByCategory(sample).some((row) => row.category === "Pemasukan")).toBe(false);
  });
});

describe("dailyExpenses", () => {
  it("returns one entry per day of the month", () => {
    const series = dailyExpenses(sample, "2026-11");
    expect(series).toHaveLength(30);
    expect(series[2]).toEqual({ day: 3, amount: 1_600_000 });
    expect(series[0]).toEqual({ day: 1, amount: 0 });
  });

  it("ignores other months", () => {
    expect(dailyExpenses(sample, "2026-10").every((point) => point.amount === 0)).toBe(true);
  });
});

describe("latestMonth", () => {
  it("picks the newest month present in the data", () => {
    const older: Transaction[] = [
      { id: "a", title: "Lama", category: "Lainnya", date: "2026-09-10", amount: 1, type: "expense" },
      ...sample,
    ];
    expect(latestMonth(older)).toBe("2026-11");
  });

  it("falls back to the current month for empty data", () => {
    expect(latestMonth([], new Date(Date.UTC(2026, 0, 15)))).toBe("2026-01");
  });
});

describe("CSV", () => {
  it("writes a header and one row per transaction", () => {
    const csv = toCsv(sample);
    const lines = csv.split("\n");
    expect(lines[0]).toBe("tanggal,judul,kategori,jenis,jumlah");
    expect(lines).toHaveLength(sample.length + 1);
    expect(lines[1]).toBe("2026-11-01,Gaji,Pemasukan,income,8500000");
  });

  it("quotes cells containing separators", () => {
    const tricky: Transaction[] = [
      { id: "x", title: 'Kopi, "enak"', category: "Makanan", date: "2026-11-02", amount: 25_000, type: "expense" },
    ];
    expect(toCsv(tricky)).toContain('"Kopi, ""enak"""');
  });

  it("round-trips through parseCsv", () => {
    const { transactions, skipped } = parseCsv(toCsv(sample));
    expect(skipped).toBe(0);
    expect(transactions).toHaveLength(sample.length);
    expect(transactions.map((item) => [item.title, item.amount, item.type])).toEqual(
      sample.map((item) => [item.title, item.amount, item.type]),
    );
  });

  it("counts invalid rows as skipped instead of failing", () => {
    const csv = [
      "tanggal,judul,kategori,jenis,jumlah",
      "2026-11-02,Valid,Kebutuhan,expense,10000",
      "bukan-tanggal,Rusak,Kebutuhan,expense,10000",
      "2026-11-04,Tanpa jumlah,Kebutuhan,expense,abc",
      "2026-11-05,Salah jenis,Kebutuhan,transfer,10000",
    ].join("\n");
    const result = parseCsv(csv);
    expect(result.transactions).toHaveLength(1);
    expect(result.skipped).toBe(3);
  });

  it("rejects a file without the expected columns", () => {
    expect(() => parseCsv("a,b,c\n1,2,3")).toThrowError(/Header CSV/);
  });

  it("tolerates reordered and extra columns", () => {
    const csv = ["jumlah,tanggal,judul,jenis,kategori,catatan", "5000,2026-11-06,Es Kopi,expense,Makanan,enak"].join("\n");
    const { transactions } = parseCsv(csv);
    expect(transactions[0]).toMatchObject({
      title: "Es Kopi",
      amount: 5000,
      category: "Makanan",
      type: "expense",
      date: "2026-11-06",
    });
  });
});
