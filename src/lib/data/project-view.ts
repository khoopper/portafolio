import { getReadmeHtml } from "@/lib/github-readme";
import { getApprovedRecommendations } from "@/lib/recommendations/queries";
import type { PublicRecommendation } from "@/lib/recommendations/public";
import type { Project, Technology } from "@/lib/types";
import { getProject, getTechnologies } from "./index";

export interface ProjectView {
  project: Project;
  tech: Technology[];
  readme: string | null;
  recommendations: PublicRecommendation[];
}

/** Everything the project window shows; shared by /proyectos/[slug] and /p/[slug]. */
export async function getProjectView(slug: string): Promise<ProjectView | null> {
  const project = await getProject(slug);
  if (!project) return null;
  const [technologies, readme, recommendations] = await Promise.all([
    getTechnologies(),
    getReadmeHtml(project.repoUrl),
    getApprovedRecommendations(slug),
  ]);
  const tech = project.tech.map((s) => technologies.find((t) => t.slug === s)).filter((t): t is Technology => Boolean(t));
  return { project, tech, readme, recommendations };
}
