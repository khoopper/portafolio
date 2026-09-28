"use server";

import { revalidatePath } from "next/cache";
import { hasAdminSession } from "@/lib/admin-auth";
import { isMediaFolder, storeImage } from "@/lib/media";
import { saveProfileOverrides } from "@/lib/profile-store";

export interface MediaActionResult {
  ok: boolean;
  message: string;
  url?: string;
}

async function readImage(formData: FormData): Promise<Uint8Array | string> {
  const file = formData.get("image");
  if (!(file instanceof File) || file.size === 0) return "Selecciona una imagen.";
  return new Uint8Array(await file.arrayBuffer());
}

/** Uploads a project image to Storage and returns its public URL (the form stores only that URL). */
export async function uploadProjectImageAction(formData: FormData): Promise<MediaActionResult> {
  if (!(await hasAdminSession())) return { ok: false, message: "Sesión administrativa no válida." };
  const folder = formData.get("folder");
  if (!isMediaFolder(folder) || folder !== "projects") return { ok: false, message: "Destino no válido." };
  const data = await readImage(formData);
  if (typeof data === "string") return { ok: false, message: data };
  const stored = await storeImage("projects", data);
  return stored.ok ? { ok: true, message: "Imagen subida.", url: stored.url } : stored;
}

/** Uploads the profile photo to Storage and saves its URL as the site's avatar. */
export async function uploadAvatarAction(_prev: MediaActionResult | null, formData: FormData): Promise<MediaActionResult> {
  if (!(await hasAdminSession())) return { ok: false, message: "Sesión administrativa no válida." };
  const data = await readImage(formData);
  if (typeof data === "string") return { ok: false, message: data };
  const stored = await storeImage("profile", data);
  if (!stored.ok) return stored;
  try {
    await saveProfileOverrides({ avatar: stored.url });
  } catch (err) {
    console.error("[avatar] no se pudo guardar:", err);
    return { ok: false, message: "No se pudo guardar la fotografía. Intenta de nuevo." };
  }
  revalidatePath("/", "layout");
  revalidatePath("/admin/perfil");
  return { ok: true, message: "Fotografía actualizada.", url: stored.url };
}
