import type { Metadata } from "next";
import Link from "next/link";
import { IconComputer, IconControlPanel, IconFolder, IconMail } from "@/components/icons";
import { ProjectCard } from "@/components/projects/ProjectCard";
import { AeroWindow } from "@/components/win7/AeroWindow";
import { ExplorerLayout } from "@/components/win7/ExplorerLayout";
import { count } from "@/lib/count";
import { getProjects } from "@/lib/data";

export const metadata: Metadata = { title: "Proyectos", alternates: { canonical: "/proyectos" } };

const favorites = [
  { href: "/inicio", label: "Inicio", icon: <IconComputer className="size-4" /> },
  { href: "/tecnologias", label: "Tecnologías", icon: <IconControlPanel className="size-4" /> },
  { href: "/contacto", label: "Contacto", icon: <IconMail className="size-4" /> },
];

export default async function ProyectosPage() {
  const projects = await getProjects();

  return (
    <AeroWindow
      title="Proyectos"
      icon={<IconFolder className="size-full" />}
      address={["Equipo", "Portafolio", "Proyectos"]}
      scroll={false}
      statusBar={count(projects.length, "elemento", "elementos")}
    >
      <ExplorerLayout
        nav={
          <>
            <p className="navpane-heading">Favoritos</p>
            <ul>
              {favorites.map((f) => (
                <li key={f.href}>
                  <Link href={f.href} className="navpane-item">
                    {f.icon}
                    {f.label}
                  </Link>
                </li>
              ))}
            </ul>
            <p className="navpane-heading mt-4">Proyectos</p>
            <ul>
              {projects.map((p) => (
                <li key={p.slug}>
                  <Link href={`/proyectos/${p.slug}`} className="navpane-item">
                    <IconFolder className="size-4 shrink-0" />
                    <span className="truncate">{p.title}</span>
                  </Link>
                </li>
              ))}
            </ul>
          </>
        }
      >
        <h2 className="win-h1">Mis proyectos</h2>
        <p className="mt-1 text-win-muted">Cada carpeta es un proyecto real. Ábrela para ver su README, tecnologías, capturas y demo.</p>
        <ul className="mt-5 grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-3">
          {projects.map((p) => (
            <li key={p.slug}>
              <ProjectCard project={p} />
            </li>
          ))}
        </ul>
      </ExplorerLayout>
    </AeroWindow>
  );
}
