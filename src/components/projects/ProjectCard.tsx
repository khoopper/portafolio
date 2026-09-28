import Image from "next/image";
import Link from "next/link";
import { IconFolder } from "@/components/icons";
import type { Project } from "@/lib/types";

/** Explorer "Iconos grandes" tile: thumbnail + name. Everything else lives in the detail window. */
export function ProjectCard({ project }: { project: Project }) {
  return (
    <Link id={project.slug} href={`/proyectos/${project.slug}`} className="project-card">
      <div className="project-cover">
        {project.cover ? (
          <Image
            src={project.cover}
            alt=""
            fill
            sizes="(min-width: 1280px) 320px, (min-width: 640px) 50vw, 100vw"
            className="object-cover"
          />
        ) : (
          <IconFolder className="size-16 drop-shadow-lg" />
        )}
      </div>
      <h3 className="project-card-title">{project.title}</h3>
    </Link>
  );
}
