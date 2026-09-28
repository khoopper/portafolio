import type { ReactNode } from "react";
import { IconComputer, IconControlPanel, IconFolder, IconMail, IconUser, Win7Icon } from "@/components/icons";

export interface NavItem {
  href: string;
  label: string;
  description: string;
  icon: ReactNode;
}

export const SITE_NAV: NavItem[] = [
  { href: "/inicio", label: "Inicio", description: "Centro de bienvenida", icon: <IconComputer className="size-full" /> },
  { href: "/proyectos", label: "Proyectos", description: "Lo que he construido", icon: <IconFolder className="size-full" /> },
  { href: "/recomendaciones", label: "Recomendaciones", description: "Lo que dicen mis clientes", icon: <Win7Icon name="shield-ok" className="size-full" /> },
  { href: "/tecnologias", label: "Tecnologías", description: "Mi stack de trabajo", icon: <IconControlPanel className="size-full" /> },
  { href: "/sobre-mi", label: "Sobre mí", description: "Perfil y experiencia", icon: <IconUser className="size-full" /> },
  { href: "/contacto", label: "Contacto", description: "Hablemos", icon: <IconMail className="size-full" /> },
];
