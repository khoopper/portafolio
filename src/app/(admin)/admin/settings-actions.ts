"use server";

import { revalidatePath } from "next/cache";
import { hasAdminSession } from "@/lib/admin-auth";
import { parseProfileInput } from "@/lib/profile-input";
import { saveProfileOverrides, saveSettings } from "@/lib/profile-store";
import { parseSettingsInput } from "@/lib/settings-input";

export interface FormResult {
  ok: boolean;
  message: string;
}

// Profile and settings appear on every public page (Start menu, metadata, footer links, sitemap):
// regenerate everything under the root layout so nothing stale is served.
const refresh = () => {
  revalidatePath("/", "layout");
  revalidatePath("/admin/perfil");
  revalidatePath("/admin/configuracion");
};

export async function saveProfileAction(_prev: FormResult | null, formData: FormData): Promise<FormResult> {
  // Server Actions are public endpoints: the /admin proxy alone does not protect them.
  if (!(await hasAdminSession())) return { ok: false, message: "Sesión administrativa no válida." };
  const parsed = parseProfileInput(Object.fromEntries(formData));
  if (!parsed.ok) return { ok: false, message: parsed.error };
  try {
    await saveProfileOverrides(parsed.value);
  } catch (err) {
    console.error("[perfil] no se pudo guardar:", err);
    return { ok: false, message: "No se pudo guardar el perfil. Intenta de nuevo." };
  }
  refresh();
  return { ok: true, message: "Perfil actualizado." };
}

export async function saveSettingsAction(_prev: FormResult | null, formData: FormData): Promise<FormResult> {
  if (!(await hasAdminSession())) return { ok: false, message: "Sesión administrativa no válida." };
  const parsed = parseSettingsInput(Object.fromEntries(formData));
  if (!parsed.ok) return { ok: false, message: parsed.error };
  try {
    await saveSettings(parsed.value);
  } catch (err) {
    console.error("[configuración] no se pudo guardar:", err);
    return { ok: false, message: "No se pudo guardar la configuración. Intenta de nuevo." };
  }
  refresh();
  return { ok: true, message: "Configuración guardada." };
}
