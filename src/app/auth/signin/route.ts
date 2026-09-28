import { NextResponse, type NextRequest } from "next/server";
import { isRecommendationProvider } from "@/lib/recommendations/identity";
import { safeNext } from "@/lib/recommendations/safe-next";
import { createSessionClient, isSupabaseConfigured } from "@/lib/supabase";

/**
 * Started from a plain link (a navigation, not a form), so `form-action 'self'` never blocks the
 * redirect to the provider. Supabase stores the PKCE verifier in a cookie on this response.
 */
export async function GET(request: NextRequest) {
  const { searchParams, origin } = request.nextUrl;
  const provider = searchParams.get("provider") ?? "";
  const next = safeNext(searchParams.get("next"));
  const back = new URL(next, origin);

  if (!isSupabaseConfigured() || !isRecommendationProvider(provider)) return NextResponse.redirect(back);

  const supabase = await createSessionClient();
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider,
    options: { redirectTo: `${origin}/auth/callback?next=${encodeURIComponent(next)}`, skipBrowserRedirect: true },
  });
  if (error || !data.url) {
    back.searchParams.set("aviso", "error");
    return NextResponse.redirect(back);
  }
  return NextResponse.redirect(data.url);
}
