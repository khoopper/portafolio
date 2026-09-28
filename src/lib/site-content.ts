import { createServiceClient, isSupabaseConfigured } from "@/lib/supabase";

/**
 * Admin-edited content (projects list, logo, cv) lives in a private Supabase Storage bucket.
 * To ensure ultra-fast navigation (<5ms), contents are cached in-memory with TTL and invalidated on writes.
 */
const BUCKET = "site-content";

const isMissing = (error: { message?: string; status?: number; statusCode?: string | number }) =>
  error.status === 404 || String(error.statusCode) === "404" || /not.?found/i.test(error.message ?? "");

interface CacheEntry {
  data: Uint8Array | null;
  expiresAt: number;
}

const MEMORY_CACHE = new Map<string, CacheEntry>();
const CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutes in-memory cache

export function invalidateContentCache(key?: string) {
  if (key) {
    MEMORY_CACHE.delete(key);
  } else {
    MEMORY_CACHE.clear();
  }
}

/** The stored file, or null when it was never saved (or Supabase is not configured). Throws on outages. */
export async function readContent(key: string): Promise<Uint8Array | null> {
  const now = Date.now();
  const cached = MEMORY_CACHE.get(key);
  if (cached && cached.expiresAt > now) {
    return cached.data;
  }

  if (!isSupabaseConfigured()) return null;
  const { data, error } = await createServiceClient().storage.from(BUCKET).download(key);
  if (error) {
    if (isMissing(error)) {
      MEMORY_CACHE.set(key, { data: null, expiresAt: now + CACHE_TTL_MS });
      return null;
    }
    throw new Error(`No se pudo leer ${key}: ${error.message}`);
  }

  const result = new Uint8Array(await data.arrayBuffer());
  MEMORY_CACHE.set(key, { data: result, expiresAt: now + CACHE_TTL_MS });
  return result;
}

/** Saves (overwrites) a file; throws so the caller never reports a change that was not stored. */
export async function writeContent(key: string, body: Uint8Array | string, contentType: string): Promise<void> {
  if (!isSupabaseConfigured()) throw new Error("Supabase no está configurado: no se puede guardar.");
  const storage = createServiceClient().storage;
  const upload = () => storage.from(BUCKET).upload(key, body, { contentType, upsert: true, cacheControl: "0" });
  let { error } = await upload();
  if (error && isMissing(error)) {
    // First save ever: create the private bucket, then retry.
    await storage.createBucket(BUCKET, { public: false });
    ({ error } = await upload());
  }
  if (error) throw new Error(`No se pudo guardar ${key}: ${error.message}`);
  invalidateContentCache(key);
}
