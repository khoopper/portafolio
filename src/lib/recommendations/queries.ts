import { createAnonClient, createServiceClient, isSupabaseConfigured, supabaseUrl } from "@/lib/supabase";
import { hashInviteToken, inviteStatus, isWellFormedToken, type InviteStatus } from "./invite";
import { toPublicRecommendation, type PublicRecommendation, type PublicRecommendationRow } from "./public";

const PUBLIC_COLUMNS = "id, project_slug, provider, name, avatar_path, email_domain, role, company, body, created_at";

interface RecCacheEntry {
  data: PublicRecommendation[];
  expiresAt: number;
}

const REC_CACHE = new Map<string, RecCacheEntry>();
const REC_CACHE_TTL_MS = 60 * 1000; // 1 minute in-memory cache

export function invalidateRecommendationsCache() {
  REC_CACHE.clear();
}

/** Approved recommendations, newest first. Cached for fast sub-millisecond response times. */
export async function getApprovedRecommendations(projectSlug?: string): Promise<PublicRecommendation[]> {
  const cacheKey = projectSlug ?? "__all__";
  const now = Date.now();
  const cached = REC_CACHE.get(cacheKey);
  if (cached && cached.expiresAt > now) {
    return cached.data;
  }

  if (!isSupabaseConfigured()) return [];
  let query = createAnonClient().from("public_recommendations").select(PUBLIC_COLUMNS).order("created_at", { ascending: false });
  if (projectSlug) query = query.eq("project_slug", projectSlug);
  const { data, error } = await query;
  if (error) {
    console.error("[recomendaciones] lectura pública falló:", error.message);
    return [];
  }
  const result = (data as PublicRecommendationRow[]).map((row) => toPublicRecommendation(row, supabaseUrl()));
  REC_CACHE.set(cacheKey, { data: result, expiresAt: now + REC_CACHE_TTL_MS });
  return result;
}

export interface InviteLookup {
  status: InviteStatus;
  projectSlug: string;
}

/** null when the token is malformed or unknown; throws when the database can't be reached. */
export async function findInvite(token: string): Promise<InviteLookup | null> {
  if (!isSupabaseConfigured() || !isWellFormedToken(token)) return null;
  const { data, error } = await createServiceClient()
    .from("recommendation_invites")
    .select("project_slug, expires_at, used_at, revoked_at")
    .eq("token_hash", hashInviteToken(token))
    .maybeSingle();
  if (error) throw new Error(error.message);
  return data ? { status: inviteStatus(data), projectSlug: data.project_slug } : null;
}

export interface AdminInvite {
  id: string;
  projectSlug: string;
  note: string;
  status: InviteStatus;
  createdAt: string;
}

export interface AdminRecommendation extends PublicRecommendation {
  email: string;
  status: "pending" | "approved" | "hidden";
}

/** Admin reads hit Supabase live; one slow or dropped request must not turn into a 500 page. */
async function retrying<T>(run: () => Promise<T>, attempts = 3): Promise<T> {
  let last: unknown;
  for (let i = 0; i < attempts; i++) {
    try {
      return await run();
    } catch (err) {
      last = err;
      await new Promise((resolve) => setTimeout(resolve, 300 * (i + 1)));
    }
  }
  throw last;
}

/** Revoked invitations are deleted by the admin action; any old revoked rows stay out of the list. */
export const listInvites = (): Promise<AdminInvite[]> =>
  retrying(async () => {
    const { data, error } = await createServiceClient()
      .from("recommendation_invites")
      .select("id, project_slug, note, expires_at, used_at, revoked_at, created_at")
      .is("revoked_at", null)
      .order("created_at", { ascending: false });
    if (error) throw new Error(error.message);
    return data.map((row) => ({ id: row.id, projectSlug: row.project_slug, note: row.note, status: inviteStatus(row), createdAt: row.created_at }));
  });

export const listAllRecommendations = (): Promise<AdminRecommendation[]> =>
  retrying(async () => {
    const { data, error } = await createServiceClient()
      .from("recommendations")
      .select(`${PUBLIC_COLUMNS}, email, status`)
      .order("created_at", { ascending: false });
    if (error) throw new Error(error.message);
    return data.map((row) => ({ ...toPublicRecommendation(row, supabaseUrl()), email: row.email, status: row.status }));
  });
