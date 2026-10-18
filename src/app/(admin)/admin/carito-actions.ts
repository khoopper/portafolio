"use server";

import { revalidatePath } from "next/cache";
import { hasAdminSession } from "@/lib/admin-auth";
import { parseGrant, renewedUntil } from "@/lib/carito/licence";
import { createServiceClient } from "@/lib/supabase";

export interface CaritoActionResult {
  ok: boolean;
  error?: string;
}

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const userIdOf = (formData: FormData) => {
  const id = String(formData.get("userId") ?? "");
  return UUID.test(id) ? id : null;
};

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
