import type { Metadata } from "next";
import type { ReactNode } from "react";

/**
 * khoopper.com/carito is private: it is shared by its QR code and its link, never listed. No search engine indexes it or follows its
 * links (also sent as an X-Robots-Tag header in next.config.ts), it is not in the sitemap and the portfolio does not link to it.
 */
export const metadata: Metadata = {
  robots: { index: false, follow: false, nocache: true, googleBot: { index: false, follow: false, noimageindex: true } },
};

export default function CaritoLayout({ children }: { children: ReactNode }) {
  return children;
}
