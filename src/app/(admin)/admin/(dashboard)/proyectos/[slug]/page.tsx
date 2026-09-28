import { notFound } from "next/navigation";
import { ProjectForm } from "@/components/admin/ProjectForm";
import { IconFolder } from "@/components/icons";
import { AeroWindow } from "@/components/win7/AeroWindow";
import { getAllProjects } from "@/lib/data";
import { deleteProjectAction } from "@/app/(admin)/admin/project-actions";

interface PageProps {
  params: Promise<{ slug: string }>;
}

export default async function EditProjectPage({ params }: PageProps) {
  const { slug } = await params;
  const allProjects = await getAllProjects();
  const project = allProjects.find((p) => p.slug === slug);

  if (!project) {
    notFound();
  }

  const statusBar = (
    <div className="flex w-full items-center justify-between text-xs text-win-muted">
      <span>Propiedades del archivo de proyecto</span>
      <span>Identificador: {project.slug}</span>
    </div>
  );

  return (
    <AeroWindow
      title={`Propiedades de: ${project.title}`}
      icon={<IconFolder className="size-full" />}
      address={["Equipo", "Administración", "Proyectos", project.title]}
      statusBar={statusBar}
      homeHref="/admin/proyectos"
    >
      <div className="p-5 max-w-3xl mx-auto">
        <div className="mb-4 border-b border-gray-200 pb-3 flex items-center justify-between">
          <div>
            <h2 className="win-h1">Propiedades de {project.title}</h2>
            <p className="text-xs text-win-muted mt-0.5">
              Edita las opciones de publicación, detalles técnicos y enlaces a demostraciones.
            </p>
          </div>
          <span className="text-xs font-mono text-win-muted border border-gray-200 rounded px-2 py-1 bg-gray-50">
            {project.status === "published" ? "Habilitado" : "Borrador"}
          </span>
        </div>

        <ProjectForm project={project} isNew={false} />

        {/* Formulario invisible para la acción de eliminación */}
        <form id="delete-form" action={deleteProjectAction}>
          <input type="hidden" name="slug" value={project.slug} />
        </form>
      </div>
    </AeroWindow>
  );
}
