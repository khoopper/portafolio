"use server";

import { revalidatePath } from "next/cache";
import { hasAdminSession } from "@/lib/admin-auth";
import { LOGO_KEY, LOGO_MAX_BYTES, imageType, logoVersion } from "@/lib/brand";
import { writeContent } from "@/lib/site-content";

export interface LogoActionResult {
  ok: boolean;
  message: string;
  /** Content hash of the stored logo (cache-busting query for previews). */
  version?: string;
}

export async function uploadLogoAction(_prev: LogoActionResult | null, formData: FormData): Promise<LogoActionResult> {
  if (!(await hasAdminSession())) return { ok: false, message: "Sesión administrativa no válida." };

  const file = formData.get("logo");
  if (!(file instanceof File) || file.size === 0) return { ok: false, message: "Selecciona una imagen." };
  if (file.size > LOGO_MAX_BYTES) return { ok: false, message: "La imagen supera 900 KB." };

  const data = new Uint8Array(await file.arrayBuffer());
  const type = imageType(data);
  if (!type) return { ok: false, message: "Formato no admitido. Usa PNG, JPG o WebP." };

  try {
    await writeContent(LOGO_KEY, data, type);
  } catch (err) {
    console.error("[logo] no se pudo guardar:", err);
    return { ok: false, message: "No se pudo guardar el logotipo. Intenta de nuevo." };
  }
  // Every page embeds the versioned logo URL: regenerate them so the new logo shows everywhere.
  revalidatePath("/", "layout");
  return { ok: true, message: "Logotipo actualizado.", version: logoVersion(data) };
}
