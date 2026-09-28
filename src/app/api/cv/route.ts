import type { NextRequest } from "next/server";
import { cvVersion, getCV } from "@/lib/cv";

/**
 * Serves the active CV PDF.
 * If ?v=<hash> matches, it is cached immutably; otherwise it's revalidated.
 */
export async function GET(request: NextRequest) {
  const data = await getCV();
  if (!data) {
    return new Response("Currículum no disponible.", { status: 404 });
  }

  const versioned = request.nextUrl.searchParams.get("v") === cvVersion(data);
  return new Response(new Uint8Array(data), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": 'inline; filename="Brandon-Ramirez-CV.pdf"',
      "Cache-Control": versioned ? "public, max-age=31536000, immutable" : "no-cache",
      "X-Content-Type-Options": "nosniff",
    },
  });
}
