import { IconControlPanel } from "@/components/icons";
import { TechIcon } from "@/components/TechIcon";
import { AeroWindow } from "@/components/win7/AeroWindow";
import { getTechnologies } from "@/lib/data";

const CATEGORY_NAMES: Record<string, string> = {
  lenguajes: "Lenguajes de Programación",
  frontend: "Frontend & UI",
  backend: "Backend & APIs",
  "bases-datos": "Bases de Datos & Persistencia",
  herramientas: "Herramientas & Entornos",
};

export default async function AdminTechnologiesPage() {
  const technologies = await getTechnologies();

  // Agrupar por categoría
  const grouped = technologies.reduce<Record<string, typeof technologies>>((acc, tech) => {
    if (!acc[tech.category]) acc[tech.category] = [];
    acc[tech.category].push(tech);
    return acc;
  }, {});

  const statusBar = (
    <div className="flex w-full items-center justify-between text-xs text-win-muted">
      <span>{technologies.length} tecnologías configuradas con logos oficiales</span>
      <span>Librería: Simple Icons v16</span>
    </div>
  );

  return (
    <AeroWindow
      title="Tecnologías del Sistema · Panel Administrativo"
      icon={<IconControlPanel className="size-full" />}
      address={["Equipo", "Administración", "Tecnologías"]}
      statusBar={statusBar}
      homeHref="/admin"
    >
      <div className="p-5">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3 border-b border-gray-200 pb-3">
          <div>
            <h2 className="win-h1">Gestión del Stack Tecnológico</h2>
            <p className="text-xs text-win-muted mt-0.5">
              Vista de las tecnologías que se muestran en la sección Tecnologías. El catálogo se define en el código del sitio (cada tecnología necesita su ícono).
            </p>
          </div>
        </div>

        <div className="space-y-6">
          {Object.entries(grouped).map(([category, items]) => (
            <div key={category} className="rounded border border-[#c4d5e7] bg-white p-4 shadow-sm">
              <div className="flex items-center justify-between border-b border-gray-100 pb-2">
                <h3 className="text-sm font-semibold text-win-heading">
                  {CATEGORY_NAMES[category] || category}
                </h3>
                <span className="rounded bg-blue-50 px-2 py-0.5 text-xs text-blue-700 font-medium">
                  {items.length} items
                </span>
              </div>

              <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6">
                {items.map((tech) => (
                  <div
                    key={tech.slug}
                    className="flex items-center gap-2 rounded border border-gray-200 bg-[#fbfcfd] p-2 hover:border-[#7da2ce] hover:bg-[#f0f6ff] transition-all"
                  >
                    <div className="flex size-7 shrink-0 items-center justify-center rounded bg-white p-1 shadow-sm border border-gray-100">
                      <TechIcon slug={tech.iconSlug} name={tech.name} className="size-5" />
                    </div>
                    <span className="truncate text-xs font-medium text-[#1e1e1e]">{tech.name}</span>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </AeroWindow>
  );
}
