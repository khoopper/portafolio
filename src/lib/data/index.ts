import { getProfileOverrides, getStoredSettings } from "@/lib/profile-store";
import { getCVSrc } from "@/lib/cv";
import { profile } from "@/content/profile";
import { settings } from "@/content/settings";
import { technologies } from "@/content/technologies";
import { getAllProjects as loadAllProjects } from "./projects-manager";
import type { SearchItem } from "@/lib/search";
import type { Profile, Project, SiteSettings, Technology } from "@/lib/types";

export async function getProfile(): Promise<Profile> {
  const [cvUrl, overrides] = await Promise.all([getCVSrc(), getProfileOverrides()]);
  return {
    ...profile,
    ...overrides,
    cvUrl: cvUrl ?? profile.cvUrl,
    avatar: overrides.avatar ?? profile.avatar,
  };
}

export async function getSettings(): Promise<SiteSettings> {
  return (await getStoredSettings()) ?? settings;
}

export async function getAllProjects(): Promise<Project[]> {
  return await loadAllProjects();
}

export async function getProjects(opts: { featured?: boolean; includeDrafts?: boolean } = {}): Promise<Project[]> {
  const all = await loadAllProjects();
  const list = opts.includeDrafts ? all : all.filter((p) => p.status === "published");
  return opts.featured ? list.filter((p) => p.featured) : list;
}

export async function getProject(slug: string): Promise<Project | null> {
  return (await getProjects()).find((p) => p.slug === slug) ?? null;
}

export async function getTechnologies(): Promise<Technology[]> {
  return technologies;
}

/** Everything the desktop search gadget can find, built from the same data as the pages. */
export async function getSearchIndex(): Promise<SearchItem[]> {
  const [profile, settings, projects, technologies] = await Promise.all([getProfile(), getSettings(), getProjects(), getTechnologies()]);
  const items: SearchItem[] = [
    { kind: "section", label: "Inicio", hint: "Centro de bienvenida", href: "/inicio", keywords: "home principal bienvenida" },
    { kind: "section", label: "Proyectos", hint: "Lo que he construido", href: "/proyectos", keywords: "portafolio trabajos demos apps" },
    { kind: "section", label: "Recomendaciones", hint: "Lo que dicen mis clientes", href: "/recomendaciones", keywords: "recomendaciones testimonios clientes opiniones referencias verificadas" },
    { kind: "section", label: "Tecnologías", hint: "Mi stack de trabajo", href: "/tecnologias", keywords: "stack habilidades skills herramientas lenguajes" },
    { kind: "section", label: "Sobre mí", hint: "Perfil y experiencia", href: "/sobre-mi", keywords: "perfil experiencia educacion estudios biografia certificaciones idiomas" },
    { kind: "section", label: "Contacto", hint: "Hablemos", href: "/contacto", keywords: "correo email telefono mensaje contratar" },
  ];
  if (profile.cvUrl) {
    items.push({ kind: "document", label: "Currículum (CV)", hint: "PDF · Descargar", href: profile.cvUrl, download: true, keywords: "cv curriculo resume hoja de vida pdf descargar" });
  }
  for (const p of projects) {
    const tech = p.tech.map((slug) => technologies.find((t) => t.slug === slug)?.name ?? slug).join(" ");
    items.push({ kind: "project", label: p.title, hint: p.tagline, href: `/proyectos/${p.slug}`, keywords: `proyecto ${tech}` });
  }
  for (const t of technologies) items.push({ kind: "tech", label: t.name, hint: "Tecnología", href: "/tecnologias", keywords: t.slug });
  items.push({ kind: "contact", label: settings.contactEmail, hint: "Enviar correo", href: `mailto:${settings.contactEmail}`, keywords: "correo email" });
  if (settings.whatsappUrl) items.push({ kind: "contact", label: "WhatsApp", hint: "Mensaje directo", href: settings.whatsappUrl, external: true, keywords: "telefono celular mensaje" });
  if (settings.githubUrl) items.push({ kind: "contact", label: "GitHub", hint: "Repositorios", href: settings.githubUrl, external: true, keywords: "codigo repositorios" });
  if (settings.linkedinUrl) items.push({ kind: "contact", label: "LinkedIn", hint: "Perfil profesional", href: settings.linkedinUrl, external: true });
  return items;
}
