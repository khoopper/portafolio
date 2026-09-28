import { createHash } from "crypto";
import fs from "fs/promises";
import path from "path";
import { cache } from "react";
import { readContent } from "@/lib/site-content";

/** The desktop shortcut logo. Replaced from the admin panel (stored in Supabase Storage). */
export const LOGO_KEY = "logo.png";
/** Logo shipped with the code, used until one is uploaded. */
const DEFAULT_LOGO_FILE = path.join(process.cwd(), "src", "content", "brand", "logo.png");
// Below the 1 MB default body limit of Server Actions (the form adds a little overhead).
export const LOGO_MAX_BYTES = 900 * 1024;

/** Content type from the file's magic bytes (never trust the upload's declared type).
 *  SVG is deliberately not accepted: served from our origin it could run script. */
export function imageType(buf: Uint8Array): "image/png" | "image/jpeg" | "image/webp" | null {
  const ascii = (from: number, to: number) => String.fromCharCode(...buf.subarray(from, to));
  if (buf.length > 8 && buf[0] === 0x89 && ascii(1, 4) === "PNG") return "image/png";
  if (buf.length > 3 && buf[0] === 0xff && buf[1] === 0xd8 && buf[2] === 0xff) return "image/jpeg";
  if (buf.length > 12 && ascii(0, 4) === "RIFF" && ascii(8, 12) === "WEBP") return "image/webp";
  return null;
}

/** Current logo bytes (uploaded one, or the default). */
export const getLogo = cache(async (): Promise<Uint8Array> => (await readContent(LOGO_KEY)) ?? new Uint8Array(await fs.readFile(DEFAULT_LOGO_FILE)));

/** Short content hash: /brand/logo?v=<hash> can be cached forever and still change when the logo does. */
export const logoVersion = (bytes: Uint8Array) => createHash("sha256").update(bytes).digest("hex").slice(0, 12);

export const getLogoSrc = cache(async () => `/brand/logo?v=${logoVersion(await getLogo())}`);
