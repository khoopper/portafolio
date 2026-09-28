import { createServiceClient, isSupabaseConfigured } from "@/lib/supabase";
import type { EventKind } from "./event";

export interface SiteStats {
  /** false when Supabase is not configured or the site_events migration was not applied yet. */
  available: boolean;
  viewsToday: number;
  viewsWeek: number;
  viewsMonth: number;
  visitorsToday: number;
  /** Sum of each day's unique visitors over 7 days (a visitor is not linked across days). */
  visitorDaysWeek: number;
  /** Visits = one visitor id on one day. */
  visits: number;
  singlePageVisits: number;
  entryPages: { path: string; visits: number }[];
  exitPages: { path: string; visits: number }[];
  byDay: { day: string; views: number; visitors: number }[];
  topPages: { path: string; views: number }[];
  countries: { country: string; views: number }[];
  devices: { device: string; views: number }[];
  clicks: Record<Exclude<EventKind, "view">, number>;
  recent: { createdAt: string; kind: EventKind; path: string; country: string | null; device: string }[];
}

export const emptyStats = (available = false): SiteStats => ({
  available,
  viewsToday: 0,
  viewsWeek: 0,
  viewsMonth: 0,
  visitorsToday: 0,
  visitorDaysWeek: 0,
  visits: 0,
  singlePageVisits: 0,
  entryPages: [],
  exitPages: [],
  byDay: [],
  topPages: [],
  countries: [],
  devices: [],
  clicks: { cv: 0, demo: 0, repo: 0, contact: 0 },
  recent: [],
});

const num = (v: unknown): number => (typeof v === "number" && Number.isFinite(v) ? v : 0);
const str = (v: unknown): string => (typeof v === "string" ? v : "");
const list = (v: unknown): Record<string, unknown>[] =>
  Array.isArray(v) ? v.filter((x): x is Record<string, unknown> => typeof x === "object" && x !== null) : [];

/** Turns the JSON returned by public.site_stats() into a safe shape (missing pieces become zeros). */
export function normalizeStats(raw: unknown): SiteStats {
  if (typeof raw !== "object" || raw === null) return emptyStats(true);
  const r = raw as Record<string, unknown>;
  const stats = emptyStats(true);
  stats.viewsToday = num(r.views_today);
  stats.viewsWeek = num(r.views_7d);
  stats.viewsMonth = num(r.views_30d);
  stats.visitorsToday = num(r.visitors_today);
  stats.visitorDaysWeek = num(r.visitor_days_7d);
  stats.visits = num(r.visits);
  stats.singlePageVisits = num(r.single_page_visits);
  stats.entryPages = list(r.entry_pages).map((d) => ({ path: str(d.path), visits: num(d.visits) }));
  stats.exitPages = list(r.exit_pages).map((d) => ({ path: str(d.path), visits: num(d.visits) }));
  stats.byDay = list(r.by_day).map((d) => ({ day: str(d.day), views: num(d.views), visitors: num(d.visitors) }));
  stats.topPages = list(r.top_pages).map((d) => ({ path: str(d.path), views: num(d.views) }));
  stats.countries = list(r.countries).map((d) => ({ country: str(d.country), views: num(d.views) }));
  stats.devices = list(r.devices).map((d) => ({ device: str(d.device), views: num(d.views) }));
  for (const c of list(r.clicks)) {
    const kind = str(c.kind);
    if (kind === "cv" || kind === "demo" || kind === "repo" || kind === "contact") stats.clicks[kind] = num(c.total);
  }
  stats.recent = list(r.recent).map((d) => ({
    createdAt: str(d.created_at),
    kind: str(d.kind) as EventKind,
    path: str(d.path),
    country: str(d.country) || null,
    device: str(d.device),
  }));
  return stats;
}

/** Real numbers for the admin panel; zeros (and available=false) when nothing can be read. Never throws. */
export async function getSiteStats(): Promise<SiteStats> {
  if (!isSupabaseConfigured()) return emptyStats(false);
  try {
    const { data, error } = await createServiceClient().rpc("site_stats", { p_days: 30 });
    if (error) return emptyStats(false);
    return normalizeStats(data);
  } catch {
    return emptyStats(false);
  }
}
