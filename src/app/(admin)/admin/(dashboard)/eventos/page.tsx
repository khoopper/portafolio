import { KIND_LABEL, countryName } from "@/components/admin/SiteStatsPanel";
import { IconAuditLogs, IconEventInfo, IconEventSuccess } from "@/components/icons/admin-icons";
import { AeroWindow } from "@/components/win7/AeroWindow";
import { getSiteStats } from "@/lib/analytics/stats";

const DEVICE_LABEL: Record<string, string> = { mobile: "Móvil", tablet: "Tableta", desktop: "Escritorio" };
const when = new Intl.DateTimeFormat("es", { dateStyle: "short", timeStyle: "medium", timeZone: "America/El_Salvador" });

export default async function AdminEventsPage() {
  const { recent, available } = await getSiteStats();
  const statusBar = (
    <div className="flex w-full items-center justify-between text-xs text-win-muted font-normal">
      <span>Visor de Eventos · Actividad real del sitio</span>
      <span>Eventos mostrados: {recent.length}</span>
    </div>
  );

  return (
    <AeroWindow
      title="Visor de Eventos de Windows · Panel Administrativo"
      icon={<IconAuditLogs className="size-full" />}
      address={["Equipo", "Administración", "Visor de eventos"]}
      statusBar={statusBar}
      homeHref="/admin"
    >
      <div className="p-5">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3 border-b border-[#d5dfe5] pb-3">
          <div>
            <h2 className="win-h1">Actividad reciente</h2>
            <p className="text-xs text-win-muted mt-0.5">
              Las últimas 25 visitas e interacciones registradas, sin cookies ni direcciones IP.
            </p>
          </div>
        </div>

        {/* Tabla de eventos estilo Visor de Eventos de Windows 7 */}
        <div className="overflow-x-auto rounded border border-[#a4b3c7] bg-white shadow-sm">
          <table className="w-full text-left text-xs border-collapse">
            <thead className="border-b border-[#a0afc3] bg-gradient-to-b from-[#f9fbfd] to-[#e4edf7] text-[#1e3287] select-none">
              <tr>
                <th className="p-2 border-r border-[#d2dce8] font-semibold w-12 text-center">Tipo</th>
                <th className="p-2 border-r border-[#d2dce8] font-semibold w-44">Fecha y hora</th>
                <th className="p-2 border-r border-[#d2dce8] font-semibold w-44">Evento</th>
                <th className="p-2 border-r border-[#d2dce8] font-semibold">Página</th>
                <th className="p-2 border-r border-[#d2dce8] font-semibold w-36">País</th>
                <th className="p-2 font-semibold w-28">Dispositivo</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 text-[#1e1e1e]">
              {recent.length === 0 && (
                <tr>
                  <td colSpan={6} className="p-6 text-center text-win-muted">
                    {available ? "Aún no hay actividad registrada." : "La medición aún no está activa: falta ejecutar la migración site_events en Supabase."}
                  </td>
                </tr>
              )}
              {recent.map((item, i) => (
                <tr key={`${item.createdAt}-${i}`} className="hover:bg-[#eef5fc] transition-colors">
                  <td className="p-2.5 text-center">
                    <div className="flex justify-center">{item.kind === "view" ? <IconEventInfo className="size-4" /> : <IconEventSuccess className="size-4" />}</div>
                  </td>
                  <td className="p-2.5 font-mono text-win-muted text-[11px] whitespace-nowrap">{when.format(new Date(item.createdAt))}</td>
                  <td className="p-2.5 font-medium text-win-heading whitespace-nowrap">{KIND_LABEL[item.kind] ?? item.kind}</td>
                  <td className="p-2.5 font-mono text-[11px] break-all">{item.path}</td>
                  <td className="p-2.5 text-win-muted">{item.country ? countryName(item.country) : "—"}</td>
                  <td className="p-2.5 text-win-muted">{DEVICE_LABEL[item.device] ?? item.device}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </AeroWindow>
  );
}
