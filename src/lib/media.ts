import { createHash } from "crypto";
import { imageType } from "@/lib/brand";
import { createServiceClient, isSupabaseConfigured } from "@/lib/supabase";

/** Public Storage bucket for images uploaded from the admin panel. The database keeps only their URL. */
export const MEDIA_BUCKET = "site-media";
/** The browser shrinks images before upload; this is the hard limit the server enforces. */
export const MEDIA_MAX_BYTES = 3 * 1024 * 1024;

export type MediaFolder = "projects" | "profile";
export const isMediaFolder = (v: unknown): v is MediaFolder => v === "projects" || v === "profile";

const EXT = { "image/png": "png", "image/jpeg": "jpg", "image/webp": "webp" } as const;

/** Content-addressed key: the same image always lands on the same URL, and a new image never overwrites an old one. */
export function mediaKey(folder: MediaFolder, data: Uint8Array, type: keyof typeof EXT): string {
  return `${folder}/${createHash("sha256").update(data).digest("hex").slice(0, 16)}.${EXT[type]}`;
}

export type StoreResult = { ok: true; url: string } | { ok: false; message: string };

/** Validates and stores an image in Supabase Storage; returns its public URL. */
export async function storeImage(folder: MediaFolder, data: Uint8Array): Promise<StoreResult> {
  if (!isSupabaseConfigured()) return { ok: false, message: "Supabase no está configurado: no se pueden subir imágenes." };
  if (data.length === 0 || data.length > MEDIA_MAX_BYTES) return { ok: false, message: "La imagen supera el límite de 3 MB." };
  const type = imageType(data);
  if (!type) return { ok: false, message: "Formato no admitido. Usa PNG, JPG o WebP." };

  const storage = createServiceClient().storage;
  const key = mediaKey(folder, data, type);
  const upload = () => storage.from(MEDIA_BUCKET).upload(key, data, { contentType: type, upsert: true, cacheControl: "31536000" });

  let { error } = await upload();
  if (error && /not.?found|bucket/i.test(error.message)) {
    // First upload ever: create the public bucket (images only, capped), then retry.
    await storage.createBucket(MEDIA_BUCKET, { public: true, fileSizeLimit: MEDIA_MAX_BYTES, allowedMimeTypes: Object.keys(EXT) });
    ({ error } = await upload());
  }
  if (error) {
    console.error("[media] no se pudo subir:", error.message);
    return { ok: false, message: "No se pudo subir la imagen. Intenta de nuevo." };
  }
  return { ok: true, url: storage.from(MEDIA_BUCKET).getPublicUrl(key).data.publicUrl };
}
