import type { Metadata } from "next";
import { uz } from "@/lib/i18n/uz";
import "./globals.css";

export const metadata: Metadata = uz.meta;

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="uz" className="h-full antialiased">
      <body className="flex min-h-full flex-col bg-slate-100 text-slate-950">{children}</body>
    </html>
  );
}
