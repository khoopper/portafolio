import { describe, expect, it } from "vitest";
import { searchPortfolio, type SearchItem } from "./search";

const items: SearchItem[] = [
  { kind: "section", label: "Proyectos", href: "/proyectos", keywords: "portafolio trabajos" },
  { kind: "document", label: "Currículum (CV)", href: "/cv.pdf", keywords: "hoja de vida descargar", download: true },
  { kind: "project", label: "SaaS Gestión Clínica", href: "/proyectos/saas", keywords: "Next.js Supabase" },
  { kind: "tech", label: "Next.js", href: "/tecnologias" },
];

const labels = (q: string) => searchPortfolio(items, q).map((i) => i.label);

describe("searchPortfolio", () => {
  it("finds by label prefix, ignoring case and accents", () => {
    expect(labels("cv")).toEqual(["Currículum (CV)"]);
    expect(labels("curric")).toEqual(["Currículum (CV)"]);
    expect(labels("gestion clin")).toEqual(["SaaS Gestión Clínica"]);
  });

  it("finds by keywords, ranking label matches first", () => {
    expect(labels("hoja vida")).toEqual(["Currículum (CV)"]);
    expect(labels("next")).toEqual(["Next.js", "SaaS Gestión Clínica"]);
    expect(labels("proyectos")).toEqual(["Proyectos"]);
  });

  it("returns nothing for empty or unmatched queries", () => {
    expect(labels("   ")).toEqual([]);
    expect(labels("zzz")).toEqual([]);
  });
});
