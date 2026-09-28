import type { Metadata, Viewport } from "next";
import type { ReactNode } from "react";
import { GoogleAnalytics } from "@/components/privacy/GoogleAnalytics";
import { PrivacyCenter } from "@/components/privacy/PrivacyCenter";
import { Tracker } from "@/components/privacy/Tracker";
import { getProfile, getSettings } from "@/lib/data";
import { siteUrl } from "@/lib/site-url";
import "./globals.css";

export async function generateMetadata(): Promise<Metadata> {
  const [settings, profile] = await Promise.all([getSettings(), getProfile()]);
  const base = siteUrl();
  return {
    // Absolute URLs for link previews (WhatsApp) and canonical links.
    metadataBase: new URL(base),
    title: { default: settings.seoTitle, template: `%s · ${profile.name}` },
    description: settings.seoDescription,
    applicationName: settings.seoTitle,
    authors: [{ name: profile.name, url: base }],
    creator: profile.name,
    keywords: [profile.name, "portafolio", "desarrollador Full Stack", "Ingeniero en Sistemas", "Next.js", "React", "TypeScript", "Supabase", profile.location],
    formatDetection: { telephone: false },
    robots: { index: true, follow: true, googleBot: { index: true, follow: true, "max-image-preview": "large", "max-snippet": -1, "max-video-preview": -1 } },
    openGraph: { type: "website", siteName: settings.seoTitle, locale: "es_LA", title: settings.seoTitle, description: settings.seoDescription },
    twitter: { card: "summary_large_image", title: settings.seoTitle, description: settings.seoDescription },
    // Search Console ownership: the token is set from the admin panel (Configuración → Google).
    verification: settings.googleSiteVerification ? { google: settings.googleSiteVerification } : undefined,
  };
}

export const viewport: Viewport = {
  themeColor: "#0f5da0",
};

export default async function RootLayout({ children }: { children: ReactNode }) {
  const { gaMeasurementId } = await getSettings();
  return (
    <html lang="es">
      <body>
        {children}
        <PrivacyCenter />
        <Tracker />
        <GoogleAnalytics id={gaMeasurementId} />
      </body>
    </html>
  );
}
