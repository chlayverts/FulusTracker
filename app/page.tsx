"use client";
import { FormEvent, useMemo, useState } from "react";
type Transaction = { id: number; title: string; category: string; date: string; amount: number; type: "income" | "expense" };
const initialTransactions: Transaction[] = [
  { id: 1, title: "Gaji bulanan", category: "Pemasukan", date: "2026-11-01", amount: 8500000, type: "income" },
  { id: 2, title: "Belanja bulanan", category: "Kebutuhan", date: "2026-11-03", amount: 1250000, type: "expense" },
  { id: 3, title: "Kopi dan makan siang", category: "Makanan", date: "2026-11-05", amount: 85000, type: "expense" },
  { id: 4, title: "Proyek desain", category: "Freelance", date: "2026-11-07", amount: 1200000, type: "income" },
  { id: 5, title: "Tagihan internet", category: "Tagihan", date: "2026-11-09", amount: 350000, type: "expense" },
];
const money = (value: number) => new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", maximumFractionDigits: 0 }).format(value);
export default function Home() {
  const [transactions, setTransactions] = useState(initialTransactions);
  const [filter, setFilter] = useState<"all" | "income" | "expense">("all");
  const [showForm, setShowForm] = useState(false);
  const totals = useMemo(() => transactions.reduce((sum, item) => ({
    income: sum.income + (item.type === "income" ? item.amount : 0),
    expense: sum.expense + (item.type === "expense" ? item.amount : 0),
  }), { income: 0, expense: 0 }), [transactions]);
  const visible = transactions.filter(item => filter === "all" || item.type === filter);
  function addTransaction(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const data = new FormData(form);
    const amount = Number(data.get("amount"));
    const title = String(data.get("title")).trim();
    if (!title || !Number.isFinite(amount) || amount <= 0) return;
    setTransactions(current => [{
      id: Date.now(), title, category: String(data.get("category")), date: String(data.get("date")),
      amount, type: String(data.get("type")) as "income" | "expense",
    }, ...current]);
    form.reset();
    setShowForm(false);
  }
  return <main className="shell">
    <aside className="sidebar">
      <a className="brand" href="#overview" aria-label="FulusTracker beranda"><span className="brand-mark">f</span><span>fulus<span className="brand-light">tracker</span></span></a>
      <p className="side-label">MENU</p><a className="nav-item active" href="#overview"><span>◫</span> Ringkasan</a>
      <a className="nav-item" href="#transactions"><span>⇄</span> Transaksi</a><a className="nav-item" href="#budget"><span>◎</span> Anggaran</a>
      <div className="sidebar-bottom"><div className="avatar">D</div><div><strong>Demo User</strong><small>Mode pratinjau</small></div></div>
    </aside>
    <section className="main-area">
      <header className="topbar"><div><span className="eyebrow">KEUANGAN PRIBADI</span><h1>Selamat pagi 👋</h1><p>Ini ringkasan kondisi keuanganmu bulan ini.</p></div><button className="primary-button" onClick={() => setShowForm(!showForm)}>＋ <span>Tambah transaksi</span></button></header>
      <section className="stats" id="overview" aria-label="Ringkasan keuangan">
        <article className="stat-card balance-card"><div className="stat-top"><span>Total saldo</span><span className="stat-icon">◈</span></div><strong>{money(totals.income - totals.expense)}</strong><small><span className="positive">↑ Keuangan terpantau</span> · November 2026</small></article>
        <article className="stat-card"><div className="stat-top"><span>Total pemasukan</span><span className="stat-icon green">↙</span></div><strong>{money(totals.income)}</strong><small className="muted">Bulan ini</small></article>
        <article className="stat-card"><div className="stat-top"><span>Total pengeluaran</span><span className="stat-icon orange">↗</span></div><strong>{money(totals.expense)}</strong><small className="muted">Bulan ini</small></article>
      </section>
      {showForm && <form className="transaction-form" onSubmit={addTransaction}>
        <div className="form-heading"><div><span className="eyebrow">CATAT AKTIVITAS</span><h2>Transaksi baru</h2></div><button type="button" className="close-button" onClick={() => setShowForm(false)} aria-label="Tutup form">×</button></div>
        <label>Nama transaksi<input required name="title" placeholder="Contoh: Belanja mingguan" maxLength={80} /></label>
        <div className="form-row"><label>Jumlah (rupiah)<input required name="amount" type="number" min="1" step="1" placeholder="150000" /></label><label>Jenis<select name="type"><option value="expense">Pengeluaran</option><option value="income">Pemasukan</option></select></label></div>
        <div className="form-row"><label>Kategori<select name="category"><option>Kebutuhan</option><option>Makanan</option><option>Tagihan</option><option>Transportasi</option><option>Hiburan</option><option>Freelance</option><option>Pemasukan</option><option>Lainnya</option></select></label><label>Tanggal<input required name="date" type="date" defaultValue="2026-11-11" /></label></div>
        <button className="primary-button submit-button" type="submit">Simpan transaksi</button>
      </form>}
      <div className="content-grid">
        <section className="panel transactions-panel" id="transactions"><div className="panel-heading"><div><h2>Transaksi terbaru</h2><p>Catatan keuanganmu bulan ini</p></div>
          <select className="filter-select" aria-label="Filter transaksi" value={filter} onChange={event => setFilter(event.target.value as typeof filter)}><option value="all">Semua</option><option value="income">Pemasukan</option><option value="expense">Pengeluaran</option></select></div>
          <div className="transaction-list">{visible.length ? visible.map(item => <article className="transaction" key={item.id}><span className={`transaction-icon ${item.type}`}>{item.type === "income" ? "↙" : "↗"}</span><div className="transaction-name"><strong>{item.title}</strong><small>{item.category} · {new Date(item.date + "T00:00:00").toLocaleDateString("id-ID", { day: "numeric", month: "short" })}</small></div><strong className={item.type === "income" ? "income-amount" : "expense-amount"}>{item.type === "income" ? "+" : "−"}{money(item.amount)}</strong></article>) : <p className="empty-state">Belum ada transaksi di kategori ini.</p>}</div>
          <p className="demo-note">Data contoh untuk pratinjau. Perubahan hanya tersimpan selama halaman terbuka.</p>
        </section>
        <section className="panel budget-panel" id="budget"><div className="panel-heading"><div><h2>Anggaran bulanan</h2><p>Pantau batas pengeluaranmu</p></div><span className="budget-dots">•••</span></div>
          <div className="budget-total"><strong>{money(totals.expense)}</strong><span>dari {money(5000000)}</span></div>
          <div className="progress-track"><div className="progress-fill" style={{ width: `${Math.min(100, totals.expense / 5000000 * 100)}%` }} /></div>
          <div className="budget-caption"><span>{Math.round(totals.expense / 5000000 * 100)}% terpakai</span><span>{money(Math.max(0, 5000000 - totals.expense))} tersisa</span></div>
          <div className="budget-callout"><span>✦</span><p><strong>Terus pantau pengeluaranmu</strong><br />Kamu bisa mengatur anggaran setelah fitur ini dikembangkan.</p></div>
        </section>
      </div>
      <footer className="footer">FulusTracker <span>·</span> Demo lokal — jangan gunakan data keuangan asli.</footer>
    </section>
  </main>;
}
