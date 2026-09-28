"use server";

import { revalidatePath } from "next/cache";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { hasAdminSession } from "@/lib/admin-auth";
import { getAllProjects } from "@/lib/data";
import { generateInviteToken, INVITE_TTL_DAYS } from "@/lib/recommendations/invite";
import { invalidateRecommendationsCache } from "@/lib/recommendations/queries";
import { siteUrl } from "@/lib/site-url";
import { createServiceClient } from "@/lib/supabase";

export interface CreateInviteResult {
  ok: boolean;
  error?: string;
  link?: string;
}

// Server Actions are public endpoints: every one checks the admin session itself.
export async function createInviteAction(_prev: CreateInviteResult | null, formData: FormData): Promise<CreateInviteResult> {
  if (!(await hasAdminSession())) return { ok: false, error: "Sesión administrativa no válida." };
  const projectSlug = String(formData.get("projectSlug") ?? "");
  const note = String(formData.get("note") ?? "").trim().slice(0, 120);
  if (!(await getAllProjects()).some((p) => p.slug === projectSlug)) return { ok: false, error: "Elige un proyecto válido." };
  if (!note) return { ok: false, error: "Escribe una nota para reconocer la invitación." };

  const { token, hash } = generateInviteToken();
  const expiresAt = new Date(Date.now() + INVITE_TTL_DAYS * 24 * 60 * 60 * 1000).toISOString();
  const { error } = await createServiceClient()
    .from("recommendation_invites")
    .insert({ project_slug: projectSlug, note, token_hash: hash, expires_at: expiresAt });
  if (error) return { ok: false, error: "No se pudo crear la invitación. Intenta de nuevo." };

  revalidatePath("/admin/recomendaciones");
  // The link points at the site the admin is using right now. Next rejects Server Actions whose Origin
  // differs from the Host, so this header is the site's own address, never a cross-site value.
  const origin = (await headers()).get("origin") ?? siteUrl();
  // The only time the token exists in clear: the database keeps just its hash.
  return { ok: true, link: `${origin}/r/${token}` };
}

export async function revokeInviteAction(formData: FormData): Promise<void> {
  if (!(await hasAdminSession())) redirect("/admin/login");
  // "Revocar" removes the invitation for good (its link stops working and it leaves the list). Used ones stay:
  // a published recommendation still points at them.
  const { error } = await createServiceClient()
    .from("recommendation_invites")
    .delete()
    .eq("id", String(formData.get("id") ?? ""))
    .is("used_at", null);
  if (error) console.error("[invitaciones] no se pudo eliminar:", error.message);
  revalidatePath("/admin/recomendaciones");
}

export async function setRecommendationStatusAction(formData: FormData): Promise<void> {
  if (!(await hasAdminSession())) redirect("/admin/login");
  const status = formData.get("status");
  if (status !== "approved" && status !== "hidden") return;
  const { data } = await createServiceClient()
    .from("recommendations")
    .update({ status, reviewed_at: new Date().toISOString() })
    .eq("id", String(formData.get("id") ?? ""))
    .select("project_slug")
    .maybeSingle();
  invalidateRecommendationsCache();
  revalidatePath("/admin/recomendaciones");
  revalidatePath("/recomendaciones");
  if (data) {
    revalidatePath(`/proyectos/${data.project_slug}`);
    revalidatePath(`/p/${data.project_slug}`);
  }
}
