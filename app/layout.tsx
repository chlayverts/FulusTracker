import type { Metadata, Viewport } from "next";
import "./globals.css";
import "./enhancements.css";

const basePath = process.env.NEXT_PUBLIC_BASE_PATH ?? "";

export const metadata: Metadata = {
  title: "FulusTracker — Kelola uang dengan lebih sadar",
  description:
    "Dashboard keuangan pribadi: catat transaksi, atur anggaran, dan lihat insight pengeluaran. Semua data tersimpan lokal di browser.",
  manifest: `${basePath}/manifest.webmanifest`,
  icons: { icon: `${basePath}/icon.svg` },
  openGraph: {
    title: "FulusTracker",
    description:
      "Dashboard keuangan pribadi dengan pencatatan transaksi, anggaran, dan insight pengeluaran di browser.",
    type: "website",
  },
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#f7f9f7" },
    { media: "(prefers-color-scheme: dark)", color: "#0c1411" },
  ],
};

// Runs before paint so a saved dark theme never flashes light first.
const themeScript = `try{var s=localStorage.getItem("fulustracker:theme");document.documentElement.dataset.theme=s==="dark"||(!s&&window.matchMedia("(prefers-color-scheme: dark)").matches)?"dark":"light"}catch(e){}`;

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="id" suppressHydrationWarning>
      <body>
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
        {children}
      </body>
    </html>
  );
}
