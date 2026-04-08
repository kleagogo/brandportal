import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Brand Portal",
  description: "Your brand portal, in 30 seconds.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
