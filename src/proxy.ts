import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { adminEmail, isAdminIdentity } from "@/lib/admin-auth";
import { SESSION_COOKIE_OPTIONS, supabasePublishableKey, supabaseUrl, isSupabaseConfigured } from "@/lib/supabase";

/**
 * Refreshes the Supabase session cookies (Server Components cannot) and gates /admin.
 * Every admin page layout and Server Action re-checks too: this is the first of three doors.
 */
export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const isLogin = pathname === "/admin/login";
  let response = NextResponse.next({ request });

  if (!isSupabaseConfigured()) {
    // Nothing can authenticate: keep /admin closed, show the login (which explains the setup).
    return pathname.startsWith("/admin") && !isLogin ? NextResponse.redirect(new URL("/admin/login", request.url)) : response;
  }

  const supabase = createServerClient(supabaseUrl(), supabasePublishableKey(), {
    cookieOptions: SESSION_COOKIE_OPTIONS,
    cookies: {
      getAll: () => request.cookies.getAll(),
      setAll: (list) => {
        for (const { name, value } of list) request.cookies.set(name, value);
        response = NextResponse.next({ request });
        for (const { name, value, options } of list) response.cookies.set(name, value, options);
      },
    },
  });

  // getUser() validates the token with Supabase Auth and refreshes it when needed.
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!pathname.startsWith("/admin")) return response;

  const { data: aal } = await supabase.auth.mfa.getAuthenticatorAssuranceLevel();
  const isAdmin = Boolean(user) && isAdminIdentity(user?.email, aal?.currentLevel, adminEmail());

  const redirect = (to: string) => {
    const target = NextResponse.redirect(new URL(to, request.url));
    for (const cookie of response.cookies.getAll()) target.cookies.set(cookie);
    return target;
  };

  if (isLogin) return isAdmin ? redirect("/admin") : response;
  if (!isAdmin) return redirect(`/admin/login?from=${encodeURIComponent(pathname)}`);
  return response;
}

export const config = {
  // Admin plus the recommendation wizard, whose OAuth session also needs refreshing.
  matcher: ["/admin/:path*", "/r/:path*"],
};
