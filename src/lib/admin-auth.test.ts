import { afterEach, describe, expect, it, vi } from "vitest";
import { adminEmail, isAdminIdentity } from "./admin-auth";

afterEach(() => vi.unstubAllEnvs());

describe("isAdminIdentity", () => {
  const admin = "yo@khoopper.com";

  it("acepta solo el correo configurado con segundo factor completado", () => {
    expect(isAdminIdentity("Yo@Khoopper.com ", "aal2", admin)).toBe(true);
  });

  it("rechaza la contraseña sola (sin código de 6 dígitos)", () => {
    expect(isAdminIdentity(admin, "aal1", admin)).toBe(false);
    expect(isAdminIdentity(admin, null, admin)).toBe(false);
  });

  it("rechaza cualquier otra cuenta, incluso con segundo factor (p. ej. un cliente con Google)", () => {
    expect(isAdminIdentity("cliente@gmail.com", "aal2", admin)).toBe(false);
    expect(isAdminIdentity(null, "aal2", admin)).toBe(false);
  });

  it("sin ADMIN_EMAIL configurado nadie es admin", () => {
    vi.stubEnv("ADMIN_EMAIL", "");
    expect(adminEmail()).toBeNull();
    expect(isAdminIdentity(admin, "aal2", adminEmail())).toBe(false);
  });
});
