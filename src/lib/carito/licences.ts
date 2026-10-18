import { createServiceClient } from "@/lib/supabase";
import { licenceStart, licenceState, type LicenceState, type LicenceStateFields } from "./licence";

/**
 * Las licencias que el dueño reparte sin cuenta de Google, como las lista el panel: quién la tiene, hasta cuándo, en qué
 * teléfono la escribió y la copia de su biblioteca. Las reglas del estado viven en `licence.ts` (las mismas del SQL).
 */

export { licenceHasAccess, licenceState } from "./licence";
export type { LicenceState, LicenceStateFields } from "./licence";

export interface CaritoLicence extends LicenceStateFields {
  id: string;
  code: string;
  name: string;
  deviceCode: string | null;
  deviceModel: string | null;
  appVersion: string | null;
  /** Quién la creó: el panel, la app del dueño, o la importación de las licencias de la 2.6. */
  source: "panel" | "app" | "import";
  state: LicenceState;
  /** Un teléfono ya la escribió (o estaba ligada a él desde que se creó). */
  activated: boolean;
  /** Cuándo se registró: cuando se creó o, las de la 2.6, el día en que el dueño la dio entonces. */
  createdAt: string;
  activatedAt: string | null;
  /** El día en que empezó ("YYYY-MM-DD" en El Salvador): el de la 2.6, o el primero en que un teléfono la escribió. */
  startedOn: string | null;
  lastSeenAt: string | null;
  deviceChanges: number;
  playlists: number;
  favorites: number;
  librarySavedAt: string | null;
}

const BASE_COLUMNS =
  "id, code, name, device_code, device_model, app_version, licence_until, licence_forever, revoked_at, source, " +
  "created_at, activated_at, last_seen_at, device_changes, carito_licence_libraries(playlists, favorites, updated_at)";
// trial_days llega con 20261018020000_carito_licence_trials.sql; sin esa migración la lista se lee igual, sin pruebas.
const COLUMNS = `${BASE_COLUMNS}, trial_days`;

interface Row extends LicenceStateFields {
  id: string;
  code: string;
  name: string;
  device_code: string | null;
  device_model: string | null;
  app_version: string | null;
  source: "panel" | "app" | "import";
  created_at: string;
  activated_at: string | null;
  last_seen_at: string | null;
  device_changes: number;
  carito_licence_libraries: { playlists: number; favorites: number; updated_at: string } | null;
}

/** Todas las licencias, las más nuevas primero. Lanza si la base no responde (o falta la migración). */
export async function listCaritoLicences(now: Date = new Date()): Promise<CaritoLicence[]> {
  const db = createServiceClient();
  const read = (columns: string) => db.from("carito_licences").select(columns).order("created_at", { ascending: false });
  let { data, error } = await read(COLUMNS);
  if (error?.message.includes("trial_days")) ({ data, error } = await read(BASE_COLUMNS));
  if (error) throw new Error(error.message);
  return (data as unknown as Row[]).map((row) => ({
    id: row.id,
    code: row.code,
    name: row.name,
    deviceCode: row.device_code,
    deviceModel: row.device_model,
    appVersion: row.app_version,
    source: row.source,
    state: licenceState(row, now),
    revoked_at: row.revoked_at,
    licence_until: row.licence_until,
    licence_forever: row.licence_forever,
    trial_days: row.trial_days ?? null,
    activated: row.activated_at !== null || row.device_code !== null,
    createdAt: row.created_at,
    activatedAt: row.activated_at,
    startedOn: licenceStart(row),
    lastSeenAt: row.last_seen_at,
    deviceChanges: row.device_changes,
    playlists: row.carito_licence_libraries?.playlists ?? 0,
    favorites: row.carito_licence_libraries?.favorites ?? 0,
    librarySavedAt: row.carito_licence_libraries?.updated_at ?? null,
  }));
}
