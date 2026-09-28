import type { User } from "@supabase/supabase-js";
import { describe, expect, it } from "vitest";
import { readVerifiedIdentity } from "./identity";

const user = (identities: unknown[]) => ({ id: "u1", email: "ana@clinica.com", identities }) as unknown as User;

const linkedin = {
  id: "li-1",
  provider: "linkedin_oidc",
  last_sign_in_at: "2026-09-28T10:00:00Z",
  identity_data: { sub: "li-1", name: "Ana López", email: "ana@clinica.com", email_verified: true, picture: "https://media.licdn.com/dms/image/abc" },
};
const google = {
  id: "g-1",
  provider: "google",
  last_sign_in_at: "2026-09-28T11:00:00Z",
  identity_data: { sub: "g-1", full_name: "Ana L.", email: "ana@gmail.com", email_verified: true, avatar_url: "https://lh3.googleusercontent.com/a/x" },
};

describe("readVerifiedIdentity", () => {
  it("lee la identidad verificada de LinkedIn", () => {
    expect(readVerifiedIdentity(user([linkedin]))).toEqual({
      provider: "linkedin_oidc",
      sub: "li-1",
      name: "Ana López",
      email: "ana@clinica.com",
      pictureUrl: "https://media.licdn.com/dms/image/abc",
    });
  });

  it("usa full_name y avatar_url de Google", () => {
    expect(readVerifiedIdentity(user([google]))).toMatchObject({ provider: "google", name: "Ana L.", pictureUrl: "https://lh3.googleusercontent.com/a/x" });
  });

  it("elige la identidad con el inicio de sesión más reciente", () => {
    expect(readVerifiedIdentity(user([linkedin, google]))?.provider).toBe("google");
  });

  it("rechaza correos sin verificar", () => {
    expect(readVerifiedIdentity(user([{ ...linkedin, identity_data: { ...linkedin.identity_data, email_verified: false } }]))).toBeNull();
  });

  it("ignora proveedores no permitidos", () => {
    expect(readVerifiedIdentity(user([{ ...linkedin, provider: "github" }]))).toBeNull();
  });

  it("descarta fotos que no son https", () => {
    const http = { ...linkedin, identity_data: { ...linkedin.identity_data, picture: "http://media.licdn.com/x" } };
    expect(readVerifiedIdentity(user([http]))?.pictureUrl).toBeNull();
  });
});
