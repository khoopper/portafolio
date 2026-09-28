"use server";

import { revalidatePath } from "next/cache";
import fs from "fs/promises";
import path from "path";
import { hasAdminSession } from "@/lib/admin-auth";
import { CV_KEY, CV_MAX_BYTES, cvVersion, isPdf, setCachedCvVersion } from "@/lib/cv";
import { writeContent } from "@/lib/site-content";

export interface CVActionResult {
  ok: boolean;
  message: string;
  version?: string;
}

export async function uploadCVAction(_prev: CVActionResult | null, formData: FormData): Promise<CVActionResult> {
  if (!(await hasAdminSession())) return { ok: false, message: "Sesión administrativa no válida." };

  const file = formData.get("cv");
  if (!(file instanceof File) || file.size === 0) return { ok: false, message: "Selecciona un archivo PDF." };
  if (file.size > CV_MAX_BYTES) return { ok: false, message: "El archivo supera el límite de 5 MB." };

  const data = new Uint8Array(await file.arrayBuffer());
  if (!isPdf(data)) return { ok: false, message: "Formato no válido. Debe ser un documento PDF." };

  try {
    await writeContent(CV_KEY, data, "application/pdf");
  } catch (err) {
    console.warn("[cv] No se pudo guardar en Supabase Storage, intentando copia local:", err);
    try {
      const localDocPath = path.join(process.cwd(), "public", "documents", "Brandon-Ramirez-CV.pdf");
      await fs.writeFile(localDocPath, data);
    } catch (localErr) {
      console.error("[cv] no se pudo guardar ni en storage ni en local:", localErr);
      return { ok: false, message: "No se pudo guardar el archivo. Intenta de nuevo." };
    }
  }

  // Keep local static document in sync when running in Node environment
  try {
    const localDocPath = path.join(process.cwd(), "public", "documents", "Brandon-Ramirez-CV.pdf");
    await fs.writeFile(localDocPath, data);
  } catch {
    // Non-fatal if serverless filesystem is read-only
  }

  const version = cvVersion(data);
  setCachedCvVersion(version);
  revalidatePath("/", "layout");
  revalidatePath("/admin/perfil");
  revalidatePath("/admin/configuracion");
  return { ok: true, message: "Currículum actualizado con éxito.", version };
}
