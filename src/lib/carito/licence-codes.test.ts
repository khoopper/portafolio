import { createHash } from "node:crypto";
import { describe, expect, it } from "vitest";
import { codeHash, newLicenceCode, newPairingCode } from "./licence-codes";
import { formatLicenceCode, licenceMessage } from "./licence";

describe("carito licence codes", () => {
  it("makes licences of nine characters, with no I, L, O or U", () => {
    for (let i = 0; i < 50; i++) expect(newLicenceCode()).toMatch(/^[0-9A-HJKMNP-TV-Z]{9}$/);
  });

  it("makes pairing codes of eight characters, easy to dictate", () => {
    for (let i = 0; i < 50; i++) expect(newPairingCode()).toMatch(/^[0-9A-HJKMNP-TV-Z]{8}$/);
  });

  it("hashes the code the way carito_sha256 does: uppercase, no spaces or dashes", () => {
    expect(codeHash("abc-123 xyz")).toBe(createHash("sha256").update("ABC123XYZ").digest("hex"));
  });

  it("reads a licence in groups of three", () => {
    expect(formatLicenceCode("abc123xyz")).toBe("ABC-123-XYZ");
    expect(formatLicenceCode("abc")).toBe("ABC");
  });

  it("writes the message the friend receives", () => {
    expect(licenceMessage("Ana", "ABC123XYZ", "17 nov 2026")).toBe(
      "Ana, tu licencia de Carito Music es: ABC-123-XYZ\nHasta el 17 nov 2026. Escríbela en la app, donde dice «Introduce tu licencia»."
    );
    expect(licenceMessage("", "ABC123XYZ", null)).toContain("Sin fecha de vencimiento");
    expect(licenceMessage("Ana", "ABC123XYZ", null, 3)).toContain("Prueba gratis de 3 días, desde el día que la escribas");
  });
});
