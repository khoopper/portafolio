import { afterEach, describe, expect, it, vi } from "vitest";
import { siteUrl } from "./site-url";

afterEach(() => vi.unstubAllEnvs());

describe("siteUrl", () => {
  it.each([
    ["https://www.khoopper.com", "https://www.khoopper.com"],
    ["www.khoopper.com", "https://www.khoopper.com"],
    ["https://www.khoopper.com/", "https://www.khoopper.com"],
    ["  http://localhost:3000  ", "http://localhost:3000"],
  ])("SITE_URL=%s → %s", (value, expected) => {
    vi.stubEnv("SITE_URL", value);
    expect(siteUrl()).toBe(expected);
  });

  it("si SITE_URL es inválida o falta, usa el dominio de producción de Vercel", () => {
    vi.stubEnv("SITE_URL", "::no es una url::");
    vi.stubEnv("NEXT_PUBLIC_SITE_URL", "");
    vi.stubEnv("VERCEL_PROJECT_PRODUCTION_URL", "www.khoopper.com");
    expect(siteUrl()).toBe("https://www.khoopper.com");
  });

  it("nunca lanza error", () => {
    vi.stubEnv("SITE_URL", "");
    vi.stubEnv("NEXT_PUBLIC_SITE_URL", "");
    vi.stubEnv("VERCEL_PROJECT_PRODUCTION_URL", "");
    expect(siteUrl()).toBe("http://localhost:3000");
  });
});
