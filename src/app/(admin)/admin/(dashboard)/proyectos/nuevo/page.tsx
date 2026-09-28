import { ProjectForm } from "@/components/admin/ProjectForm";
import { IconFolder } from "@/components/icons";
import { AeroWindow } from "@/components/win7/AeroWindow";

export default function NewProjectPage() {
  const statusBar = (
    <div className="flex w-full items-center justify-between text-xs text-win-muted">
      <span>Asistente para agregar nuevo proyecto al portafolio</span>
      <span>Estado: Modo Creación</span>
    </div>
  );

  return (
    <AeroWindow
      title="Asistente para Nuevo Proyecto · Portfolio.exe"
      icon={<IconFolder className="size-full" />}
      address={["Equipo", "Administración", "Proyectos", "Nuevo Proyecto"]}
      statusBar={statusBar}
      homeHref="/admin/proyectos"
    >
      <div className="p-5 max-w-3xl mx-auto">
        <div className="mb-4 border-b border-gray-200 pb-3">
          <h2 className="win-h1">Crear Nuevo Proyecto</h2>
          <p className="text-xs text-win-muted mt-0.5">
            Completa la información técnica, enlaces y atributos del proyecto para incorporarlo a la vitrina.
          </p>
        </div>

        <ProjectForm isNew={true} />
      </div>
    </AeroWindow>
  );
}
