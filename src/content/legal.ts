/** Shown on every legal page; change it (and bump CONSENT_VERSION if purposes changed) on each edit. */
export const LEGAL_UPDATED = "29 de septiembre de 2026";

export const LEGAL_DOCS = [
  { slug: "privacidad", label: "Política de privacidad" },
  { slug: "cookies", label: "Cookies y almacenamiento" },
  { slug: "terminos", label: "Términos de uso" },
] as const;

export type LegalSlug = (typeof LEGAL_DOCS)[number]["slug"];
