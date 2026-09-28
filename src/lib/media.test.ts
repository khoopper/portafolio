import { describe, expect, it } from "vitest";
import { isCronAuthorized } from "@/lib/cron-auth";
import { isMediaFolder, mediaKey } from "@/lib/media";

describe("mediaKey", () => {
  const a = new Uint8Array([1, 2, 3]);

  it("is content-addressed: same bytes, same key; different bytes, different key", () => {
    expect(mediaKey("projects", a, "image/webp")).toBe(mediaKey("projects", new Uint8Array([1, 2, 3]), "image/webp"));
    expect(mediaKey("projects", a, "image/webp")).not.toBe(mediaKey("projects", new Uint8Array([1, 2, 4]), "image/webp"));
  });

  it("puts each kind in its folder with the right extension", () => {
    expect(mediaKey("projects", a, "image/webp")).toMatch(/^projects\/[0-9a-f]{16}\.webp$/);
    expect(mediaKey("profile", a, "image/jpeg")).toMatch(/^profile\/[0-9a-f]{16}\.jpg$/);
    expect(mediaKey("profile", a, "image/png")).toMatch(/\.png$/);
  });

  it("only accepts known folders", () => {
    expect(isMediaFolder("projects")).toBe(true);
    expect(isMediaFolder("../etc")).toBe(false);
    expect(isMediaFolder(undefined)).toBe(false);
  });
});

describe("isCronAuthorized", () => {
  it("runs without a secret configured (the job only does a tiny read)", () => {
    expect(isCronAuthorized(null, undefined)).toBe(true);
  });

  it("requires the exact bearer token once a secret is set", () => {
    expect(isCronAuthorized("Bearer s3cret", "s3cret")).toBe(true);
    expect(isCronAuthorized("Bearer wrong", "s3cret")).toBe(false);
    expect(isCronAuthorized(null, "s3cret")).toBe(false);
    expect(isCronAuthorized("s3cret", "s3cret")).toBe(false);
  });
});
