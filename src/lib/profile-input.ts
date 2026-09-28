import type { Profile } from "@/lib/types";

export type EditableProfile = Pick<Profile, "name" | "headline" | "location" | "shortBio" | "bio">;
export type ProfileParse = { ok: true; value: EditableProfile } | { ok: false; error: string };

// Control characters (except \n), zero-width characters and bidi overrides.
const INVISIBLE = /[\u0000-\u0009\u000b-\u001f\u007f​-‏‪-‮⁦-⁩]/g;
const line = (raw: unknown) => (typeof raw === "string" ? raw.normalize("NFC").replace(INVISIBLE, "").replace(/\s+/g, " ").trim() : "");

/** Bio paragraphs: blank line = new paragraph. */
export function splitParagraphs(raw: unknown): string[] {
  if (typeof raw !== "string") return [];
  return raw
    .normalize("NFC")
    .replace(/\r\n?/g, "\n")
    .replace(INVISIBLE, "")
    .split(/\n{2,}/)
    .map((p) => p.replace(/[ \t]+/g, " ").replace(/\n/g, " ").trim())
    .filter(Boolean);
}

export function parseProfileInput(fields: Record<string, unknown>): ProfileParse {
  const name = line(fields.name);
  const headline = line(fields.headline);
  const location = line(fields.location);
  const shortBio = line(fields.shortBio);
  const bio = splitParagraphs(fields.bio);

  if (name.length < 2 || name.length > 80) return { ok: false, error: "El nombre debe tener entre 2 y 80 caracteres." };
  if (headline.length < 2 || headline.length > 120) return { ok: false, error: "El titular debe tener entre 2 y 120 caracteres." };
  if (location.length < 2 || location.length > 80) return { ok: false, error: "La ubicación debe tener entre 2 y 80 caracteres." };
  if (shortBio.length < 10 || shortBio.length > 400) return { ok: false, error: "El resumen corto debe tener entre 10 y 400 caracteres." };
  if (bio.length === 0 || bio.length > 8 || bio.some((p) => p.length > 1500)) {
    return { ok: false, error: "La biografía necesita entre 1 y 8 párrafos (separados por una línea en blanco) de hasta 1500 caracteres." };
  }
  return { ok: true, value: { name, headline, location, shortBio, bio } };
}
