import { NextResponse, type NextRequest } from "next/server";
import { safeNext } from "@/lib/recommendations/safe-next";
import { createSessionClient } from "@/lib/supabase";

export async function GET(request: NextRequest) {
  const { searchParams, origin } = request.nextUrl;
  const target = new URL(safeNext(searchParams.get("next")), origin);
  const code = searchParams.get("code");

  // No code: the visitor cancelled at the provider (or it returned ?error=…).
  if (!code) {
    target.searchParams.set("aviso", "cancelado");
    return NextResponse.redirect(target);
  }
  const supabase = await createSessionClient();
  const { error } = await supabase.auth.exchangeCodeForSession(code);
  if (error) target.searchParams.set("aviso", "error");
  return NextResponse.redirect(target);
}
