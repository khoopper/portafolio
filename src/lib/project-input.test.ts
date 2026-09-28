import { describe, expect, it } from "vitest";
import { isSafeHttpsUrl, parseProjectForm } from "./project-input";

const base = { title: "Mi Proyecto Ñandú", tagline: "Algo", description: "Texto", year: "2026", status: "published" };

describe("parseProjectForm", () => {
  it("normaliza y genera el slug desde el título", () => {
    const r = parseProjectForm({ ...base, tech: "react, Next.js", highlights: "uno\ndos", images: "/images/projects/a.png\nhttps://cdn.example.com/b.png" }, 2026);
    expect(r.ok).toBe(true);
    if (r.ok) {
      expect(r.value.slug).toBe("mi-proyecto-nandu");
      expect(r.value.tech).toEqual(["react", "next.js"]);
      expect(r.value.highlights).toEqual(["uno", "dos"]);
      expect(r.value.cover).toBe("/images/projects/a.png");
    }
  });

  it.each([
    ["javascript:alert(1)", "demoUrl"],
    ["http://inseguro.com", "repoUrl"],
    ["https://user:pass@evil.com", "demoUrl"],
    ["data:text/html,hola", "cover"],
    ["/images/../../etc/passwd", "cover"],
  ])("rechaza el enlace %s en %s", (value, field) => {
    expect(parseProjectForm({ ...base, [field]: value }).ok).toBe(false);
  });

  it("rechaza slugs con caracteres raros y textos demasiado largos", () => {
    expect(parseProjectForm({ ...base, slug: "../hack" }).ok).toBe(false);
    expect(parseProjectForm({ ...base, title: "x".repeat(121) }).ok).toBe(false);
    expect(parseProjectForm({ ...base, tech: "<script>" }).ok).toBe(false);
  });

  it("ignora tipos inesperados e images JSON que no son listas de texto", () => {
    const r = parseProjectForm({ ...base, images: '[1, {"a":1}, "/images/x.png"]', year: "1800" }, 2026);
    expect(r.ok && r.value.images).toEqual(["/images/x.png"]);
    expect(r.ok && r.value.year).toBe(2026);
  });

  it("isSafeHttpsUrl solo acepta https sin credenciales", () => {
    expect(isSafeHttpsUrl("https://github.com/a/b")).toBe(true);
    expect(isSafeHttpsUrl("ftp://x.com")).toBe(false);
  });
});
