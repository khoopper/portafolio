import type { NextConfig } from "next";

const isDev = process.env.NODE_ENV === "development";

// Host of this site's own Supabase project (the only allowed remote image origin).
const supabaseHost = (() => {
  try {
    return new URL(process.env.SUPABASE_URL ?? process.env.NEXT_PUBLIC_SUPABASE_URL ?? "").hostname || null;
  } catch {
    return null;
  }
})();

// Public pages stay cacheable, so scripts use 'unsafe-inline' instead of nonces
// (nonces force dynamic rendering). Revisit in Phase 4 with experimental SRI.
const csp = [
  "default-src 'self'",
  // challenges.cloudflare.com: Turnstile anti-bot widget on the admin login. googletagmanager.com: Google
  // Analytics, only downloaded after the visitor accepts «Estadísticas» in the privacy center.
  `script-src 'self' 'unsafe-inline' https://challenges.cloudflare.com https://www.googletagmanager.com${isDev ? " 'unsafe-eval'" : ""}`,
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' data: blob: https:",
  "font-src 'self'",
  `connect-src 'self' https://*.google-analytics.com https://*.analytics.google.com https://*.googletagmanager.com${isDev ? " ws: wss:" : ""}`,
  "media-src 'self'",
  // Only the players the WMP embeds, plus Turnstile. (Web demos open as links, never framed.)
  "frame-src https://www.youtube-nocookie.com https://player.vimeo.com https://challenges.cloudflare.com",
  "object-src 'none'",
  "base-uri 'self'",
  "form-action 'self'",
  "frame-ancestors 'none'",
  ...(isDev ? [] : ["upgrade-insecure-requests"]),
].join("; ");

const securityHeaders = [
  { key: "Content-Security-Policy", value: csp },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "X-Frame-Options", value: "DENY" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=(), payment=(), usb=(), browsing-topics=()" },
  // Isolate the browsing context: no other origin keeps a handle to our windows.
  { key: "Cross-Origin-Opener-Policy", value: "same-origin" },
  ...(isDev ? [] : [{ key: "Strict-Transport-Security", value: "max-age=63072000; includeSubDomains; preload" }]),
];

const nextConfig: NextConfig = {
  poweredByHeader: false,
  // Keep the dev-only indicator off the Start orb (bottom-left).
  devIndicators: { position: "top-right" },
  // The dev server listens on 127.0.0.1 only; allow opening it as "localhost" too (live reload).
  allowedDevOrigins: ["localhost", "127.0.0.1"],
  experimental: {
    serverActions: {
      bodySizeLimit: "6mb",
    },
  },
  // Recommendation photos copied to Supabase Storage (next/image). Only this project's host and no
  // query string: a wildcard host or free query would turn /_next/image into an open proxy/cache-buster.
  images: {
    remotePatterns: supabaseHost
      ? [
          { protocol: "https", hostname: supabaseHost, pathname: "/storage/v1/object/public/recommendation-avatars/**", search: "" },
          // Project images and the profile photo uploaded from the admin panel (site-media bucket).
          { protocol: "https", hostname: supabaseHost, pathname: "/storage/v1/object/public/site-media/**", search: "" },
        ]
      : [],
  },
  async headers() {
    // Invitation links carry a secret token: never leak it to Google/LinkedIn via Referer.
    const noReferrer = [{ key: "Referrer-Policy", value: "no-referrer" }];
    return [
      { source: "/:path*", headers: securityHeaders },
      { source: "/r/:path*", headers: noReferrer },
      { source: "/auth/:path*", headers: noReferrer },
      // Admin screens never belong in search results.
      { source: "/admin/:path*", headers: [{ key: "X-Robots-Tag", value: "noindex, nofollow" }] },
    ];
  },
};

export default nextConfig;
