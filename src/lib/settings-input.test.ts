import { describe, expect, it } from "vitest";
import { parseProfileInput, splitParagraphs } from "@/lib/profile-input";
import { sanitizeProfileOverrides } from "@/lib/profile-store";
import { parseSettingsInput } from "@/lib/settings-input";

const valid = {
  availableForWork: "on",
  contactEmail: "yo@correo.com",
  phone: "+503 7000-0000",
  whatsappUrl: "https://wa.me/50370000000",
  githubUrl: "https://github.com/yo",
  linkedinUrl: "",
  seoTitle: "Mi portafolio",
  seoDescription: "Portafolio de un desarrollador Full Stack de El Salvador.",
  gaMeasurementId: "g-abc123def4",
  googleSiteVerification: "abcDEF123_-abcDEF123_-abcDEF",
};

describe("parseSettingsInput", () => {
  it("accepts a good form and normalizes it", () => {
    const r = parseSettingsInput(valid);
    expect(r.ok).toBe(true);
    if (r.ok) {
      expect(r.value.availableForWork).toBe(true);
      expect(r.value.linkedinUrl).toBeNull();
      expect(r.value.gaMeasurementId).toBe("G-ABC123DEF4");
    }
  });

  it("treats an unchecked box and empty optionals as off/null", () => {
    const r = parseSettingsInput({ ...valid, availableForWork: undefined, phone: "", gaMeasurementId: "", googleSiteVerification: "" });
    expect(r.ok && [r.value.availableForWork, r.value.phone, r.value.gaMeasurementId, r.value.googleSiteVerification]).toEqual([false, null, null, null]);
  });

  it("rejects bad email, non-https links, javascript: links, bad GA id and short SEO fields", () => {
    for (const bad of [
      { contactEmail: "nope" },
      { githubUrl: "http://github.com/yo" },
      { linkedinUrl: "javascript:alert(1)" },
      { whatsappUrl: "https://user:pw@wa.me/1" },
      { gaMeasurementId: "UA-123" },
      { googleSiteVerification: "<script>" },
      { seoTitle: "ab" },
      { seoDescription: "corta" },
      { phone: "llámame" },
    ]) {
      expect(parseSettingsInput({ ...valid, ...bad }).ok, JSON.stringify(bad)).toBe(false);
    }
  });
});

describe("parseProfileInput", () => {
  const base = { name: "Ana Pérez", headline: "Ingeniera", location: "El Salvador", shortBio: "Una descripción corta válida.", bio: "Uno.\n\nDos." };

  it("splits the bio into paragraphs", () => {
    const r = parseProfileInput(base);
    expect(r.ok && r.value.bio).toEqual(["Uno.", "Dos."]);
    expect(splitParagraphs("a\r\n\r\n\r\nb\nc")).toEqual(["a", "b c"]);
  });

  it("enforces limits", () => {
    expect(parseProfileInput({ ...base, name: "A" }).ok).toBe(false);
    expect(parseProfileInput({ ...base, bio: "" }).ok).toBe(false);
    expect(parseProfileInput({ ...base, bio: Array(9).fill("x").join("\n\n") }).ok).toBe(false);
  });
});

describe("sanitizeProfileOverrides", () => {
  it("keeps only valid pieces of a stored file", () => {
    expect(sanitizeProfileOverrides({ avatar: "https://x.co/a.webp" })).toEqual({ avatar: "https://x.co/a.webp" });
    expect(sanitizeProfileOverrides({ avatar: "javascript:1", name: 5 })).toEqual({});
    expect(sanitizeProfileOverrides(null)).toEqual({});
    const full = sanitizeProfileOverrides({ name: "Ana Pérez", headline: "Ingeniera", location: "SV", shortBio: "Una descripción corta válida.", bio: ["Uno."] });
    expect(full.bio).toEqual(["Uno."]);
  });
});
