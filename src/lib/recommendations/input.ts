export const LIMITS = {
  role: { min: 2, max: 80 },
  company: { min: 2, max: 80 },
  body: { min: 30, max: 800 },
} as const;

export type RecommendationField = keyof typeof LIMITS;

export interface RecommendationInput {
  role: string;
  company: string;
  body: string;
}

export type ParseResult =
  | { ok: true; value: RecommendationInput }
  | { ok: false; errors: Partial<Record<RecommendationField, string>> };

const NAMES: Record<RecommendationField, string> = { role: "El cargo", company: "La empresa", body: "La recomendación" };

// Control characters (except \n), zero-width characters and bidi overrides.
const INVISIBLE = /[\u0000-\u0009\u000b-\u001f\u007f​-‏‪-‮⁦-⁩]/g;

function clean(raw: unknown, multiline: boolean): string {
  const text = (typeof raw === "string" ? raw : "").normalize("NFC").replace(/\r\n?/g, "\n").replace(INVISIBLE, "");
  return (multiline ? text.replace(/\n{3,}/g, "\n\n") : text.replace(/\s+/g, " ")).trim();
}

export function parseRecommendationInput(fields: Record<string, unknown>): ParseResult {
  const value: RecommendationInput = {
    role: clean(fields.role, false),
    company: clean(fields.company, false),
    body: clean(fields.body, true),
  };
  const errors: Partial<Record<RecommendationField, string>> = {};
  for (const field of Object.keys(LIMITS) as RecommendationField[]) {
    const { min, max } = LIMITS[field];
    const length = [...value[field]].length; // code points, like Postgres char_length
    if (length < min) errors[field] = `${NAMES[field]} debe tener al menos ${min} caracteres.`;
    else if (length > max) errors[field] = `${NAMES[field]} admite hasta ${max} caracteres.`;
  }
  return Object.keys(errors).length ? { ok: false, errors } : { ok: true, value };
}
