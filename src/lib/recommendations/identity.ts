import type { User } from "@supabase/supabase-js";

export type RecommendationProvider = "google" | "linkedin_oidc";

const PROVIDERS = new Set<string>(["google", "linkedin_oidc"]);
export const isRecommendationProvider = (p: string): p is RecommendationProvider => PROVIDERS.has(p);

export interface VerifiedIdentity {
  provider: RecommendationProvider;
  /** Account id at the provider: private, used to stop duplicate recommendations. */
  sub: string;
  name: string;
  email: string;
  pictureUrl: string | null;
}

/** The identity the visitor last signed in with, only when the provider vouches for the email. */
export function readVerifiedIdentity(user: User): VerifiedIdentity | null {
  const identity = [...(user.identities ?? [])]
    .filter((i) => isRecommendationProvider(i.provider))
    .sort((a, b) => (b.last_sign_in_at ?? "").localeCompare(a.last_sign_in_at ?? ""))[0];
  const data = identity?.identity_data;
  if (!identity || !data) return null;

  const verified = data.email_verified === true || data.email_verified === "true";
  const email = typeof data.email === "string" ? data.email : user.email;
  const name = String(data.full_name ?? data.name ?? "").trim();
  const sub = String(data.sub ?? identity.id ?? "");
  if (!verified || !email || !name || !sub) return null;

  const picture = data.picture ?? data.avatar_url;
  return {
    provider: identity.provider as RecommendationProvider,
    sub,
    name,
    email,
    pictureUrl: typeof picture === "string" && picture.startsWith("https://") ? picture : null,
  };
}
