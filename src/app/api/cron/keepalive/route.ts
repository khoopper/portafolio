import { NextResponse, type NextRequest } from "next/server";
import { isCronAuthorized } from "@/lib/cron-auth";
import { createServiceClient, isSupabaseConfigured } from "@/lib/supabase";

/** Visit rows older than this are deleted (same window the privacy policy states). */
const RETENTION_DAYS = 180;

export const dynamic = "force-dynamic";

/**
 * Runs twice a day from vercel.json. Supabase's free plan pauses a project after a week without
 * activity; a small database read here keeps it awake. It also purges expired visit rows.
 */
export async function GET(request: NextRequest) {
  if (!isCronAuthorized(request.headers.get("authorization"), process.env.CRON_SECRET)) {
    return NextResponse.json({ ok: false }, { status: 401 });
  }
  if (!isSupabaseConfigured()) return NextResponse.json({ ok: false, reason: "supabase-not-configured" }, { status: 503 });

  const db = createServiceClient();
  const { error } = await db.from("site_events").select("id", { head: true, count: "exact" }).limit(1);
  // A missing table (migration not applied) still counts as database activity, but report it.
  const purge = await db.from("site_events").delete().lt("created_at", new Date(Date.now() - RETENTION_DAYS * 86_400_000).toISOString());

  return NextResponse.json({ ok: true, database: error ? `error: ${error.code ?? "unknown"}` : "ok", purge: purge.error ? "skipped" : "ok" });
}
