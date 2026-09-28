import type { SupabaseClient } from "@supabase/supabase-js";
import { imageType } from "@/lib/brand";
import { AVATAR_BUCKET } from "./public";

export const AVATAR_MAX_BYTES = 2 * 1024 * 1024;
const AVATAR_HOSTS = [/\.googleusercontent\.com$/, /^media\.licdn\.com$/];

/** Only the providers' own image hosts: the server never fetches arbitrary URLs. */
export function isAllowedAvatarUrl(url: string): boolean {
  try {
    const { protocol, hostname } = new URL(url);
    return protocol === "https:" && AVATAR_HOSTS.some((re) => re.test(hostname));
  } catch {
    return false;
  }
}

/**
 * LinkedIn photo URLs expire after a few weeks, so the photo is copied to our Storage.
 * Returns the stored path, or null (the card then shows initials) on any problem.
 */
export async function copyAvatar(client: SupabaseClient, url: string | null, id: string): Promise<string | null> {
  if (!url || !isAllowedAvatarUrl(url)) return null;
  try {
    const res = await fetch(url, { redirect: "error", signal: AbortSignal.timeout(5000) });
    if (!res.ok || Number(res.headers.get("content-length") ?? 0) > AVATAR_MAX_BYTES) return null;
    // Limitation: without content-length the whole body is read before the size check; stream with a cap if abused.
    const buf = new Uint8Array(await res.arrayBuffer());
    const type = buf.byteLength <= AVATAR_MAX_BYTES ? imageType(buf) : null;
    if (!type) return null;
    const path = `${id}.${type.split("/")[1]}`;
    const { error } = await client.storage.from(AVATAR_BUCKET).upload(path, buf, { contentType: type, upsert: true });
    return error ? null : path;
  } catch {
    return null;
  }
}
