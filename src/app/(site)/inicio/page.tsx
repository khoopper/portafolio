import type { Metadata } from "next";
import Link from "next/link";
import { Avatar } from "@/components/Avatar";
import { IconComputer } from "@/components/icons";
import { JsonLd } from "@/components/JsonLd";
import { ProjectCard } from "@/components/projects/ProjectCard";
import { TechIcon } from "@/components/TechIcon";
import { AeroWindow } from "@/components/win7/AeroWindow";
import { count } from "@/lib/count";
import { getProfile, getProjects, getSettings, getTechnologies } from "@/lib/data";
import { siteUrl } from "@/lib/site-url";

// The home is what Google shows for the brand name: use the full SEO title, not "Inicio · name".
export async function generateMetadata(): Promise<Metadata> {
  const settings = await getSettings();
  return { title: { absolute: settings.seoTitle }, alternates: { canonical: "/inicio" } };
}

export default async function InicioPage() {
  const [profile, settings, featured, projects, technologies] = await Promise.all([
    getProfile(),
    getSettings(),
    getProjects({ featured: true }),
    getProjects(),
    getTechnologies(),
  ]);
  const mainTech = technologies.filter((t) => t.iconSlug).slice(0, 8);
  const firstName = profile.name.split(" ")[0];

  const base = siteUrl();
  const person = `${base}/#persona`;

  return (
    <>
      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@graph": [
            {
              "@type": "Person",
              "@id": person,
              name: profile.name,
              jobTitle: profile.headline,
              description: profile.shortBio,
              url: `${base}/inicio`,
              image: profile.avatar ? new URL(profile.avatar, base).toString() : undefined,
              address: { "@type": "PostalAddress", addressCountry: profile.location },
              alumniOf: profile.education.map((e) => ({ "@type": "CollegeOrUniversity", name: e.institution })),
              knowsAbout: technologies.map((t) => t.name),
              sameAs: [settings.githubUrl, settings.linkedinUrl].filter(Boolean),
            },
            { "@type": "WebSite", "@id": `${base}/#sitio`, url: base, name: settings.seoTitle, inLanguage: "es", publisher: { "@id": person } },
          ],
        }}
      />
      <AeroWindow
        title={`${profile.name} · Portafolio`}
        icon={<IconComputer className="size-full" />}
        address={["Equipo", "Centro de bienvenida"]}
        statusBar={`${count(projects.length, "proyecto", "proyectos")} · ${count(technologies.length, "tecnología", "tecnologías")}`}
      >
        <div className="welcome-hero">
          <Avatar src={profile.avatar} name={profile.name} size={112} priority />
          <div className="min-w-[16rem] flex-1">
            <h2 className="text-[28px] leading-tight text-win-heading">Hola, soy {firstName}</h2>
            <p className="text-lg">{profile.headline}</p>
            <p className="mt-3 max-w-prose text-win-muted">{profile.shortBio}</p>
            <div className="mt-4 flex flex-wrap gap-2">
              <Link href="/proyectos" className="win-button win-button--primary">
                Ver proyectos
              </Link>
              {profile.cvUrl && (
                <a href={profile.cvUrl} download className="win-button">
                  Descargar CV
                </a>
              )}
              <Link href="/contacto" className="win-button">
                Contacto
              </Link>
            </div>
          </div>
        </div>

        <section aria-labelledby="destacados" className="px-6 py-5">
          <div className="flex items-baseline justify-between gap-4">
            <h2 id="destacados" className="win-h2">
              Proyectos destacados
            </h2>
            <Link href="/proyectos" className="win-link text-sm">
              Ver todos
            </Link>
          </div>
          <ul className="mt-3 grid grid-cols-2 gap-3 lg:grid-cols-4">
            {featured.map((p) => (
              <li key={p.slug}>
                <ProjectCard project={p} />
              </li>
            ))}
          </ul>
        </section>

        <section aria-labelledby="stack" className="px-6 pb-6">
          <div className="flex items-baseline justify-between gap-4">
            <h2 id="stack" className="win-h2">
              Tecnologías principales
            </h2>
            <Link href="/tecnologias" className="win-link text-sm">
              Ver todas
            </Link>
          </div>
          <ul className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-4">
            {mainTech.map((t) => (
              <li key={t.slug}>
                <Link href="/tecnologias" className="tech-tile">
                  <TechIcon slug={t.iconSlug} name={t.name} className="size-6 shrink-0" />
                  <span className="truncate">{t.name}</span>
                </Link>
              </li>
            ))}
          </ul>
        </section>
      </AeroWindow>
    </>
  );
}
