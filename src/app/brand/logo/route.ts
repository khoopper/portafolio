import type { NextRequest } from "next/server";
import { getLogo, imageType, logoVersion } from "@/lib/brand";

/**
 * Serves the admin-managed logo (desktop shortcut icon). Versioned URLs (?v=<content hash>) are
 * immutable, so reloads paint it from the browser cache instantly (no flicker); a new upload changes
 * the hash, and therefore the URL.
 */
export async function GET(request: NextRequest) {
  const data = await getLogo();
  const versioned = request.nextUrl.searchParams.get("v") === logoVersion(data);
  return new Response(new Uint8Array(data), {
    headers: {
      "Content-Type": imageType(data) ?? "application/octet-stream",
      "Cache-Control": versioned ? "public, max-age=31536000, immutable" : "no-cache",
      "X-Content-Type-Options": "nosniff",
    },
  });
}
