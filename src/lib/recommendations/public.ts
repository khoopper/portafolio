import type { RecommendationProvider } from "./identity";

export const AVATAR_BUCKET = "recommendation-avatars";

/** Columns of the public_recommendations view (no email, no provider_sub). */
export interface PublicRecommendationRow {
  id: string;
  project_slug: string;
  provider: RecommendationProvider;
  name: string;
  avatar_path: string | null;
  email_domain: string | null;
  role: string;
  company: string;
  body: string;
  created_at: string;
}

export interface PublicRecommendation {
  id: string;
  projectSlug: string;
  provider: RecommendationProvider;
  name: string;
  avatarUrl: string | null;
  emailDomain: string | null;
  role: string;
  company: string;
  body: string;
  createdAt: string;
}

export const PROVIDER_LABEL: Record<RecommendationProvider, "Google" | "LinkedIn"> = { google: "Google", linkedin_oidc: "LinkedIn" };

export const avatarPublicUrl = (supabaseUrl: string, path: string) =>
  `${supabaseUrl.replace(/\/+$/, "")}/storage/v1/object/public/${AVATAR_BUCKET}/${path}`;

/** Picks fields one by one: extra (private) columns in the row can never reach the page. */
export function toPublicRecommendation(row: PublicRecommendationRow, supabaseUrl: string): PublicRecommendation {
  return {
    id: row.id,
    projectSlug: row.project_slug,
    provider: row.provider,
    name: row.name,
    avatarUrl: row.avatar_path ? avatarPublicUrl(supabaseUrl, row.avatar_path) : null,
    emailDomain: row.email_domain,
    role: row.role,
    company: row.company,
    body: row.body,
    createdAt: row.created_at,
  };
}
