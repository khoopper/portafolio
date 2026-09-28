import Link from "next/link";
import { AdminDashboardContent } from "@/components/admin/AdminDashboardContent";
import { IconLock, IconTaskManager } from "@/components/icons/admin-icons";
import { AeroWindow } from "@/components/win7/AeroWindow";
import { getSiteStats } from "@/lib/analytics/stats";
import { getProfile, getProjects, getSettings, getTechnologies } from "@/lib/data";
import { isSupabaseConfigured } from "@/lib/supabase";
import { logoutAction } from "../actions";
import { IconInternet } from "@/components/icons";

export default async function AdminDashboardPage() {
  const [profile, settings, projects, technologies, stats] = await Promise.all([
    getProfile(),
    getSettings(),
    getProjects(),
    getTechnologies(),
    getSiteStats(),
  ]);
  const configured = isSupabaseConfigured();
  const services = [
    { name: "Base de datos Supabase", ok: configured, detail: configured ? "Conectada (PostgreSQL, Auth y Storage)" : "Faltan las variables de entorno de Supabase" },
    {
      name: "Estadísticas de visitas",
      ok: stats.available,
      detail: stats.available ? "Registrando visitas sin cookies ni IP" : "Falta ejecutar la migración site_events en Supabase",
    },
    { name: "Acceso de administrador", ok: true, detail: "Sesión verificada con contraseña y código de dos pasos" },
  ];

  const toolbar = (
    <div className="ml-auto flex items-center gap-2">
      <Link
        href="/inicio"
        target="_blank"
        className="win-button text-xs flex items-center gap-1.5"
        title="Abrir portafolio en una nueva pestaña"
      >
        <IconInternet className="size-4" />
        <span className="hidden sm:inline">Ver sitio público</span>
      </Link>
      <form action={logoutAction}>
        <button
          type="submit"
          className="win-button text-xs flex items-center gap-1 text-red-800 hover:text-red-900"
          title="Cerrar sesión administrativa"
        >
          <IconLock className="size-4" />
          <span className="hidden sm:inline">Cerrar sesión</span>
        </button>
      </form>
    </div>
  );

  const statusBar = (
    <div className="flex w-full items-center justify-between text-xs text-win-muted">
      <div className="flex items-center gap-4">
        <span>Visitas hoy: <strong>{stats.viewsToday}</strong></span>
        <span className="hidden sm:inline">Últimos 7 días: <strong>{stats.viewsWeek}</strong></span>
        <span>Proyectos: <strong>{projects.length}</strong></span>
      </div>
      <div className="flex items-center gap-2 font-mono">
        <span className={`size-2 rounded-full ${configured ? "bg-emerald-500" : "bg-amber-500"}`} />
        <span>{configured ? "CONECTADO" : "SIN SUPABASE"}</span>
      </div>
    </div>
  );

  return (
    <AeroWindow
      title="Administrador de tareas · Panel Administrativo"
      icon={<IconTaskManager className="size-full" />}
      address={["Equipo", "Administración", "Administrador de tareas"]}
      toolbar={toolbar}
      statusBar={statusBar}
      homeHref="/admin"
    >
      <div className="p-5">
        <div className="mb-5 flex flex-wrap items-center justify-between gap-3 border-b border-gray-200 pb-4">
          <div>
            <h2 className="win-h1">Consola Administrativa de Windows</h2>
            <p className="text-xs text-win-muted mt-0.5">
              Estadísticas reales de visitas y control central del portafolio.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <span className="rounded border border-[#7da2ce] bg-gradient-to-b from-[#dcebfc] to-[#c1dcfc] px-2.5 py-1 text-xs font-semibold text-[#1e3287] shadow-sm">
              Sesión administrativa activa
            </span>
          </div>
        </div>

        <AdminDashboardContent
          profile={profile}
          settings={settings}
          projects={projects}
          technologies={technologies}
          stats={stats}
          services={services}
        />
      </div>
    </AeroWindow>
  );
}
