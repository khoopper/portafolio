import { createServiceClient } from "@/lib/supabase";
import { memberState, type LicenceFields, type MemberState } from "./licence";

/** A phone registered in Carito Music, as the admin panel lists it. */
export interface CaritoMember extends LicenceFields {
  userId: string;
  email: string;
  name: string | null;
  photoUrl: string | null;
  deviceCode: string | null;
  deviceModel: string | null;
  appVersion: string | null;
  registeredAt: string;
  lastSeenAt: string;
  legacy: boolean;
  deviceChanges: number;
  playlists: number;
  favorites: number;
  librarySavedAt: string | null;
  state: MemberState;
}

const COLUMNS =
  "user_id, email, name, photo_url, device_code, device_model, app_version, registered_at, last_seen_at, trial_ends_at, " +
  "licence_until, licence_forever, legacy, revoked_at, device_changes, carito_libraries(playlists, favorites, updated_at)";

interface Row extends LicenceFields {
  user_id: string;
  email: string;
  name: string | null;
  photo_url: string | null;
  device_code: string | null;
  device_model: string | null;
  app_version: string | null;
  registered_at: string;
  last_seen_at: string;
  legacy: boolean;
  device_changes: number;
  carito_libraries: { playlists: number; favorites: number; updated_at: string } | null;
}

/** Everyone registered, the most recently seen first. Throws when the database can't be reached (or the migration is missing). */
export async function listCaritoMembers(now: Date = new Date()): Promise<CaritoMember[]> {
  const { data, error } = await createServiceClient().from("carito_members").select(COLUMNS).order("last_seen_at", { ascending: false });
  if (error) throw new Error(error.message);
  return (data as unknown as Row[]).map((row) => ({
    userId: row.user_id,
    email: row.email,
    name: row.name,
    photoUrl: row.photo_url,
    deviceCode: row.device_code,
    deviceModel: row.device_model,
    appVersion: row.app_version,
    registeredAt: row.registered_at,
    lastSeenAt: row.last_seen_at,
    legacy: row.legacy,
    deviceChanges: row.device_changes,
    revoked_at: row.revoked_at,
    licence_forever: row.licence_forever,
    licence_until: row.licence_until,
    trial_ends_at: row.trial_ends_at,
    playlists: row.carito_libraries?.playlists ?? 0,
    favorites: row.carito_libraries?.favorites ?? 0,
    librarySavedAt: row.carito_libraries?.updated_at ?? null,
    state: memberState(row, now),
  }));
}
