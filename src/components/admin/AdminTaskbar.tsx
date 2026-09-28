"use client";

import { Win7Icon } from "@/components/icons";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useCallback, useEffect, useRef, useState, useTransition, type PointerEvent } from "react";
import { TrayClock } from "@/components/win7/TrayClock";
import { useWindowState } from "@/components/win7/window-state";
import { ADMIN_NAV } from "./admin-nav";
import { AdminStartMenu } from "./AdminStartMenu";
import { logoutAction } from "@/app/(admin)/admin/actions";
import { IconLock } from "@/components/icons/admin-icons";

export function AdminTaskbar() {
  const pathname = usePathname();
  const { minimized, closed, restore } = useWindowState();
  const [menuOpen, setMenuOpen] = useState(false);
  const orbRef = useRef<HTMLButtonElement>(null);
  const currentRef = useRef<HTMLAnchorElement>(null);
  const [isLoggingOut, startLogout] = useTransition();

  useEffect(() => {
    if (minimized) currentRef.current?.focus();
  }, [minimized]);

  const closeMenu = useCallback((returnFocus: boolean) => {
    setMenuOpen(false);
    if (returnFocus) orbRef.current?.focus();
  }, []);

  const trackGlow = (e: PointerEvent<HTMLElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    e.currentTarget.style.setProperty("--mx", `${e.clientX - rect.left}px`);
  };

  const handleLogout = () => {
    startLogout(async () => {
      await logoutAction();
    });
  };

  return (
    <>
      <nav aria-label="Barra de tareas del Administrador" className="taskbar">
        {/* Orbe de Inicio */}
        <button
          ref={orbRef}
          type="button"
          className="start-orb"
          aria-label="Menú Inicio Administrativo"
          aria-expanded={menuOpen}
          aria-controls="admin-start-menu"
          onClick={() => setMenuOpen((o) => !o)}
        >
          <Win7Icon name="start-orb" className="size-full" />
        </button>

        {/* Botones de navegación anclados en la barra */}
        <ul className="ml-1 flex items-center gap-1">
          {ADMIN_NAV.map((item) => {
            const current = pathname === item.href || (item.href !== "/admin" && pathname.startsWith(`${item.href}/`));
            return (
              <li key={item.href}>
                <Link
                  ref={current ? currentRef : undefined}
                  href={item.href}
                  prefetch={true}
                  aria-current={current && !closed ? "page" : undefined}
                  title={item.label}
                  className="taskbar-btn"
                  onPointerMove={trackGlow}
                  onClick={(e) => {
                    setMenuOpen(false);
                    if (current && minimized) {
                      e.preventDefault();
                      restore();
                    }
                  }}
                >
                  <span className="size-7 shrink-0">{item.icon}</span>
                  <span className="sr-only xl:not-sr-only text-xs">{item.label}</span>
                </Link>
              </li>
            );
          })}
        </ul>

        {/* Bandeja del sistema (System Tray) */}
        <div className="taskbar-tray ml-auto">
          {/* Indicador de Modo Admin */}
          <span className="tray-status text-xs" title="Sesión de Administrador activa">
            <span className="tray-dot" aria-hidden="true" />
            <span className="hidden md:inline font-semibold text-emerald-300">Admin</span>
          </span>

          {/* Botón rápido de cerrar sesión */}
          <button
            type="button"
            onClick={handleLogout}
            disabled={isLoggingOut}
            title="Cerrar sesión administrativa"
            className="flex items-center gap-1 rounded px-2 py-0.5 text-xs text-white/80 hover:bg-white/10 hover:text-white transition-colors"
          >
            <IconLock className="size-4" />
            <span className="hidden sm:inline">{isLoggingOut ? "..." : "Salir"}</span>
          </button>

          <span className="hidden sm:inline" title="Idioma: español">
            ES
          </span>

          <TrayClock />
        </div>
      </nav>

      <AdminStartMenu
        open={menuOpen}
        onClose={closeMenu}
        orbRef={orbRef}
        items={ADMIN_NAV}
      />
    </>
  );
}
