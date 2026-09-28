/** "www.x.com" → "https://www.x.com"; null when the value is not a usable http(s) URL. */
function normalize(value: string | undefined): string | null {
  const raw = value?.trim();
  if (!raw) return null;
  try {
    const url = new URL(/^https?:\/\//i.test(raw) ? raw : `https://${raw}`);
    return url.origin;
  } catch {
    return null;
  }
}

/**
 * Public base URL of the site: SITE_URL if set (with or without https://), otherwise the production
 * domain Vercel reports (VERCEL_PROJECT_PRODUCTION_URL), otherwise local development.
 * Never throws: a malformed setting must not break the build.
 */
export function siteUrl(): string {
  return (
    normalize(process.env.SITE_URL) ??
    normalize(process.env.NEXT_PUBLIC_SITE_URL) ??
    normalize(process.env.VERCEL_PROJECT_PRODUCTION_URL) ??
    "http://localhost:3000"
  );
}
