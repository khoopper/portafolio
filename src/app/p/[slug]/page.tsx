import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { IconFolder } from "@/components/icons";
import { ProjectWindowContent } from "@/components/projects/ProjectWindowContent";
import { AeroWindow } from "@/components/win7/AeroWindow";
import { ShareTaskbar } from "@/components/win7/ShareTaskbar";
import { getProject, getProjects } from "@/lib/data";
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
    // A client-facing link: kept out of search results so it never competes with the portfolio.
    robots: { index: false, follow: false },
    openGraph: { title: project.title, description: project.tagline, images: project.cover ? [project.cover] : undefined },
  };
}

export default async function SharedProjectPage({ params }: PageProps) {
  const view = await getProjectView((await params).slug);
  if (!view) notFound();
  const { project } = view;

  return (
    <>
      <ShareTaskbar title={project.title} href={`/p/${project.slug}`} />
      {/* No address bar → no Back button: this view has nowhere to go back to. */}
      <AeroWindow title={project.title} icon={<IconFolder className="size-full" />} statusBar={`${project.role} · ${project.year}`}>
        <ProjectWindowContent {...view} />
      </AeroWindow>
    </>
  );
}
