import type { MetadataRoute } from "next";
import { getProjects } from "@/lib/data";
import { siteUrl } from "@/lib/site-url";

/** Every public page. Project pages come from the same list the site shows, so a hidden project never leaks here. */
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base = siteUrl();
  const now = new Date();
  const projects = await getProjects();
  const page = (path: string, priority: number, changeFrequency: "weekly" | "monthly" | "yearly"): MetadataRoute.Sitemap[number] => ({
    url: `${base}${path}`,
    lastModified: now,
    changeFrequency,
    priority,
  });

  return [
    page("/inicio", 1, "weekly"),
    page("/proyectos", 0.9, "weekly"),
    ...projects.map((p) => page(`/proyectos/${p.slug}`, 0.8, "monthly")),
    page("/sobre-mi", 0.7, "monthly"),
    page("/tecnologias", 0.6, "monthly"),
    page("/recomendaciones", 0.6, "weekly"),
    page("/contacto", 0.6, "yearly"),
    page("/legal/privacidad", 0.2, "yearly"),
    page("/legal/cookies", 0.2, "yearly"),
    page("/legal/terminos", 0.2, "yearly"),
  ];
}
