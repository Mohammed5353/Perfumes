import { ClerkProvider } from "@clerk/nextjs";
import "./globals.css";
import "@/bones/registry";
import type { Metadata } from "next";
import type { ReactNode } from "react";
import SiteShell from "@/components/layout/SiteShell";

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: "Scentora | Timeless Scents, Lasting Impressions",
  description:
    "Discover elegant, long-lasting fragrances crafted for individuality. Premium scents, trusted by 25k+ users.",
  openGraph: {
    title: "Scentora | Timeless Scents, Lasting Impressions",
    description:
      "Discover elegant, long-lasting fragrances crafted for individuality. Premium scents, trusted by 25k+ users.",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: {
  children: ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className="text-textPrimary">
        <ClerkProvider>
          <SiteShell>{children}</SiteShell>
        </ClerkProvider>
      </body>
    </html>
  );
}
