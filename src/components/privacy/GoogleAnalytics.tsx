"use client";

import { usePathname } from "next/navigation";
import Script from "next/script";
import { useEffect } from "react";
import { useConsent } from "@/lib/consent";

const GA_ID = /^G-[A-Z0-9]{6,14}$/;

/** Deletes the _ga* cookies Google set (they live on the site's domain or its parent domain). */
function clearGoogleCookies() {
  const parts = location.hostname.split(".");
  const domains = ["", location.hostname, ...parts.map((_, i) => "." + parts.slice(i).join("."))];
  for (const cookie of document.cookie.split(";")) {
    const name = cookie.split("=")[0].trim();
    if (!/^_ga(_|$)/.test(name)) continue;
    for (const domain of domains) document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/${domain ? `; domain=${domain}` : ""}`;
  }
}

/**
 * Google Analytics 4. Nothing is downloaded from Google until the visitor accepts «Estadísticas» in the
 * privacy center (and never with Do Not Track, nor inside /admin). Withdrawing the consent stops
 * measurement immediately and deletes Google's cookies.
 */
export function GoogleAnalytics({ id }: { id: string | null }) {
  const consent = useConsent();
  const pathname = usePathname();
  const valid = id !== null && GA_ID.test(id);
  const allowed = valid && consent?.analytics === true && navigator.doNotTrack !== "1" && !pathname.startsWith("/admin");

  useEffect(() => {
    if (!valid) return;
    (window as unknown as Record<string, boolean>)[`ga-disable-${id}`] = !allowed;
    if (consent && !consent.analytics) clearGoogleCookies();
  }, [valid, id, allowed, consent]);

  if (!valid || consent?.analytics !== true) return null;
  return (
    <>
      <Script src={`https://www.googletagmanager.com/gtag/js?id=${id}`} strategy="afterInteractive" />
      <Script id="google-analytics" strategy="afterInteractive">
        {`window.dataLayer=window.dataLayer||[];function gtag(){dataLayer.push(arguments);}gtag('js',new Date());gtag('config','${id}',{anonymize_ip:true});`}
      </Script>
    </>
  );
}
