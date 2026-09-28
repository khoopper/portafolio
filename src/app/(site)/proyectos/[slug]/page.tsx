import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { IconFolder } from "@/components/icons";
import { JsonLd } from "@/components/JsonLd";
import { ProjectWindowContent } from "@/components/projects/ProjectWindowContent";
import { AeroWindow } from "@/components/win7/AeroWindow";
import { getProfile, getProject, getProjects, getTechnologies } from "@/lib/data";
import { getProjectView } from "@/lib/data/project-view";

interface PageProps {
  params: Promise<{ slug: string }>;
}

export async function generateStaticParams() {
  return (await getProjects()).map((p) => ({ slug: p.slug }));
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const project = await getProject((await params).slug);
  if (!project) return {};
  return {
    title: project.title,
    description: project.tagline,
    alternates: { canonical: `/proyectos/${project.slug}` },
    openGraph: { type: "article", title: project.title, description: project.tagline, images: project.cover ? [project.cover] : undefined },
  };
}

export default async function ProyectoPage({ params }: PageProps) {
  const view = await getProjectView((await params).slug);
  if (!view) notFound();
  const [profile, technologies] = await Promise.all([getProfile(), getTechnologies()]);
  const { project } = view;

  return (
    <>
      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@type": "CreativeWork",
          name: project.title,
          description: project.description.split("\n\n")[0],
          inLanguage: "es",
          dateCreated: String(project.year),
          image: project.cover ?? undefined,
          keywords: project.tech.map((slug) => technologies.find((t) => t.slug === slug)?.name ?? slug).join(", "),
          creator: { "@type": "Person", name: profile.name },
        }}
      />
      <AeroWindow
        title={project.title}
        icon={<IconFolder className="size-full" />}
        address={["Equipo", "Portafolio", "Proyectos", project.title]}
        homeHref="/proyectos"
        statusBar={`${project.role} · ${project.year}`}
      >
        <ProjectWindowContent {...view} />
      </AeroWindow>
    </>
  );
}
