import type { Metadata } from "next";
import "./globals.css";
export const metadata: Metadata = {
  title: "FulusTracker — Kelola uang dengan lebih sadar",
  description: "Dashboard sederhana untuk memantau pemasukan, pengeluaran, dan anggaran bulanan.",
};
export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="id"><body>{children}</body></html>;
}
