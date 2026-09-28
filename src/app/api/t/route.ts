import { NextResponse, type NextRequest } from "next/server";
import { parseEvent } from "@/lib/analytics/event";
import { deviceOf, isBot, visitorId } from "@/lib/analytics/visitor";
import { createServiceClient, isSupabaseConfigured } from "@/lib/supabase";

const MAX_BODY = 1024;
const PER_MINUTE = 60;

// Best-effort brake per instance: one visitor cannot flood the table from a single server.
const hits = new Map<string, { count: number; since: number }>();
function tooMany(id: string, now: number): boolean {
  const h = hits.get(id);
  if (!h || now - h.since > 60_000) {
    if (hits.size > 5000) hits.clear();
    hits.set(id, { count: 1, since: now });
    return false;
  }
  return ++h.count > PER_MINUTE;
}

const quiet = () => new NextResponse(null, { status: 204 });

/**
 * Cookieless visit counter. Stores the page, country (from Vercel), device class and a one-day hashed
 * visitor id. Never stores the IP. Always answers 204: statistics must never break the site.
 */
export async function POST(request: NextRequest) {
  try {
    if (!isSupabaseConfigured()) return quiet();
    const { headers } = request;
    // "Do Not Track" and Global Privacy Control are respected on the server too.
    if (headers.get("dnt") === "1" || headers.get("sec-gpc") === "1") return quiet();
    const origin = headers.get("origin");
    if (origin && new URL(origin).host !== request.nextUrl.host) return quiet();
    const ua = headers.get("user-agent");
    if (isBot(ua)) return quiet();

    const text = await request.text();
    if (text.length > MAX_BODY) return quiet();
    const event = parseEvent(JSON.parse(text));
    if (!event) return quiet();

    const now = Date.now();
    const day = new Date(now).toISOString().slice(0, 10);
    const ip = headers.get("x-forwarded-for")?.split(",")[0].trim() || headers.get("x-real-ip") || "";
    const secret = process.env.ANALYTICS_SALT || process.env.SUPABASE_SECRET_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY || "";
    if (!secret) return quiet();
    const visitor = visitorId(secret, day, ip, ua ?? "");
    if (tooMany(visitor, now)) return quiet();

    const country = headers.get("x-vercel-ip-country");
    const db = createServiceClient();
    await db.from("site_events").insert({
      kind: event.kind,
      path: event.path,
      project_slug: event.projectSlug,
      country: country && /^[A-Z]{2}$/.test(country) ? country : null,
      device: deviceOf(ua ?? ""),
      visitor,
    });
  } catch {
    // Malformed body, database down, table missing: nothing to do.
  }
  return quiet();
}
