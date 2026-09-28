import { describe, expect, it } from "vitest";
import { isPdf } from "./cv";

describe("isPdf", () => {
  it("recognizes a valid PDF by %PDF- magic bytes", () => {
    const valid = new TextEncoder().encode("%PDF-1.7\n1 0 obj\n<<>>\nendobj");
    expect(isPdf(valid)).toBe(true);
  });

  it("rejects non-PDF files", () => {
    expect(isPdf(new TextEncoder().encode("<html><body>No PDF</body></html>"))).toBe(false);
    expect(isPdf(new TextEncoder().encode("PK\x03\x04zipfile"))).toBe(false);
    expect(isPdf(new Uint8Array())).toBe(false);
    expect(isPdf(new Uint8Array([0x25, 0x50]))).toBe(false);
  });
});
