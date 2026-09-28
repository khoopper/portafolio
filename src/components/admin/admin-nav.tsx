import { IconControlPanel, IconFolder, IconUser, Win7Icon } from "@/components/icons";
import { IconAdminShield, IconAuditLogs, IconTaskManager } from "@/components/icons/admin-icons";
import type { NavItem } from "@/components/win7/site-nav";

export const ADMIN_NAV: NavItem[] = [
  {
    href: "/admin",
    label: "Administrador de tareas",
    description: "Métricas y KPIs del sistema",
    icon: <IconTaskManager className="size-full" />,
  },
  {
    href: "/admin/proyectos",
    label: "Proyectos",
    description: "Gestión de proyectos y demos",
    icon: <IconFolder className="size-full" />,
  },
  {
    href: "/admin/recomendaciones",
    label: "Recomendaciones",
    description: "Invitaciones y moderación",
    icon: <Win7Icon name="shield-ok" className="size-full" />,
  },
  {
    href: "/admin/tecnologias",
    label: "Tecnologías",
    description: "Stack y categorías técnicas",
    icon: <IconControlPanel className="size-full" />,
  },
  {
    href: "/admin/perfil",
    label: "Perfil y CV",
    description: "Información personal y currículum",
    icon: <IconUser className="size-full" />,
  },
  {
    href: "/admin/configuracion",
    label: "Configuración",
    description: "Ajustes generales y enlaces",
    icon: <IconAdminShield className="size-full" />,
  },
  {
    href: "/admin/eventos",
    label: "Visor de eventos",
    description: "Auditoría y registros de actividad",
    icon: <IconAuditLogs className="size-full" />,
  },
];
