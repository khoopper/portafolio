import { createHash } from "crypto";
import fs from "fs/promises";
import path from "path";
import { cache } from "react";
import { readContent } from "@/lib/site-content";

/** Storage key for the CV in Supabase Storage (site-content bucket). */
export const CV_KEY = "cv.pdf";

/** Fallback local CV file shipped with the repository. */
const DEFAULT_CV_FILE = path.join(process.cwd(), "public", "documents", "Brandon-Ramirez-CV.pdf");

/** Maximum allowed file size for CV uploads: 5 MB */
export const CV_MAX_BYTES = 5 * 1024 * 1024;

let cachedCvVersion: string | null = null;

export function setCachedCvVersion(v: string | null) {
  cachedCvVersion = v;
}

/** Validates PDF magic bytes (%PDF-). */
export function isPdf(buf: Uint8Array): boolean {
  if (buf.length < 5) return false;
  const header = String.fromCharCode(...buf.subarray(0, 5));
  return header === "%PDF-";
}

/** Reads the current CV bytes (from Supabase Storage if uploaded, or default file on disk). */
export const getCV = cache(async (): Promise<Uint8Array | null> => {
  try {
    const stored = await readContent(CV_KEY);
    if (stored && stored.length > 0) return stored;
  } catch (err) {
    console.warn("[cv] no se pudo leer de storage, usando archivo base:", err);
  }

  try {
    return new Uint8Array(await fs.readFile(DEFAULT_CV_FILE));
  } catch {
    return null;
  }
});

/** Short content hash for cache busting (/api/cv?v=<hash>). */
export const cvVersion = (bytes: Uint8Array) => createHash("sha256").update(bytes).digest("hex").slice(0, 12);

/** Dynamic URL to access or download the active CV. Returns instantly from memory. */
export const getCVSrc = cache(async (): Promise<string | null> => {
  if (cachedCvVersion) return `/api/cv?v=${cachedCvVersion}`;
  const bytes = await getCV();
  if (!bytes) return null;
  cachedCvVersion = cvVersion(bytes);
  return `/api/cv?v=${cachedCvVersion}`;
});
