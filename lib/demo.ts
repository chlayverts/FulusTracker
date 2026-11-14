import type { Transaction } from "./finance";

/** Sample data shown on a first visit, before the user has saved anything. */
export const demoTransactions: Transaction[] = [
  { id: "demo-1", title: "Gaji bulanan", category: "Pemasukan", date: "2026-11-01", amount: 8_500_000, type: "income" },
  { id: "demo-2", title: "Belanja bulanan", category: "Kebutuhan", date: "2026-11-03", amount: 1_250_000, type: "expense" },
  { id: "demo-3", title: "Kopi dan makan siang", category: "Makanan", date: "2026-11-05", amount: 85_000, type: "expense" },
  { id: "demo-4", title: "Proyek desain", category: "Freelance", date: "2026-11-07", amount: 1_200_000, type: "income" },
  { id: "demo-5", title: "Tagihan internet", category: "Tagihan", date: "2026-11-09", amount: 350_000, type: "expense" },
  { id: "demo-6", title: "Bensin mingguan", category: "Transportasi", date: "2026-11-11", amount: 120_000, type: "expense" },
  { id: "demo-7", title: "Langganan musik", category: "Hiburan", date: "2026-11-12", amount: 65_000, type: "expense" },
];
