import type { Metadata } from "next";
import { Inter, Archivo } from "next/font/google";
import "./globals.css";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });
const archivo = Archivo({ subsets: ["latin"], weight: ["400", "500", "600", "700", "800", "900"], variable: "--font-archivo" });

export const metadata: Metadata = {
  title: "Basel — brand asset management for agencies",
  description: "Basel gives every client one clean brand hub — every asset, every version, findable in seconds. Live in ten minutes.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${inter.variable} ${archivo.variable}`}>
      <body className="font-sans antialiased">{children}</body>
    </html>
  );
}
