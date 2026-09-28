"use client";

import Link from "next/link";
import { SiteStatsPanel } from "@/components/admin/SiteStatsPanel";
import { Tabs } from "@/components/win7/Tabs";
import type { SiteStats } from "@/lib/analytics/stats";
import type { Profile, Project, SiteSettings, Technology } from "@/lib/types";
import { IconAdd, IconControlPanel, IconFolder, IconProperties, IconUser } from "@/components/icons";
import { IconAdminShield, IconAuditLogs } from "@/components/icons/admin-icons";

export interface ServiceStatus {
  name: string;
  ok: boolean;
  detail: string;
}

interface Props {
  profile: Profile;
  settings: SiteSettings;
  projects: Project[];
  technologies: Technology[];
  stats: SiteStats;
  services: ServiceStatus[];
}

export function AdminDashboardContent({ profile, settings, projects, technologies, stats, services }: Props) {
  const featuredProjects = projects.filter((p) => p.featured);

  const tabs = [
    {
      id: "estadisticas",
      label: "Estadísticas",
      content: <SiteStatsPanel stats={stats} />,
    },
    {
      id: "modulos",
      label: "Gestión de Portafolio",
      content: (
        <div className="space-y-4">
          <p className="text-xs text-win-muted">
            Módulos del sistema disponibles para administración y edición de contenidos:
          </p>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {/* Módulo Proyectos con botón nuevo y editar */}
            <div className="rounded border border-[#a4b3c7] bg-white p-3.5 shadow-sm flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between border-b border-[#e5edf5] pb-2">
                  <span className="font-semibold text-sm text-win-heading flex items-center gap-1.5">
                    <IconFolder className="size-5" /> Proyectos
                  </span>
                  <span className="text-xs font-mono text-win-muted">
                    {projects.length} registrados
                  </span>
                </div>
                <p className="mt-2 text-xs text-win-muted leading-relaxed">
                  Administración de proyectos construidos, enlaces a repositorios, demos y estado en vitrina.
                </p>
                <div className="mt-2 text-[11px] text-[#33475b]">
                  • Destacados en Inicio: {featuredProjects.length} proyectos
                </div>
              </div>

              {/* Botones de acción directa para Proyectos */}
              <div className="mt-3.5 pt-2.5 border-t border-gray-100 flex flex-col gap-1.5">
                <Link
                  href="/admin/proyectos/nuevo"
                  className="win-button win-button--primary text-xs w-full justify-center"
                >
                  <IconAdd className="size-4" />
                  <span>Agregar Nuevo Proyecto</span>
                </Link>
                <Link
                  href="/admin/proyectos"
                  className="win-button text-xs w-full justify-center"
                >
                  <IconProperties className="size-4" />
                  <span>Editar Todos los Proyectos</span>
                </Link>
              </div>
            </div>

            {/* Módulo Tecnologías */}
            <div className="rounded border border-[#a4b3c7] bg-white p-3.5 shadow-sm flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between border-b border-[#e5edf5] pb-2">
                  <span className="font-semibold text-sm text-win-heading flex items-center gap-1.5">
                    <IconControlPanel className="size-5" /> Tecnologías
                  </span>
                  <span className="text-xs font-mono text-win-muted">
                    {technologies.length} activas
                  </span>
                </div>
                <p className="mt-2 text-xs text-win-muted leading-relaxed">
                  Stack tecnológico clasificado por categorías de especialidad y logos oficiales del sistema.
                </p>
                <div className="mt-2 text-[11px] text-[#33475b]">
                  • Categorías: Frontend, Backend, Datos, Herramientas
                </div>
              </div>

              <div className="mt-3.5 pt-2.5 border-t border-gray-100">
                <Link
                  href="/admin/tecnologias"
                  className="win-button text-xs w-full justify-center"
                >
                  Administrar Tecnologías
                </Link>
              </div>
            </div>

            {/* Módulo Perfil & CV */}
            <div className="rounded border border-[#a4b3c7] bg-white p-3.5 shadow-sm flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between border-b border-[#e5edf5] pb-2">
                  <span className="font-semibold text-sm text-win-heading flex items-center gap-1.5">
                    <IconUser className="size-5" /> Perfil y CV
                  </span>
                  <span className="text-xs font-mono text-win-muted">
                    {profile.cvUrl ? "CV Activo" : "Sin CV"}
                  </span>
                </div>
                <p className="mt-2 text-xs text-win-muted leading-relaxed">
                  Datos personales de {profile.name}, titular profesional, síntesis de biografía y archivo PDF.
                </p>
                <div className="mt-2 text-[11px] text-[#33475b] truncate">
                  • {profile.headline}
                </div>
              </div>

              <div className="mt-3.5 pt-2.5 border-t border-gray-100">
                <Link
                  href="/admin/perfil"
                  className="win-button text-xs w-full justify-center"
                >
                  Editar Perfil y Currículum
                </Link>
              </div>
            </div>

            {/* Módulo Configuración */}
            <div className="rounded border border-[#a4b3c7] bg-white p-3.5 shadow-sm flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between border-b border-[#e5edf5] pb-2">
                  <span className="font-semibold text-sm text-win-heading flex items-center gap-1.5">
                    <IconAdminShield className="size-5" /> Configuración
                  </span>
                  <span className="text-xs font-mono text-win-muted">
                    {settings.availableForWork ? "Disponible" : "Ocupado"}
                  </span>
                </div>
                <p className="mt-2 text-xs text-win-muted leading-relaxed">
                  Ajustes de disponibilidad para contratación, enlaces directos a WhatsApp, GitHub y correo.
                </p>
                <div className="mt-2 text-[11px] text-[#33475b] truncate">
                  • Correo: {settings.contactEmail}
                </div>
              </div>

              <div className="mt-3.5 pt-2.5 border-t border-gray-100">
                <Link
                  href="/admin/configuracion"
                  className="win-button text-xs w-full justify-center"
                >
                  Abrir Configuración
                </Link>
              </div>
            </div>

            {/* Módulo Visor de Eventos */}
            <div className="rounded border border-[#a4b3c7] bg-white p-3.5 shadow-sm flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between border-b border-[#e5edf5] pb-2">
                  <span className="font-semibold text-sm text-win-heading flex items-center gap-1.5">
                    <IconAuditLogs className="size-5" /> Visor de Eventos
                  </span>
                  <span className="text-xs font-mono text-win-muted">
                    Auditoría
                  </span>
                </div>
                <p className="mt-2 text-xs text-win-muted leading-relaxed">
                  Registro detallado de accesos administrativos, diagnósticos de ejecución y alertas del sistema.
                </p>
                <div className="mt-2 text-[11px] text-[#33475b]">
                  • Historial de seguridad
                </div>
              </div>

              <div className="mt-3.5 pt-2.5 border-t border-gray-100">
                <Link
                  href="/admin/eventos"
                  className="win-button text-xs w-full justify-center"
                >
                  Ver Registro de Eventos
                </Link>
              </div>
            </div>
          </div>
        </div>
      ),
    },
    {
      id: "servicios",
      label: "Servicios",
      content: (
        <div className="space-y-4 text-xs">
          <p className="text-win-muted">Estado real de las dependencias del sitio, comprobado al abrir este panel:</p>
          <div className="overflow-hidden rounded border border-[#a4b3c7] bg-white shadow-sm">
            <table className="w-full border-collapse text-left">
              <thead className="border-b border-[#a0afc3] bg-[#f0f4f9] text-[#1e3287]">
                <tr>
                  <th className="border-r border-[#d2dce8] p-2 font-semibold">Servicio</th>
                  <th className="border-r border-[#d2dce8] p-2 font-semibold">Estado</th>
                  <th className="p-2 font-semibold">Detalle</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {services.map((s) => (
                  <tr key={s.name} className="hover:bg-[#f6f9fc]">
                    <td className="p-2 font-medium">{s.name}</td>
                    <td className={`p-2 font-medium ${s.ok ? "text-emerald-700" : "text-amber-700"}`}>{s.ok ? "Activo" : "Pendiente"}</td>
                    <td className="p-2 text-win-muted">{s.detail}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ),
    },
  ];

  return <Tabs label="Pestañas del panel administrativo" tabs={tabs} />;
}
