import Link from "next/link";
import { IconAdd, IconFolder, IconWarning } from "@/components/icons";
import { AeroWindow } from "@/components/win7/AeroWindow";
import { getAllProjects } from "@/lib/data";

export default async function AdminProjectsPage({ searchParams }: { searchParams: Promise<{ aviso?: string }> }) {
  const [projects, { aviso }] = await Promise.all([getAllProjects(), searchParams]);

  const statusBar = (
    <div className="flex w-full items-center justify-between text-xs text-win-muted font-normal">
      <span>{projects.length} elementos en lista</span>
      <span>Almacenamiento: Capa de persistencia local activa</span>
    </div>
  );

  return (
    <AeroWindow
      title="Explorador de Proyectos · Portfolio.exe"
      icon={<IconFolder className="size-full" />}
      address={["Equipo", "Administración", "Proyectos"]}
      statusBar={statusBar}
      homeHref="/admin"
    >
      <div className="p-5">
        {/* Barra de Comandos / Título estilo Windows 7 */}
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3 border-b border-[#d5dfe5] pb-3">
          <div>
            <h2 className="win-h1">Explorador de Proyectos</h2>
            <p className="text-xs text-win-muted mt-0.5">
              Gestión directa de los proyectos incorporados al sistema.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <Link
              href="/admin/proyectos/nuevo"
              className="win-button win-button--primary text-xs flex items-center gap-1.5"
            >
              <IconAdd className="size-4" />
              <span>Agregar nuevo proyecto</span>
            </Link>
          </div>
        </div>

        {aviso === "no-eliminado" && (
          <p role="alert" className="wizard-alert mb-3">
            <IconWarning className="size-4 shrink-0" />
            No se pudo eliminar el proyecto. Intenta de nuevo en un momento.
          </p>
        )}

        {/* Vista Detallada de Archivos: Únicamente Nombre y Acciones */}
        <div className="overflow-x-auto rounded border border-[#a4b3c7] bg-white shadow-sm">
          <table className="w-full text-left text-xs border-collapse">
            <thead className="border-b border-[#a0afc3] bg-gradient-to-b from-[#f9fbfd] to-[#e4edf7] text-[#1e3287] select-none">
              <tr>
                <th className="p-2.5 border-r border-[#d2dce8] font-semibold">Nombre</th>
                <th className="p-2.5 font-semibold text-right w-28">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 text-[#1e1e1e]">
              {projects.map((proj) => (
                <tr
                  key={proj.slug}
                  className="hover:bg-[#eef5fc] group transition-colors focus-within:bg-[#dcebfc]"
                >
                  {/* Nombre y descripción */}
                  <td className="p-3">
                    <div className="flex items-center gap-3">
                      <IconFolder className="size-8 shrink-0" />
                      <div className="min-w-0">
                        <Link
                          href={`/admin/proyectos/${proj.slug}`}
                          className="font-semibold text-sm text-[#1e3287] hover:underline block truncate"
                        >
                          {proj.title}
                        </Link>
                        <p className="text-xs text-win-muted truncate mt-0.5">
                          {proj.tagline || proj.description || proj.slug}
                        </p>
                      </div>
                    </div>
                  </td>

                  {/* Acciones */}
                  <td className="p-3 text-right">
                    <Link
                      href={`/admin/proyectos/${proj.slug}`}
                      className="win-button text-xs py-1 px-3.5"
                      title={`Editar propiedades de ${proj.title}`}
                    >
                      Editar
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </AeroWindow>
  );
}
