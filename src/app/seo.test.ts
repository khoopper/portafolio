import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import robots from "@/app/robots";
import sitemap from "@/app/sitemap";
import { JsonLd } from "@/components/JsonLd";
import { projects } from "@/content/projects";

describe("robots", () => {
  it("allows the site, blocks private areas and points to the sitemap", () => {
    const r = robots();
    const rules = Array.isArray(r.rules) ? r.rules[0] : r.rules;
    expect(rules.allow).toBe("/");
    for (const path of ["/admin", "/api/", "/r/", "/p/", "/escritorio"]) expect(rules.disallow).toContain(path);
    expect(String(r.sitemap)).toMatch(/\/sitemap\.xml$/);
  });
});

describe("sitemap", () => {
  it("lists the public pages and every published project once, never private areas", async () => {
    const urls = (await sitemap()).map((e) => e.url);
    expect(new Set(urls).size).toBe(urls.length);
    for (const p of projects.filter((x) => x.status === "published")) expect(urls.some((u) => u.endsWith(`/proyectos/${p.slug}`))).toBe(true);
    expect(urls.some((u) => u.endsWith("/inicio"))).toBe(true);
    expect(urls.some((u) => /\/(admin|api|r|p|escritorio)(\/|$)/.test(new URL(u).pathname))).toBe(false);
  });
});

describe("JsonLd", () => {
  it("cannot be broken out of the script tag", () => {
    const html = renderToStaticMarkup(createElement(JsonLd, { data: { name: "</script><b>x" } }));
    expect(html).not.toContain("</script><b>");
    expect(html).toContain("\u003c/script>");
  });
});
