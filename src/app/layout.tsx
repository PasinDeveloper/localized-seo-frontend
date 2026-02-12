import type { Metadata } from "next";
import { QueryProvider } from "@/components/providers/QueryProvider";
import { getSiteUrl } from "@/lib/seo";
import "./globals.css";

/*
  Root App Router layout.

  Provides site-level metadata defaults and wraps the app with shared providers.
*/

export const metadata: Metadata = {
  metadataBase: new URL(getSiteUrl()),
  title: {
    default: "Localized Recipe Blog",
    template: "%s | Localized Recipe Blog",
  },
  description: "A localized recipe storytelling interface.",
  robots: {
    index: true,
    follow: true,
  },
  twitter: {
    card: "summary_large_image",
  },
};

interface RootLayoutProps {
  children: React.ReactNode;
}

export default function RootLayout({ children }: RootLayoutProps) {
  return (
    <html lang="en">
      <body>
        <QueryProvider>{children}</QueryProvider>
      </body>
    </html>
  );
}
