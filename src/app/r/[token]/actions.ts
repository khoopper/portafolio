"use server";

import { revalidatePath } from "next/cache";
import { copyAvatar } from "@/lib/recommendations/avatar";
import { corporateDomain } from "@/lib/recommendations/email-domain";
import { readVerifiedIdentity } from "@/lib/recommendations/identity";
import { parseRecommendationInput, type RecommendationField } from "@/lib/recommendations/input";
import { hashInviteToken, isWellFormedToken } from "@/lib/recommendations/invite";
import { AVATAR_BUCKET } from "@/lib/recommendations/public";
import { createServiceClient, createSessionClient, isSupabaseConfigured } from "@/lib/supabase";

export interface SubmitResult {
  ok: boolean;
  error?: string;
  fieldErrors?: Partial<Record<RecommendationField, string>>;
}

export async function submitRecommendationAction(token: string, _prev: SubmitResult | null, formData: FormData): Promise<SubmitResult> {
  const parsed = parseRecommendationInput({ role: formData.get("role"), company: formData.get("company"), body: formData.get("body") });
  if (!parsed.ok) return { ok: false, fieldErrors: parsed.errors };
  if (!isSupabaseConfigured() || !isWellFormedToken(token)) return { ok: false, error: "Este link de invitación no es válido." };

  const session = await createSessionClient();
  const {
    data: { user },
  } = await session.auth.getUser();
  const identity = user ? readVerifiedIdentity(user) : null;
  if (!identity) return { ok: false, error: "Tu sesión caducó o la cuenta no tiene correo verificado. Vuelve a iniciar sesión." };

  const service = createServiceClient();
  const id = crypto.randomUUID();
  const avatarPath = await copyAvatar(service, identity.pictureUrl, id);
  const { error } = await service.rpc("submit_recommendation", {
    p_id: id,
    p_token_hash: hashInviteToken(token),
    p_provider: identity.provider,
    p_provider_sub: identity.sub,
    p_name: identity.name,
    p_email: identity.email,
    p_email_domain: corporateDomain(identity.email),
    p_role: parsed.value.role,
    p_company: parsed.value.company,
    p_body: parsed.value.body,
    p_avatar_path: avatarPath,
  });

  if (error) {
    if (avatarPath) await service.storage.from(AVATAR_BUCKET).remove([avatarPath]);
    if (error.code === "23505") return { ok: false, error: "Ya dejaste una recomendación para este proyecto." };
    if (error.code === "P0001") return { ok: false, error: "Este link ya no es válido: se usó, caducó o fue anulado." };
    console.error("[recomendaciones] envío falló:", error.message);
    return { ok: false, error: "No se pudo guardar. Intenta más tarde; tu link sigue siendo válido." };
  }

  // The visitor's session only existed for this wizard.
  await session.auth.signOut();
  revalidatePath("/admin/recomendaciones");
  return { ok: true };
}
