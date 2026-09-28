"use client";

import { Win7Icon } from "@/components/icons";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useCallback, useEffect, useRef, useState, type PointerEvent } from "react";
import { openPrivacyCenter } from "@/lib/consent";
import type { NavItem } from "./site-nav";
import { StartMenu, type StartMenuData } from "./StartMenu";
import { TrayClock } from "./TrayClock";
import { useWindowState } from "./window-state";

interface TaskbarProps {
  items: NavItem[];
  menu: StartMenuData;
  available: boolean;
}

export function Taskbar({ items, menu, available }: TaskbarProps) {
  const pathname = usePathname();
  const { minimized, closed, restore } = useWindowState();
  const [menuOpen, setMenuOpen] = useState(false);
  const orbRef = useRef<HTMLButtonElement>(null);
  const currentRef = useRef<HTMLAnchorElement>(null);

  // The minimize button unmounts with the window: hand focus to the button that restores it.
  useEffect(() => {
    if (minimized) currentRef.current?.focus();
  }, [minimized]);

  const closeMenu = useCallback((returnFocus: boolean) => {
    setMenuOpen(false);
    if (returnFocus) orbRef.current?.focus();
  }, []);

  // Win7 hover glow follows the cursor.
  const trackGlow = (e: PointerEvent<HTMLElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    e.currentTarget.style.setProperty("--mx", `${e.clientX - rect.left}px`);
  };

  return (
    <>
      <nav aria-label="Barra de tareas" className="taskbar">
        <button
          ref={orbRef}
          type="button"
          className="start-orb"
          aria-label="Menú Inicio"
          aria-expanded={menuOpen}
          aria-controls="start-menu"
          onClick={() => setMenuOpen((o) => !o)}
        >
          <Win7Icon name="start-orb" className="size-full" />
        </button>
        <ul className="ml-1 flex items-center gap-1">
          {items.map((item) => {
            const current = pathname === item.href || pathname.startsWith(`${item.href}/`);
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
                  <span className="sr-only lg:not-sr-only">{item.label}</span>
                </Link>
              </li>
            );
          })}
        </ul>
        <div className="taskbar-tray ml-auto">
          {available && (
            <span className="tray-status">
              <span className="tray-dot" aria-hidden="true" />
              <span className="sr-only sm:not-sr-only">Disponible</span>
            </span>
          )}
          <button type="button" className="tray-btn" onClick={openPrivacyCenter} title="Preferencias de privacidad" aria-label="Preferencias de privacidad">
            <Win7Icon name="shield-ok" className="size-4" />
          </button>
          <span className="hidden sm:inline" title="Idioma: español">
            ES
          </span>
          <TrayClock />
        </div>
      </nav>
      <StartMenu open={menuOpen} onClose={closeMenu} orbRef={orbRef} items={items} data={menu} />
    </>
  );
}
