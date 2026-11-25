/**
 * The versions of Carito Music that can be downloaded, read from the same files the apps read to update themselves:
 * the phone's latest.json (the latest GitHub release) and the PC's latest-pc.json (the release tagged "pc").
 * A missing or broken file gives null, and the page then says the download is coming soon instead of breaking.
 */

const REPO = "khoopper/carito-music";

export const ANDROID_MANIFEST = `https://github.com/${REPO}/releases/latest/download/latest.json`;
export const PC_MANIFEST = `https://github.com/${REPO}/releases/download/pc/latest-pc.json`;
export const ALL_RELEASES = `https://github.com/${REPO}/releases`;

/** Downloads may only point at this repository's releases (a tampered manifest must not send people elsewhere). */
const DOWNLOAD_PREFIX = `https://github.com/${REPO}/releases/download/`;

export type CaritoRelease = {
  version: string;
  url: string;
  fileName: string;
  sizeBytes: number | null;
  notes: string[];
};

export function parseRelease(json: unknown): CaritoRelease | null {
  if (!json || typeof json !== "object") return null;
  const data = json as Record<string, unknown>;
  const version = typeof data.versionName === "string" ? data.versionName.trim() : "";
  const url = typeof data.apkUrl === "string" ? data.apkUrl.trim() : "";
  if (!/^\d+(\.\d+){1,3}$/.test(version) || !url.startsWith(DOWNLOAD_PREFIX) || /[\s"'<>]/.test(url)) return null;
  // The phone's file says "size", the PC's says "sizeBytes".
  const rawSize = typeof data.sizeBytes === "number" ? data.sizeBytes : typeof data.size === "number" ? data.size : null;
  const sizeBytes = rawSize !== null && Number.isFinite(rawSize) && rawSize > 0 ? rawSize : null;
  const notes = Array.isArray(data.notes)
    ? data.notes.filter((n): n is string => typeof n === "string" && n.trim().length > 0).map((n) => n.trim()).slice(0, 8)
    : [];
  return { version, url, fileName: decodeURIComponent(url.slice(url.lastIndexOf("/") + 1)), sizeBytes, notes };
}

/** "107345659" → "102 MB" (the unit people see in Android's downloads). */
export function formatSize(bytes: number | null): string | null {
  if (!bytes) return null;
  const mb = bytes / 1048576;
  return `${mb >= 10 ? Math.round(mb) : mb.toFixed(1)} MB`;
}

async function read(url: string): Promise<CaritoRelease | null> {
  try {
    const response = await fetch(url, { next: { revalidate: 3600 }, signal: AbortSignal.timeout(8000) });
    if (!response.ok) return null;
    return parseRelease(await response.json());
  } catch {
    return null;
  }
}

export async function getCaritoReleases(): Promise<{ android: CaritoRelease | null; pc: CaritoRelease | null }> {
  const [android, pc] = await Promise.all([read(ANDROID_MANIFEST), read(PC_MANIFEST)]);
  return { android, pc };
}
