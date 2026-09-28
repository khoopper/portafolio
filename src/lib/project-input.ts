import type { Project } from "@/lib/types";

export type ProjectInput = Omit<Project, "videoUrl">;
export type ProjectParseResult = { ok: true; value: ProjectInput } | { ok: false; error: string };

const SLUG = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
const TECH = /^[a-z0-9][a-z0-9.+-]{0,39}$/;
const MAX = { title: 120, slug: 80, tagline: 200, description: 5000, role: 80, url: 500, list: 30, item: 300 } as const;

// Control characters (keeps \n for multi-line fields) and bidi/zero-width tricks.
const INVISIBLE = /[\u0000-\u0009\u000b-\u001f\u007f​-‏‪-‮⁦-⁩]/g;
const text = (raw: unknown) => (typeof raw === "string" ? raw.normalize("NFC").replace(/\r\n?/g, "\n").replace(INVISIBLE, "").trim() : "");
const line = (raw: unknown) => text(raw).replace(/\s+/g, " ");

export const slugify = (value: string) =>
  value.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "").slice(0, MAX.slug);

/** https URL only (no javascript:, data:, http:, credentials in the URL). */
export function isSafeHttpsUrl(value: string): boolean {
  if (value.length > MAX.url) return false;
  try {
    const url = new URL(value);
    return url.protocol === "https:" && !url.username && !url.password;
  } catch {
    return false;
  }
}

/** Images may also be files shipped in /public/images. */
const isSafeImage = (value: string) => isSafeHttpsUrl(value) || (/^\/images\/[\w./-]+$/.test(value) && !value.includes(".."));

function list(raw: unknown, separator: RegExp): string[] {
  const value = text(raw);
  if (value.startsWith("[")) {
    try {
      const parsed: unknown = JSON.parse(value);
      if (Array.isArray(parsed)) return parsed.filter((x): x is string => typeof x === "string").map((x) => line(x)).filter(Boolean);
    } catch {
      // Not JSON: fall back to the separator.
    }
  }
  return value.split(separator).map((x) => line(x)).filter(Boolean);
}

/** Whitelists and validates every field of the admin project form; unknown fields are ignored. */
export function parseProjectForm(fields: Record<string, unknown>, currentYear = new Date().getFullYear()): ProjectParseResult {
  const title = line(fields.title);
  if (!title || title.length > MAX.title) return { ok: false, error: `El título es obligatorio y admite hasta ${MAX.title} caracteres.` };

  const slug = line(fields.slug).toLowerCase() || slugify(title);
  if (!SLUG.test(slug) || slug.length > MAX.slug) return { ok: false, error: "El identificador solo admite minúsculas, números y guiones (ej. mi-proyecto)." };

  const tagline = line(fields.tagline);
  const description = text(fields.description);
  const role = line(fields.role) || "Desarrollador Full Stack";
  if (tagline.length > MAX.tagline || description.length > MAX.description || role.length > MAX.role) {
    return { ok: false, error: "Algún texto supera el largo permitido." };
  }

  const urlOrNull = (raw: unknown) => line(raw) || null;
  const demoUrl = urlOrNull(fields.demoUrl);
  const repoUrl = urlOrNull(fields.repoUrl);
  if ((demoUrl && !isSafeHttpsUrl(demoUrl)) || (repoUrl && !isSafeHttpsUrl(repoUrl))) {
    return { ok: false, error: "Los enlaces deben ser direcciones https:// válidas." };
  }

  const images = list(fields.images, /\n/);
  const coverRaw = urlOrNull(fields.cover);
  if (images.length > MAX.list || [...images, ...(coverRaw ? [coverRaw] : [])].some((x) => !isSafeImage(x))) {
    return { ok: false, error: "Las imágenes deben ser https:// o rutas /images/… (máximo 30)." };
  }

  const highlights = list(fields.highlights, /\n|,/);
  const tech = list(fields.tech, /[\n,\s]+/).map((x) => x.toLowerCase());
  if (highlights.length > MAX.list || highlights.some((h) => h.length > MAX.item) || tech.length > MAX.list || tech.some((t) => !TECH.test(t))) {
    return { ok: false, error: "Revisa las características y tecnologías (máximo 30, sin símbolos raros)." };
  }

  const yearNumber = Number.parseInt(line(fields.year), 10);
  const year = yearNumber >= 2000 && yearNumber <= currentYear + 1 ? yearNumber : currentYear;

  return {
    ok: true,
    value: {
      slug,
      title,
      tagline,
      description,
      role,
      year,
      status: fields.status === "draft" ? "draft" : "published",
      featured: fields.featured === "on" || fields.featured === "true",
      demoUrl,
      repoUrl,
      cover: coverRaw ?? images[0] ?? null,
      images,
      highlights,
      tech,
    },
  };
}
