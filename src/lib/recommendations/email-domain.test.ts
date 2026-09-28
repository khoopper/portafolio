import { describe, expect, it } from "vitest";
import { corporateDomain } from "./email-domain";

describe("corporateDomain", () => {
  it("devuelve el dominio de un correo de empresa en minúsculas", () => {
    expect(corporateDomain("ana@ClinicaSanRafael.com")).toBe("clinicasanrafael.com");
  });

  it.each(["x@gmail.com", "x@hotmail.com", "x@outlook.es", "x@icloud.com", "x@yahoo.com.mx", "x@proton.me"])(
    "oculta proveedores públicos: %s",
    (email) => expect(corporateDomain(email)).toBeNull(),
  );

  it.each(["sin-arroba", "@clinica.com", "a@localhost"])("rechaza correos raros: %s", (email) => expect(corporateDomain(email)).toBeNull());
});
