import { cache } from "react";
import type { User } from "@supabase/supabase-js";
import { createSessionClient, isSupabaseConfigured } from "@/lib/supabase";

/** The one account allowed into /admin (server-only env). Recommenders also hold Supabase sessions. */
export const adminEmail = () => (process.env.ADMIN_EMAIL ?? "").trim().toLowerCase() || null;

export const isAdminConfigured = () => isSupabaseConfigured() && adminEmail() !== null;

/**
 * Admin = the configured email AND a completed second factor (aal2).
 * A stolen password alone (aal1), or any other account (e.g. a recommender's Google login), is not enough.
 */
export function isAdminIdentity(email: string | null | undefined, assuranceLevel: string | null | undefined, expectedEmail: string | null): boolean {
  return Boolean(expectedEmail && email && email.trim().toLowerCase() === expectedEmail && assuranceLevel === "aal2");
}

/** The authenticated admin, validated against the Supabase Auth server (getUser), or null. Deduplicated per request. */
export const getAdminUser = cache(async (): Promise<User | null> => {
  if (!isAdminConfigured()) return null;
  const supabase = await createSessionClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;
  const { data } = await supabase.auth.mfa.getAuthenticatorAssuranceLevel();
  return isAdminIdentity(user.email, data?.currentLevel, adminEmail()) ? user : null;
});

export async function hasAdminSession(): Promise<boolean> {
  return (await getAdminUser()) !== null;
}
