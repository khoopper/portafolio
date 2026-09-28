"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useTransition, type RefObject } from "react";
import { IconAdminShield, IconLock } from "@/components/icons/admin-icons";
import type { NavItem } from "@/components/win7/site-nav";
import { useWindowState } from "@/components/win7/window-state";
import { logoutAction } from "@/app/(admin)/admin/actions";
import { IconFolder, IconInternet } from "@/components/icons";

interface AdminStartMenuProps {
  open: boolean;
  onClose: (returnFocus: boolean) => void;
  orbRef: RefObject<HTMLButtonElement | null>;
  items: NavItem[];
}

export function AdminStartMenu({ open, onClose, orbRef, items }: AdminStartMenuProps) {
  const ref = useRef<HTMLDivElement>(null);
  const pathname = usePathname();
  const { minimized, restore } = useWindowState();
  const [isLoggingOut, startLogout] = useTransition();

  useEffect(() => {
    if (!open) return;
    ref.current?.querySelector<HTMLElement>("a, button")?.focus();
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose(true);
    };
    const onPointerDown = (e: PointerEvent) => {
      const target = e.target as Node;
      if (!ref.current?.contains(target) && !orbRef.current?.contains(target)) onClose(false);
    };
    document.addEventListener("keydown", onKey);
    document.addEventListener("pointerdown", onPointerDown);
    return () => {
      document.removeEventListener("keydown", onKey);
      document.removeEventListener("pointerdown", onPointerDown);
    };
  }, [open, onClose, orbRef]);

  if (!open) return null;

  const go = (href: string) => {
    onClose(false);
    if (minimized && href.split("#")[0] === pathname) restore();
  };

  const handleLogout = () => {
    startLogout(async () => {
      await logoutAction();
    });
  };

  return (
    <div id="admin-start-menu" ref={ref} role="dialog" aria-label="Menú Inicio Admin" className="start-menu">
      {/* Columna Izquierda: Accesos a Módulos */}
      <div className="start-left">
        <p className="px-2 py-1 text-xs font-semibold text-win-heading">Herramientas Administrativas</p>
        <ul className="mt-1 space-y-0.5">
          {items.map((item) => (
            <li key={item.href}>
              <Link href={item.href} prefetch={true} className="start-item" onClick={() => go(item.href)}>
                <span className="size-8 shrink-0">{item.icon}</span>
                <span className="min-w-0">
                  <span className="block font-medium">{item.label}</span>
                  <span className="block text-xs text-win-muted">{item.description}</span>
                </span>
              </Link>
            </li>
          ))}
        </ul>
      </div>

      {/* Columna Derecha: Perfil Admin y Opciones del Sistema */}
      <div className="start-right flex flex-col justify-between">
        <div>
          <div className="mx-2 mb-2 mt-1 flex size-12 items-center justify-center rounded-lg bg-blue-900/60 p-2 shadow-inner">
            <IconAdminShield className="size-full" />
          </div>
          <p className="start-name text-sm">Administrador</p>
          <ul className="mt-2 space-y-1">
            <li>
              <Link href="/inicio" target="_blank" className="start-link text-xs flex items-center gap-1.5">
                <IconInternet className="size-4" /> Ver sitio público
              </Link>
            </li>
            <li>
              <Link href="/proyectos" target="_blank" className="start-link text-xs flex items-center gap-1.5">
                <IconFolder className="size-4" /> Ver proyectos
              </Link>
            </li>
          </ul>
        </div>

        <button
          type="button"
          disabled={isLoggingOut}
          className="win-button start-shutdown mx-2 mb-1 flex items-center justify-center gap-1.5 text-xs text-red-800 hover:text-red-900 disabled:opacity-50"
          onClick={handleLogout}
        >
          <IconLock className="size-4" />
          <span>{isLoggingOut ? "Cerrando..." : "Cerrar sesión"}</span>
        </button>
      </div>
    </div>
  );
}
