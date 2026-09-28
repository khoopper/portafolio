import { createServerClient, type CookieOptions } from "@supabase/ssr";
import { createClient } from "@supabase/supabase-js";
import { cookies } from "next/headers";

// Only the server uses these, so they carry no NEXT_PUBLIC_ prefix (never inlined into browser bundles).
// The old NEXT_PUBLIC_* names are still accepted so existing .env files keep working.
export const supabaseUrl = () => process.env.SUPABASE_URL ?? process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
/** Publishable (public) key: safe to expose, every table is protected by RLS/grants. */
export const supabasePublishableKey = () =>
  process.env.SUPABASE_PUBLISHABLE_KEY ?? process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ?? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "";
/** Secret key: bypasses RLS. Server only; never prefix it with NEXT_PUBLIC_. */
const secretKey = () => process.env.SUPABASE_SECRET_KEY ?? process.env.SUPABASE_SERVICE_ROLE_KEY ?? "";
const noSession = { auth: { persistSession: false, autoRefreshToken: false } };

/**
 * Session cookies: only the server reads them (no browser Supabase client), so they are httpOnly.
 * 12 h max age, renewed on use: an idle session dies after half a day.
 */
export const SESSION_COOKIE_OPTIONS: CookieOptions = {
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: "lax",
  path: "/",
  maxAge: 12 * 60 * 60,
};

/** Without Supabase (local dev before setup) the Supabase-backed features hide themselves. */
export function isSupabaseConfigured(): boolean {
  return Boolean(supabaseUrl() && supabasePublishableKey() && secretKey());
}

/** Public reads (public_recommendations view). No cookies, so pages stay static. */
export function createAnonClient() {
  return createClient(supabaseUrl(), supabasePublishableKey(), noSession);
}

/** The visitor's session (admin login, recommendation wizard) in Server Components/Actions/Route Handlers. */
export async function createSessionClient() {
  const cookieStore = await cookies();
  return createServerClient(supabaseUrl(), supabasePublishableKey(), {
    cookieOptions: SESSION_COOKIE_OPTIONS,
    cookies: {
      getAll: () => cookieStore.getAll(),
      setAll: (list) => {
        try {
          for (const { name, value, options } of list) cookieStore.set(name, value, options);
        } catch {
          // Server Components can't write cookies; the proxy, route handlers and actions refresh them.
        }
      },
    },
  });
}

/** Server only: bypasses RLS. Never import this file from a client component. */
export function createServiceClient() {
  return createClient(supabaseUrl(), secretKey(), noSession);
}
