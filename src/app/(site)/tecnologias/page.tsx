import type { Metadata } from "next";
import { IconControlPanel } from "@/components/icons";
import { TechIcon } from "@/components/TechIcon";
import { AeroWindow } from "@/components/win7/AeroWindow";
import { ExplorerLayout } from "@/components/win7/ExplorerLayout";
import { count } from "@/lib/count";
import { getProjects, getTechnologies } from "@/lib/data";
import { TECH_CATEGORIES } from "@/lib/types";

export const metadata: Metadata = { title: "Tecnologías", alternates: { canonical: "/tecnologias" } };

export default async function TecnologiasPage() {
  const [technologies, projects] = await Promise.all([getTechnologies(), getProjects()]);
  const usedIn = (slug: string) => projects.filter((p) => p.tech.includes(slug)).map((p) => p.title);
  const categories = TECH_CATEGORIES.filter((c) => technologies.some((t) => t.category === c.key));

  return (
    <AeroWindow
      title="Tecnologías"
      icon={<IconControlPanel className="size-full" />}
      address={["Panel de control", "Tecnologías"]}
      scroll={false}
      statusBar={count(technologies.length, "elemento", "elementos")}
    >
      <ExplorerLayout
        nav={
          <>
            <p className="navpane-heading">Ver por categoría</p>
            <ul>
              {categories.map((c) => (
                <li key={c.key}>
                  <a href={`#cat-${c.key}`} className="navpane-item">
                    {c.label}
                  </a>
                </li>
              ))}
            </ul>
          </>
        }
      >
        <h2 className="win-h1">Tecnologías que utilizo</h2>
        <p className="mt-1 text-win-muted">Herramientas con las que construyo mis proyectos, agrupadas por categoría.</p>
        {categories.map((c) => (
          <section key={c.key} id={`cat-${c.key}`} aria-labelledby={`h-${c.key}`} className="mt-6 scroll-mt-4">
            <h3 id={`h-${c.key}`} className="cp-group-title">
              {c.label}
            </h3>
            <ul className="mt-3 grid grid-cols-[repeat(auto-fill,minmax(220px,1fr))] gap-2">
              {technologies
                .filter((t) => t.category === c.key)
                .map((t) => {
                  const used = usedIn(t.slug);
                  return (
                    <li key={t.slug} className="cp-item">
                      <span className="cp-icon">
                        <TechIcon slug={t.iconSlug} name={t.name} className="size-7" />
                      </span>
                      <span className="min-w-0">
                        <span className="block font-medium">{t.name}</span>
                        <span className="line-clamp-2 block text-xs text-win-muted">
                          {used.length > 0 ? `Usada en: ${used.join(", ")}` : "Parte de mi caja de herramientas"}
                        </span>
                      </span>
                    </li>
                  );
                })}
            </ul>
          </section>
        ))}
      </ExplorerLayout>
    </AeroWindow>
  );
}
