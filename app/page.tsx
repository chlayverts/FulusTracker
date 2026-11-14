"use client";

import { useEffect, useMemo, useRef, useState, useSyncExternalStore, type ChangeEvent, type FormEvent } from "react";
import { DonutChart } from "@/components/DonutChart";
import { TrendChart } from "@/components/TrendChart";
import {
  EXPENSE_CATEGORIES,
  INCOME_CATEGORIES,
  budgetStatus,
  dailyExpenses,
  expensesByCategory,
  formatMoney,
  formatMonth,
  formatShortDate,
  latestMonth,
  parseCsv,
  toCsv,
  totalsOf,
  type Transaction,
  type TransactionType,
} from "@/lib/finance";
import { financeStore, resetToDemo, updateBudget, updateTransactions } from "@/lib/store";
import { saveTheme, type Theme } from "@/lib/storage";

type Filter = "all" | "income" | "expense";

export default function Home() {
  const { transactions, budget } = useSyncExternalStore(
    financeStore.subscribe,
    financeStore.getSnapshot,
    financeStore.getServerSnapshot,
  );
  const [filter, setFilter] = useState<Filter>("all");
  const [showForm, setShowForm] = useState(false);
  const [toast, setToast] = useState<string | null>(null);
  const importInput = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!toast) return;
    const timer = setTimeout(() => setToast(null), 4000);
    return () => clearTimeout(timer);
  }, [toast]);

  const totals = useMemo(() => totalsOf(transactions), [transactions]);
  const status = useMemo(() => budgetStatus(totals.expense, budget), [totals.expense, budget]);
  const categories = useMemo(() => expensesByCategory(transactions), [transactions]);
  const month = useMemo(() => latestMonth(transactions), [transactions]);
  const daily = useMemo(() => dailyExpenses(transactions, month), [transactions, month]);
  const visible = transactions.filter((item) => filter === "all" || item.type === filter);

  function toggleTheme() {
    const current = document.documentElement.dataset.theme === "dark" ? "dark" : "light";
    const next: Theme = current === "dark" ? "light" : "dark";
    document.documentElement.dataset.theme = next;
    saveTheme(next);
  }

  function addTransaction(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const data = new FormData(form);
    const amount = Number(data.get("amount"));
    const title = String(data.get("title")).trim();
    const date = String(data.get("date"));
    if (!title || !Number.isFinite(amount) || amount <= 0 || !date) {
      setToast("Transaksi belum valid: isi nama, jumlah di atas 0, dan tanggal.");
      return;
    }
    const type = String(data.get("type")) as TransactionType;
    const created: Transaction = {
      id: `tx-${Date.now()}`,
      title,
      category: String(data.get("category")),
      date,
      amount,
      type,
    };
    updateTransactions([created, ...transactions]);
    form.reset();
    setShowForm(false);
    setToast("Transaksi tersimpan di perangkat ini.");
  }

  function removeTransaction(id: string) {
    updateTransactions(transactions.filter((item) => item.id !== id));
    setToast("Transaksi dihapus.");
  }

  function saveBudget(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const value = Number(new FormData(event.currentTarget).get("budget"));
    if (!Number.isFinite(value) || value < 0) {
      setToast("Anggaran harus berupa angka 0 atau lebih.");
      return;
    }
    updateBudget(value);
    setToast("Anggaran bulanan diperbarui.");
  }

  function exportCsv() {
    const blob = new Blob([toCsv(transactions)], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = `fulustracker-${new Date().toISOString().slice(0, 10)}.csv`;
    anchor.click();
    URL.revokeObjectURL(url);
    setToast(`${transactions.length} transaksi diekspor ke CSV.`);
  }

  async function importCsv(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;
    try {
      const { transactions: imported, skipped } = parseCsv(await file.text());
      if (imported.length === 0) {
        setToast(`Tidak ada transaksi valid di file itu (${skipped} baris dilewati).`);
        return;
      }
      updateTransactions([...imported, ...transactions]);
      setToast(`${imported.length} transaksi diimpor${skipped ? `, ${skipped} dilewati` : ""}.`);
    } catch (error) {
      setToast(error instanceof Error ? error.message : "Gagal membaca file CSV.");
    }
  }

  function resetDemo() {
    resetToDemo();
    setToast("Data contoh dipulihkan.");
  }

  return (
    <main className="shell">
      <aside className="sidebar">
        <a className="brand" href="#overview" aria-label="FulusTracker beranda">
          <span className="brand-mark">f</span>
          <span>
            fulus<span className="brand-light">tracker</span>
          </span>
        </a>
        <p className="side-label">MENU</p>
        <a className="nav-item active" href="#overview">
          <span>◫</span> Ringkasan
        </a>
        <a className="nav-item" href="#transactions">
          <span>⇄</span> Transaksi
        </a>
        <a className="nav-item" href="#budget">
          <span>◎</span> Anggaran
        </a>
        <a className="nav-item" href="#insight">
          <span>◔</span> Insight
        </a>
        <div className="sidebar-bottom">
          <div className="avatar">D</div>
          <div>
            <strong>Demo User</strong>
            <small>Data lokal di perangkat</small>
          </div>
        </div>
      </aside>

      <section className="main-area">
        <header className="topbar">
          <div>
            <span className="eyebrow">KEUANGAN PRIBADI</span>
            <h1>Selamat datang 👋</h1>
            <p>
              Ringkasan {formatMonth(month)} — semua data tersimpan lokal di browser ini.
            </p>
          </div>
          <div className="topbar-actions">
            <button type="button" className="icon-button" onClick={toggleTheme} aria-label="Ganti mode terang atau gelap">
              <span className="theme-icon theme-icon-sun" aria-hidden="true">☀</span>
              <span className="theme-icon theme-icon-moon" aria-hidden="true">☾</span>
            </button>
            <button className="primary-button" onClick={() => setShowForm(!showForm)}>
              ＋ <span>Tambah transaksi</span>
            </button>
          </div>
        </header>

        <section className="stats" id="overview" aria-label="Ringkasan keuangan" aria-live="polite">
          <article className="stat-card balance-card">
            <div className="stat-top">
              <span>Total saldo</span>
              <span className="stat-icon">◈</span>
            </div>
            <strong>{formatMoney(totals.balance)}</strong>
            <small>
              <span className={totals.balance >= 0 ? "positive" : "negative"}>
                {totals.balance >= 0 ? "↑ Surplus" : "↓ Defisit"}
              </span>{" "}
              · {formatMonth(month)}
            </small>
          </article>
          <article className="stat-card">
            <div className="stat-top">
              <span>Total pemasukan</span>
              <span className="stat-icon green">↙</span>
            </div>
            <strong>{formatMoney(totals.income)}</strong>
            <small className="muted">
              {transactions.filter((item) => item.type === "income").length} transaksi masuk
            </small>
          </article>
          <article className="stat-card">
            <div className="stat-top">
              <span>Total pengeluaran</span>
              <span className="stat-icon orange">↗</span>
            </div>
            <strong>{formatMoney(totals.expense)}</strong>
            <small className="muted">
              {transactions.filter((item) => item.type === "expense").length} transaksi keluar
            </small>
          </article>
        </section>

        {showForm && (
          <form className="transaction-form" onSubmit={addTransaction}>
            <div className="form-heading">
              <div>
                <span className="eyebrow">CATAT AKTIVITAS</span>
                <h2>Transaksi baru</h2>
              </div>
              <button type="button" className="close-button" onClick={() => setShowForm(false)} aria-label="Tutup form">
                ×
              </button>
            </div>
            <label>
              Nama transaksi
              <input required name="title" placeholder="Contoh: Belanja mingguan" maxLength={80} />
            </label>
            <div className="form-row">
              <label>
                Jumlah (rupiah)
                <input required name="amount" type="number" min="1" step="1" placeholder="150000" />
              </label>
              <label>
                Jenis
                <select name="type">
                  <option value="expense">Pengeluaran</option>
                  <option value="income">Pemasukan</option>
                </select>
              </label>
            </div>
            <div className="form-row">
              <label>
                Kategori
                <select name="category">
                  {EXPENSE_CATEGORIES.map((category) => (
                    <option key={category}>{category}</option>
                  ))}
                  {INCOME_CATEGORIES.map((category) => (
                    <option key={category}>{category}</option>
                  ))}
                </select>
              </label>
              <label>
                Tanggal
                <input required name="date" type="date" />
              </label>
            </div>
            <button className="primary-button submit-button" type="submit">
              Simpan transaksi
            </button>
          </form>
        )}

        <div className="content-grid">
          <section className="panel transactions-panel" id="transactions">
            <div className="panel-heading">
              <div>
                <h2>Transaksi terbaru</h2>
                <p>{transactions.length} transaksi tersimpan</p>
              </div>
              <select
                className="filter-select"
                aria-label="Filter transaksi"
                value={filter}
                onChange={(event) => setFilter(event.target.value as Filter)}
              >
                <option value="all">Semua</option>
                <option value="income">Pemasukan</option>
                <option value="expense">Pengeluaran</option>
              </select>
            </div>
            <div className="transaction-list">
              {visible.length ? (
                visible.map((item) => (
                  <article className="transaction" key={item.id}>
                    <span className={`transaction-icon ${item.type}`}>
                      {item.type === "income" ? "↙" : "↗"}
                    </span>
                    <div className="transaction-name">
                      <strong>{item.title}</strong>
                      <small>
                        {item.category} · {formatShortDate(item.date)}
                      </small>
                    </div>
                    <strong className={item.type === "income" ? "income-amount" : "expense-amount"}>
                      {item.type === "income" ? "+" : "−"}
                      {formatMoney(item.amount)}
                    </strong>
                    <button
                      type="button"
                      className="delete-button"
                      onClick={() => removeTransaction(item.id)}
                      aria-label={`Hapus transaksi ${item.title}`}
                    >
                      ×
                    </button>
                  </article>
                ))
              ) : (
                <p className="empty-state">Belum ada transaksi di kategori ini.</p>
              )}
            </div>
            <div className="data-actions">
              <button type="button" className="ghost-button" onClick={exportCsv}>
                ⭳ Ekspor CSV
              </button>
              <button type="button" className="ghost-button" onClick={() => importInput.current?.click()}>
                ⭱ Impor CSV
              </button>
              <button type="button" className="ghost-button" onClick={resetDemo}>
                ↺ Data contoh
              </button>
              <input
                ref={importInput}
                type="file"
                accept=".csv,text/csv"
                className="visually-hidden"
                onChange={importCsv}
              />
            </div>
            <p className="demo-note">
              Data disimpan otomatis di localStorage browser ini. Jangan gunakan data keuangan asli.
            </p>
          </section>

          <section className="panel budget-panel" id="budget">
            <div className="panel-heading">
              <div>
                <h2>Anggaran bulanan</h2>
                <p>Pantau batas pengeluaranmu</p>
              </div>
              <span className={`budget-badge${status.overBudget ? " is-over" : ""}`}>
                {status.overBudget ? "Lewat batas" : `${Math.round(status.percent)}%`}
              </span>
            </div>
            <div className="budget-total">
              <strong>{formatMoney(status.spent)}</strong>
              <span>dari {formatMoney(status.budget)}</span>
            </div>
            <div className={`progress-track${status.overBudget ? " is-over" : ""}`}>
              <div className="progress-fill" style={{ width: `${status.displayPercent}%` }} />
            </div>
            <div className="budget-caption">
              <span>{Math.round(status.percent)}% terpakai</span>
              <span>
                {status.remaining >= 0
                  ? `${formatMoney(status.remaining)} tersisa`
                  : `${formatMoney(Math.abs(status.remaining))} lewat batas`}
              </span>
            </div>
            <form className="budget-form" onSubmit={saveBudget}>
              <label htmlFor="budget-input">Atur anggaran</label>
              <div className="budget-input-row">
                <input
                  id="budget-input"
                  name="budget"
                  type="number"
                  min="0"
                  step="100000"
                  key={budget}
                  defaultValue={budget}
                />
                <button type="submit" className="ghost-button">
                  Simpan
                </button>
              </div>
            </form>
            <div className={`budget-callout${status.overBudget ? " is-over" : ""}`}>
              <span>{status.overBudget ? "!" : "✦"}</span>
              <p>
                <strong>{status.overBudget ? "Anggaran terlampaui" : "Keuangan terpantau"}</strong>
                <br />
                {status.overBudget
                  ? "Kurangi pengeluaran tidak penting atau naikkan anggaran bulan ini."
                  : `Sisa ${formatMoney(Math.max(0, status.remaining))} bisa dialokasikan ke tabungan.`}
              </p>
            </div>
          </section>
        </div>

        <div className="insight-grid" id="insight">
          <section className="panel">
            <div className="panel-heading">
              <div>
                <h2>Komposisi pengeluaran</h2>
                <p>Kategori terbesar bulan ini</p>
              </div>
            </div>
            {categories.length ? (
              <div className="donut-row">
                <DonutChart data={categories} total={totals.expense} />
                <ul className="legend">
                  {categories.slice(0, 6).map((entry, index) => (
                    <li key={entry.category}>
                      <span className={`legend-dot chart-${(index % 8) + 1}`} />
                      <span className="legend-label">{entry.category}</span>
                      <span className="legend-value">{formatMoney(entry.amount)}</span>
                    </li>
                  ))}
                </ul>
              </div>
            ) : (
              <p className="empty-state">Belum ada pengeluaran untuk dianalisis.</p>
            )}
          </section>

          <section className="panel">
            <div className="panel-heading">
              <div>
                <h2>Tren harian</h2>
                <p>Pengeluaran per hari · {formatMonth(month)}</p>
              </div>
            </div>
            <TrendChart data={daily} monthLabel={formatMonth(month)} />
          </section>
        </div>

        <footer className="footer">
          FulusTracker <span>·</span> Demo statis — data tersimpan di browser, tanpa server.
        </footer>
      </section>

      {toast && (
        <div className="toast" role="status">
          {toast}
        </div>
      )}
    </main>
  );
}
