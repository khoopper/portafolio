import { describe, expect, it } from "vitest";
import { imageType } from "./brand";

const bytes = (...parts: (number[] | string)[]) =>
  new Uint8Array(parts.flatMap((p) => (typeof p === "string" ? [...p].map((c) => c.charCodeAt(0)) : p)).concat(Array(16).fill(0)));

describe("imageType", () => {
  it("recognizes PNG, JPEG and WebP by their magic bytes", () => {
    expect(imageType(bytes([0x89], "PNG\r\n"))).toBe("image/png");
    expect(imageType(bytes([0xff, 0xd8, 0xff, 0xe0]))).toBe("image/jpeg");
    expect(imageType(bytes("RIFF", [0, 0, 0, 0], "WEBP"))).toBe("image/webp");
  });

  it("rejects SVG, HTML and empty files", () => {
    expect(imageType(bytes("<svg xmlns"))).toBeNull();
    expect(imageType(bytes("<html>"))).toBeNull();
    expect(imageType(new Uint8Array())).toBeNull();
  });
});
