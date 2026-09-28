import type { MetadataRoute } from "next";
import { siteUrl } from "@/lib/site-url";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      // Private areas, auth flows, invitation/share links, APIs and the empty desktop never belong in search results.
      disallow: ["/admin", "/api/", "/auth/", "/r/", "/p/", "/brand/", "/escritorio"],
    },
    sitemap: `${siteUrl()}/sitemap.xml`,
  };
}
