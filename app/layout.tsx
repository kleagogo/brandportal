import type { Metadata } from "next";
import { Inter, Onest } from "next/font/google";
import "./globals.css";
import { MARKETING_URL, SITE_URL } from "@/lib/seo";
import { cn } from "@/lib/utils";
import { TooltipProvider } from "@/components/ui/tooltip";

// The two faces the marketing site is set in, so the product reads as the same
// brand as the page people arrived from: Onest carries the wordmark and
// headings, Inter carries everything else. Hub *content* still renders in
// whatever typefaces that client's brand declares, loaded per hub.
const inter = Inter({ subsets: ["latin"], variable: "--font-sans" });
const onest = Onest({ subsets: ["latin"], variable: "--font-display" });

const TITLE = "Pitho · brand asset management for agencies";
const DESCRIPTION =
  "Pitho gives every client one clean brand hub: logos, colours, fonts and guidelines in one shareable place. Built for agencies and studios managing brands for clients. Live in ten minutes.";

/**
 * Site-wide metadata. `metadataBase` matters more than it looks: without it
 * the Open Graph image and canonical URLs resolve relative, so links shared
 * in Slack or LinkedIn render bare. Private pages override `robots` via
 * PRIVATE_PAGE in lib/seo.
 */
export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: { default: TITLE, template: "%s · Pitho" },
  description: DESCRIPTION,
  applicationName: "Pitho",
  alternates: { canonical: "/" },
  openGraph: {
    type: "website",
    siteName: "Pitho",
    url: "/",
    title: TITLE,
    description: DESCRIPTION,
  },
  twitter: { card: "summary_large_image", title: TITLE, description: DESCRIPTION },
  robots: { index: true, follow: true },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={cn("font-sans", inter.variable, onest.variable)}>
      <body className="font-sans antialiased">
        <TooltipProvider>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "SoftwareApplication",
              name: "Pitho",
              applicationCategory: "BusinessApplication",
              description: DESCRIPTION,
              url: MARKETING_URL,
              offers: { "@type": "Offer", price: "0", priceCurrency: "EUR" },
            }),
          }}
        />
        {children}
        </TooltipProvider>
      </body>
    </html>
  );
}
