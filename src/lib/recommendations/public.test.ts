import { describe, expect, it } from "vitest";
import { toPublicRecommendation, type PublicRecommendationRow } from "./public";

const row = {
  id: "r1",
  project_slug: "clinica",
  provider: "google",
  name: "Ana",
  avatar_path: "r1.jpeg",
  email_domain: "clinica.com",
  role: "Directora",
  company: "Clínica",
  body: "Texto",
  created_at: "2026-09-28T10:00:00Z",
  // Private columns that must never leak even if a query selects them.
  email: "ana@clinica.com",
  provider_sub: "sub-secreto",
  status: "approved",
} as unknown as PublicRecommendationRow;

describe("toPublicRecommendation", () => {
  it("nunca expone el correo ni el identificador de la cuenta", () => {
    const pub = toPublicRecommendation(row, "https://abc.supabase.co/");
    expect(Object.keys(pub).sort()).toEqual(
      ["avatarUrl", "body", "company", "createdAt", "emailDomain", "id", "name", "projectSlug", "provider", "role"],
    );
    expect(JSON.stringify(pub)).not.toContain("ana@clinica.com");
    expect(JSON.stringify(pub)).not.toContain("sub-secreto");
  });

  it("arma la URL pública de la foto", () => {
    expect(toPublicRecommendation(row, "https://abc.supabase.co/").avatarUrl).toBe(
      "https://abc.supabase.co/storage/v1/object/public/recommendation-avatars/r1.jpeg",
    );
    expect(toPublicRecommendation({ ...row, avatar_path: null }, "https://abc.supabase.co").avatarUrl).toBeNull();
  });
});
