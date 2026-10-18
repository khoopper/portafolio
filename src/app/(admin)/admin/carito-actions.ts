"use server";

import { revalidatePath } from "next/cache";
import { hasAdminSession } from "@/lib/admin-auth";
import { codeHash, newLicenceCode, newPairingCode } from "@/lib/carito/licence-codes";
import { parseGrant, renewedUntil } from "@/lib/carito/licence";
import { createServiceClient } from "@/lib/supabase";

export interface CaritoActionResult {
  ok: boolean;
  error?: string;
}

/** Como [CaritoActionResult], con el código hecho: la licencia nueva o el código de vinculación. */
export interface CaritoCodeResult extends CaritoActionResult {
  code?: string;
}

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const userIdOf = (formData: FormData) => {
  const id = String(formData.get("userId") ?? "");
  return UUID.test(id) ? id : null;
};
const licenceIdOf = (formData: FormData) => {
  const id = String(formData.get("licenceId") ?? "");
  return UUID.test(id) ? id : null;
};

/** Un código de teléfono: 5 caracteres Crockford (el que la app muestra en Ajustes > Cuenta y licencia). */
const DEVICE = /^[0-9A-HJKMNP-TV-Z]{5}$/;

// Server Actions are public endpoints: every one checks the admin session itself.

/** Gives or renews a licence: 1, 3, 6 or 12 months (added to the licence still running), a day, or no limit. Lifts a revocation. */
export async function grantCaritoLicenceAction(_prev: CaritoActionResult | null, formData: FormData): Promise<CaritoActionResult> {
  if (!(await hasAdminSession())) return { ok: false, error: "Sesión administrativa no válida." };
  const userId = userIdOf(formData);
  const grant = parseGrant(formData.get("mode"), formData.get("day"));
  if (!userId || !grant) return { ok: false, error: "Elige una duración válida." };

  const db = createServiceClient();
  const { data: member, error: readError } = await db
    .from("carito_members")
    .select("licence_until, licence_forever")
    .eq("user_id", userId)
    .maybeSingle();
  if (readError || !member) return { ok: false, error: "No se encontró a esa persona." };

  const values =
    grant.kind === "forever"
      ? { licence_forever: true }
      : { licence_forever: false, licence_until: grant.kind === "date" ? grant.day : renewedUntil(member.licence_forever ? null : member.licence_until, grant.months) };
  const { error } = await db
    .from("carito_members")
    .update({ ...values, revoked_at: null, licence_granted_at: new Date().toISOString() })
    .eq("user_id", userId);
  if (error) return { ok: false, error: "No se pudo guardar la licencia. Intenta de nuevo." };
  revalidatePath("/admin/carito");
  return { ok: true };
}

/** Revokes (the app locks at its next check) or restores access. */
export async function setCaritoRevokedAction(formData: FormData): Promise<void> {
  if (!(await hasAdminSession())) return;
  const userId = userIdOf(formData);
  if (!userId) return;
  const revoke = formData.get("revoke") === "1";
  const { error } = await createServiceClient()
    .from("carito_members")
    .update({ revoked_at: revoke ? new Date().toISOString() : null })
    .eq("user_id", userId);
  if (error) console.error("[carito] no se pudo cambiar la revocación:", error.message);
  revalidatePath("/admin/carito");
}

/** Frees the account's phone: the next phone that opens Carito with that account takes it (a new phone, a reinstall). */
export async function releaseCaritoDeviceAction(formData: FormData): Promise<void> {
  if (!(await hasAdminSession())) return;
  const userId = userIdOf(formData);
  if (!userId) return;
  const { error } = await createServiceClient().from("carito_members").update({ device_code: null }).eq("user_id", userId);
  if (error) console.error("[carito] no se pudo liberar el teléfono:", error.message);
  revalidatePath("/admin/carito");
}

/** Removes the registration and its library backup. The phone's trial is remembered: deleting does not give another one. */
export async function deleteCaritoMemberAction(formData: FormData): Promise<void> {
  if (!(await hasAdminSession())) return;
  const userId = userIdOf(formData);
  if (!userId) return;
  const { error } = await createServiceClient().from("carito_members").delete().eq("user_id", userId);
  if (error) console.error("[carito] no se pudo eliminar:", error.message);
  revalidatePath("/admin/carito");
}

// --- Licencias sin cuenta de Google (el amigo escribe el código una vez) ----------------------------------------------------

/** El nombre y el teléfono (opcional) que manda el diálogo, ya limpios, o el error que ve el dueño. */
function licenceInput(formData: FormData): { name: string; device: string | null; error?: string } {
  const name = String(formData.get("name") ?? "").trim().slice(0, 60);
  const device = String(formData.get("device") ?? "")
    .trim()
    .toUpperCase() || null;
  if (device && !DEVICE.test(device)) return { name, device: null, error: "El código del teléfono son 5 caracteres (0-9, A-Z sin I, L, O, U)." };
  return { name, device };
}

