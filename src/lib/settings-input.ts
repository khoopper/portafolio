import type { SiteSettings } from "@/lib/types";

export type SettingsParse = { ok: true; value: SiteSettings } | { ok: false; error: string };

const EMAIL = /^[^\s@]{1,64}@[^\s@]{1,190}\.[^\s@]{2,}$/;
const PHONE = /^\+?[\d\s()-]{5,30}$/;
const GA_ID = /^G-[A-Z0-9]{6,14}$/;
const VERIFICATION = /^[\w-]{20,100}$/;

const text = (raw: unknown): string => (typeof raw === "string" ? raw.normalize("NFC").replace(/[\u0000-\u001f\u007f]/g, " ").replace(/\s+/g, " ").trim() : "");
const bool = (raw: unknown): boolean => raw === true || raw === "on" || raw === "true";

function httpsUrl(raw: unknown, max = 300): string | null | undefined {
  const value = text(raw);
  if (!value) return null;
  try {
    const url = new URL(value);
    return url.protocol === "https:" && !url.username && !url.password && value.length <= max ? url.toString() : undefined;
  } catch {
    return undefined;
  }
}

/** Validates the settings form (or the stored JSON). Every field is checked: the admin form is a public POST endpoint. */
export function parseSettingsInput(fields: Record<string, unknown>): SettingsParse {
  const contactEmail = text(fields.contactEmail);
  if (!EMAIL.test(contactEmail)) return { ok: false, error: "El correo de contacto no es válido." };

  const phone = text(fields.phone);
  if (phone && !PHONE.test(phone)) return { ok: false, error: "El teléfono solo admite números, espacios, paréntesis, guiones y un + inicial." };

  const whatsappUrl = httpsUrl(fields.whatsappUrl);
  const githubUrl = httpsUrl(fields.githubUrl);
  const linkedinUrl = httpsUrl(fields.linkedinUrl);
  if (whatsappUrl === undefined || githubUrl === undefined || linkedinUrl === undefined) return { ok: false, error: "Los enlaces deben ser direcciones https:// válidas." };

  const seoTitle = text(fields.seoTitle);
  if (seoTitle.length < 3 || seoTitle.length > 70) return { ok: false, error: "El título SEO debe tener entre 3 y 70 caracteres." };
  const seoDescription = text(fields.seoDescription);
  if (seoDescription.length < 20 || seoDescription.length > 200) return { ok: false, error: "La descripción SEO debe tener entre 20 y 200 caracteres." };

  const ga = text(fields.gaMeasurementId).toUpperCase();
  if (ga && !GA_ID.test(ga)) return { ok: false, error: "El ID de Google Analytics debe verse así: G-XXXXXXXXXX." };
  const verification = text(fields.googleSiteVerification);
  if (verification && !VERIFICATION.test(verification)) return { ok: false, error: "El código de verificación de Google no es válido (solo letras, números, guiones)." };

  return {
    ok: true,
    value: {
      availableForWork: bool(fields.availableForWork),
      contactEmail,
      phone: phone || null,
      whatsappUrl,
      githubUrl,
      linkedinUrl,
      seoTitle,
      seoDescription,
      gaMeasurementId: ga || null,
      googleSiteVerification: verification || null,
    },
  };
}
