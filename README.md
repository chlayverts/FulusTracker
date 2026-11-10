# FulusTracker

Aplikasi pencatat keuangan pribadi untuk membantu kamu memahami pemasukan, pengeluaran, dan anggaran bulanan.

> **Status:** tahap awal pengembangan. Versi pertama berfokus pada dashboard demo yang berjalan di browser dengan data contoh.

## Fitur versi awal

- Ringkasan saldo, pemasukan, dan pengeluaran.
- Daftar transaksi dengan kategori dan tanggal.
- Form untuk menambah transaksi pemasukan atau pengeluaran.
- Filter transaksi sederhana.
- Tampilan responsif untuk desktop dan ponsel.

## Teknologi

- Next.js (App Router)
- React
- TypeScript
- CSS

## Menjalankan di komputer

### 1. Pasang kebutuhan

Install [Node.js versi LTS](https://nodejs.org/) dan Git.

### 2. Clone repository

```bash
git clone https://github.com/chlayverts/FulusTracker.git
cd FulusTracker
```

### 3. Install dependency dan jalankan

```bash
npm install
npm run dev
```

Buka [http://localhost:3000](http://localhost:3000).

## Perintah yang tersedia

```bash
npm run dev      # jalankan server pengembangan
npm run build    # buat build produksi
npm run start    # jalankan build produksi
npm run lint     # periksa kualitas kode
```

## Catatan data dan keamanan

Versi awal ini menggunakan data demo di sisi browser. Jangan masukkan informasi rekening, kata sandi, atau data keuangan sensitif. Autentikasi dan penyimpanan database belum disiapkan.

## Rencana pengembangan

1. Simpan transaksi secara lokal dan sediakan ekspor CSV.
2. Tambahkan autentikasi dan database dengan kebijakan akses per pengguna.
3. Tambahkan anggaran kategori, grafik, dan laporan bulanan.
4. Tambahkan pengujian dan CI sebelum rilis.

## Kontribusi

Silakan buat issue untuk menyampaikan bug atau ide fitur. Perubahan kode dapat diajukan melalui pull request.