/**
 * Crea una licencia de 1, 3, 6 o 12 meses, hasta un día, o sin límite. Si se le da el código de un teléfono, queda
 * ligada a él desde ya; si no, la toma el primero que la escriba. El código vuelve al diálogo para copiarlo o mandarlo.
 */
export async function createCaritoLicenceAction(_prev: CaritoCodeResult | null, formData: FormData): Promise<CaritoCodeResult> {
  if (!(await hasAdminSession())) return { ok: false, error: "Sesión administrativa no válida." };
  const { name, device, error: badDevice } = licenceInput(formData);
  if (badDevice) return { ok: false, error: badDevice };
  const grant = parseGrant(formData.get("mode"), formData.get("day"));
  if (!grant) return { ok: false, error: "Elige una duración válida." };

  const code = newLicenceCode();
  const { error } = await createServiceClient()
    .from("carito_licences")
    .insert({
      code,
      name,
      device_code: device,
      licence_forever: grant.kind === "forever",
      licence_until: grant.kind === "forever" ? null : grant.kind === "date" ? grant.day : renewedUntil(null, grant.months),
      source: "panel",
    });
  if (error) return { ok: false, error: "No se pudo crear la licencia. Intenta de nuevo." };
  revalidatePath("/admin/carito");
  return { ok: true, code };
}

/** Renueva (los meses se suman desde el final de la vigente), cambia el último día, o la deja sin límite. Levanta una revocación. */
export async function renewCaritoLicenceAction(_prev: CaritoActionResult | null, formData: FormData): Promise<CaritoActionResult> {
  if (!(await hasAdminSession())) return { ok: false, error: "Sesión administrativa no válida." };
  const id = licenceIdOf(formData);
  const grant = parseGrant(formData.get("mode"), formData.get("day"));
  if (!id || !grant) return { ok: false, error: "Elige una duración válida." };

  const db = createServiceClient();
  const { data: licence, error: readError } = await db.from("carito_licences").select("licence_until, licence_forever").eq("id", id).maybeSingle();
  if (readError || !licence) return { ok: false, error: "No se encontró esa licencia." };

  const values =
    grant.kind === "forever"
      ? { licence_forever: true, licence_until: null }
      : {
          licence_forever: false,
          licence_until: grant.kind === "date" ? grant.day : renewedUntil(licence.licence_forever ? null : licence.licence_until, grant.months),
        };
  const { error } = await db.from("carito_licences").update({ ...values, revoked_at: null }).eq("id", id);
  if (error) return { ok: false, error: "No se pudo guardar la licencia. Intenta de nuevo." };
  revalidatePath("/admin/carito");
  return { ok: true };
}

/** Revoca (la app se bloquea en su siguiente comprobación) o restaura una licencia. */
export async function setCaritoLicenceRevokedAction(formData: FormData): Promise<void> {
  if (!(await hasAdminSession())) return;
  const id = licenceIdOf(formData);
  if (!id) return;
  const revoke = formData.get("revoke") === "1";
  const { error } = await createServiceClient()
    .from("carito_licences")
    .update({ revoked_at: revoke ? new Date().toISOString() : null })
    .eq("id", id);
  if (error) console.error("[carito] no se pudo cambiar la revocación de la licencia:", error.message);
  revalidatePath("/admin/carito");
}

/** Libera el teléfono de una licencia: el próximo que escriba el código la usa (también sirve para pasarla a otro teléfono). */
export async function releaseCaritoLicenceDeviceAction(formData: FormData): Promise<void> {
  if (!(await hasAdminSession())) return;
  const id = licenceIdOf(formData);
  if (!id) return;
  const { error } = await createServiceClient().from("carito_licences").update({ device_code: null }).eq("id", id);
  if (error) console.error("[carito] no se pudo liberar el teléfono de la licencia:", error.message);
  revalidatePath("/admin/carito");
}

/** Elimina la licencia (su teléfono se bloquea en la siguiente comprobación) y la copia de su biblioteca. */
export async function deleteCaritoLicenceAction(formData: FormData): Promise<void> {
  if (!(await hasAdminSession())) return;
  const id = licenceIdOf(formData);
  if (!id) return;
  const { error } = await createServiceClient().from("carito_licences").delete().eq("id", id);
  if (error) console.error("[carito] no se pudo eliminar la licencia:", error.message);
  revalidatePath("/admin/carito");
}

/**
 * El código de un solo uso (15 minutos) que el teléfono del dueño escribe en Ajustes > Cuenta y licencia para vincularse:
 * con él, el teléfono maneja las licencias y sube solo las que hizo en la 2.6.
 */
export async function createOwnerPairingAction(): Promise<CaritoCodeResult> {
  if (!(await hasAdminSession())) return { ok: false, error: "Sesión administrativa no válida." };
  const code = newPairingCode();
  const { error } = await createServiceClient()
    .from("carito_owner_pairings")
    .insert({ code_hash: codeHash(code), expires_at: new Date(Date.now() + 15 * 60 * 1000).toISOString() });
  if (error) return { ok: false, error: "No se pudo crear el código. Intenta de nuevo." };
  return { ok: true, code };
}
