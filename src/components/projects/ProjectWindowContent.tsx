import { RecommendationCard } from "@/components/recommendations/RecommendationCard";
import { TechIcon } from "@/components/TechIcon";
import type { ProjectView } from "@/lib/data/project-view";
import { ProjectMedia } from "./ProjectMedia";

/** Order sells first: header → recommendations → screenshots → key features → README. */
export function ProjectWindowContent({ project, tech, readme, recommendations }: ProjectView) {
  const images = project.images?.length ? project.images : project.cover ? [project.cover] : [];

  const heading = (
    <>
      <div>
        <h2 className="win-h1">{project.title}</h2>
        <p className="mt-1 text-win-muted">{project.tagline}</p>
      </div>
      {tech.length > 0 && (
        <ul className="flex flex-wrap gap-1.5" aria-label="Tecnologías utilizadas">
          {tech.map((t) => (
            <li key={t.slug} className="tech-chip">
              <TechIcon slug={t.iconSlug} name={t.name} className="size-4 shrink-0" />
              {t.name}
            </li>
          ))}
        </ul>
      )}
    </>
  );

  return (
    <article className="mx-auto max-w-5xl space-y-6 p-5">
      <ProjectMedia
        title={project.title}
        demoUrl={project.demoUrl}
        videoUrl={project.videoUrl}
        repoUrl={project.repoUrl}
        images={images}
        cover={project.cover}
        heading={heading}
      >
        {recommendations.length > 0 && (
          <section aria-labelledby="recs-title">
            <h3 id="recs-title" className="cp-group-title">
              Recomendaciones ({recommendations.length})
            </h3>
            <ul className="mt-3 grid gap-3 md:grid-cols-2">
              {recommendations.map((rec) => (
                <li key={rec.id}>
                  <RecommendationCard rec={rec} />
                </li>
              ))}
            </ul>
          </section>
        )}
      </ProjectMedia>

      {project.highlights.length > 0 && (
        <section aria-labelledby="highlights-title">
          <h3 id="highlights-title" className="cp-group-title">
            Características clave
          </h3>
          <ul className="mt-3 list-disc space-y-1 pl-6">
            {project.highlights.map((h) => (
              <li key={h}>{h}</li>
            ))}
          </ul>
        </section>
      )}

      <section aria-labelledby="readme-title">
        <h3 id="readme-title" className="cp-group-title">
          Léame · README.md
        </h3>
        {readme ? (
          // GitHub renders and sanitizes this HTML server-side (see src/lib/github-readme.ts).
          <div className="readme mt-3" dangerouslySetInnerHTML={{ __html: readme }} />
        ) : (
          <div className="readme mt-3">
            {project.description.split("\n\n").map((paragraph) => (
              <p key={paragraph}>{paragraph}</p>
            ))}
          </div>
        )}
      </section>
    </article>
  );
}
