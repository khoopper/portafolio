import type { EventKind } from "@/lib/analytics/event";
import type { SiteStats } from "@/lib/analytics/stats";

export const KIND_LABEL: Record<EventKind, string> = {
  view: "Visita",
  cv: "Descarga de CV",
  demo: "Demo reproducida",
  repo: "Clic en repositorio",
  contact: "Clic en contacto",
};

const DEVICE_LABEL: Record<string, string> = { mobile: "Móvil", tablet: "Tableta", desktop: "Escritorio" };

const regionNames = new Intl.DisplayNames(["es"], { type: "region" });
export function countryName(code: string): string {
  try {
    return regionNames.of(code) ?? code;
  } catch {
    return code;
  }
}

const nf = new Intl.NumberFormat("es");

function Row({ label, value }: { label: string; value: number | string }) {
  return (
    <div className="flex justify-between border-b border-gray-100 py-1 last:border-b-0">
      <span className="text-win-muted">{label}</span>
      <span className="font-mono font-medium">{typeof value === "number" ? nf.format(value) : value}</span>
    </div>
  );
}

function Ranking({ title, rows, empty }: { title: string; rows: { label: string; value: number }[]; empty: string }) {
  const max = Math.max(1, ...rows.map((r) => r.value));
  return (
    <fieldset className="win-groupbox space-y-1.5">
      <legend className="font-semibold text-win-heading">{title}</legend>
      {rows.length === 0 ? (
        <p className="py-1 text-win-muted">{empty}</p>
      ) : (
        rows.map((r) => (
          <div key={r.label} className="text-[11px]">
            <div className="flex justify-between gap-2">
              <span className="truncate">{r.label}</span>
              <span className="font-mono">{nf.format(r.value)}</span>
            </div>
            <div className="mt-0.5 h-1.5 rounded-sm bg-[#e6eef7]">
              <div className="h-full rounded-sm bg-[#3c7fb1]" style={{ width: `${(r.value / max) * 100}%` }} />
            </div>
          </div>
        ))
      )}
    </fieldset>
  );
}

/** Real visit numbers. Everything reads zero until someone actually visits the site. */
export function SiteStatsPanel({ stats }: { stats: SiteStats }) {
  const maxViews = Math.max(1, ...stats.byDay.map((d) => d.views));
  const clickTotal = stats.clicks.cv + stats.clicks.demo + stats.clicks.repo + stats.clicks.contact;

  return (
    <div className="space-y-4 text-xs">
      {!stats.available && (
        <p role="status" className="rounded border border-[#e0c060] bg-[#fff8dc] p-3 text-[#5a4500]">
          Las estadísticas aún no están activas en la base de datos, por eso todo aparece en cero. Ejecuta una vez el archivo{" "}
          <code>supabase/migrations/20260929000000_site_events.sql</code> y después <code>20260930000000_site_stats_funnel.sql</code> en el Editor SQL de Supabase.
        </p>
      )}
      {stats.available && stats.viewsMonth === 0 && (
        <p className="text-win-muted">Todavía nadie ha visitado el sitio desde que se activó la medición. Los números aparecerán aquí en cuanto haya visitas.</p>
      )}

      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        <fieldset className="win-groupbox">
          <legend className="font-semibold text-win-heading">Visitas</legend>
          <Row label="Hoy" value={stats.viewsToday} />
          <Row label="Últimos 7 días" value={stats.viewsWeek} />
          <Row label="Últimos 30 días" value={stats.viewsMonth} />
        </fieldset>
        <fieldset className="win-groupbox">
          <legend className="font-semibold text-win-heading">Visitantes</legend>
          <Row label="Únicos hoy" value={stats.visitorsToday} />
          <Row label="Únicos por día (7 días, suma)" value={stats.visitorDaysWeek} />
          <p className="pt-1 text-[11px] text-win-muted">Sin cookies ni IP: un visitante no se enlaza entre días.</p>
        </fieldset>
        <fieldset className="win-groupbox">
          <legend className="font-semibold text-win-heading">Interacciones (30 días)</legend>
          <Row label="Descargas de CV" value={stats.clicks.cv} />
          <Row label="Demos reproducidas" value={stats.clicks.demo} />
          <Row label="Clics a repositorios" value={stats.clicks.repo} />
          <Row label="Clics de contacto" value={stats.clicks.contact} />
          {clickTotal === 0 && <p className="pt-1 text-[11px] text-win-muted">Sin interacciones registradas.</p>}
        </fieldset>
      </div>

      <fieldset className="win-groupbox">
        <legend className="font-semibold text-win-heading">Visitas por día (últimos 14 días)</legend>
        <div className="flex h-28 items-end gap-1" role="img" aria-label={`Visitas por día: ${stats.byDay.map((d) => `${d.day} ${d.views}`).join(", ") || "sin datos"}`}>
          {stats.byDay.map((d) => (
            <div key={d.day} className="flex h-full flex-1 flex-col items-center justify-end gap-1" title={`${d.day}: ${d.views} visitas, ${d.visitors} visitantes`}>
              <div className="w-full rounded-t-sm bg-[#3c7fb1]" style={{ height: d.views ? `${Math.max(4, (d.views / maxViews) * 100)}%` : "2px", opacity: d.views ? 1 : 0.3 }} />
              <span className="text-[9px] text-win-muted">{d.day.slice(8)}</span>
            </div>
          ))}
          {stats.byDay.length === 0 && <p className="text-win-muted">Sin datos.</p>}
        </div>
      </fieldset>

      <fieldset className="win-groupbox space-y-3">
        <legend className="font-semibold text-win-heading">Embudo: dónde se va el visitante (30 días)</legend>
        <div className="grid grid-cols-1 gap-x-6 gap-y-1 md:grid-cols-3">
          <Row label="Visitas (un visitante por día)" value={stats.visits} />
          <Row label="Vieron una sola página" value={stats.singlePageVisits} />
          <Row label="Se quedaron a explorar" value={stats.visits ? `${Math.round(((stats.visits - stats.singlePageVisits) / stats.visits) * 100)} %` : "—"} />
        </div>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <Ranking title="Por dónde entran" rows={stats.entryPages.map((p) => ({ label: p.path, value: p.visits }))} empty="Sin visitas." />
          <Ranking title="Dónde se van (última página)" rows={stats.exitPages.map((p) => ({ label: p.path, value: p.visits }))} empty="Sin visitas." />
        </div>
        <p className="text-[11px] text-win-muted">Si muchas visitas terminan en la misma página, ahí se pierde al cliente: revisa que tenga un siguiente paso claro (contacto, CV, proyectos).</p>
      </fieldset>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        <Ranking title="Páginas más vistas" rows={stats.topPages.map((p) => ({ label: p.path, value: p.views }))} empty="Sin visitas." />
        <Ranking title="Países" rows={stats.countries.map((c) => ({ label: countryName(c.country), value: c.views }))} empty="Sin visitas." />
        <Ranking title="Dispositivos" rows={stats.devices.map((d) => ({ label: DEVICE_LABEL[d.device] ?? d.device, value: d.views }))} empty="Sin visitas." />
      </div>
    </div>
  );
}
