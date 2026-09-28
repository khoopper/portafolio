"use client";

import Link from "next/link";
import { useEffect, useId, useRef, useState, useSyncExternalStore } from "react";
import { Avatar } from "@/components/Avatar";
import { CloseGlyph, Win7Icon } from "@/components/icons";
import { cn } from "@/lib/cn";
import { isDesktopEmpty } from "@/lib/session-flag";
import { SITE_NAV } from "./site-nav";
import { dragStyle, useWindowDrag } from "./use-window-drag";
import { useWindowState } from "./window-state";

interface WelcomeCenterProps {
  name: string;
  headline: string;
  avatar: string | null;
  cvUrl: string | null;
}

const TIPS = [
  { icon: "start-orb", title: "Menú Inicio", text: "El orbe de la esquina abre accesos rápidos, mis proyectos destacados, el CV y mis redes." },
  { icon: "computer", title: "Barra de tareas", text: "Cada botón abre una sección. Las ventanas se minimizan, maximizan, cierran y se pueden arrastrar." },
  { icon: "internet", title: "Gadget de búsqueda", text: "En el escritorio, busca un proyecto, una tecnología o el CV y ábrelo con Enter." },
];

const noSubscribe = () => () => {};

/** First thing on the desktop after logging in: a Win7 "Getting Started" window that maps the site. */
export function WelcomeCenter({ name, headline, avatar, cvUrl }: WelcomeCenterProps) {
  const titleId = useId();
  const { minimized, offset, close, setOffset } = useWindowState();
  const [closing, setClosing] = useState(false);
  const ref = useRef<HTMLElement>(null);
  const dragHandlers = useWindowDrag(ref, offset, setOffset);
  const firstName = name.split(" ")[0];
  // The server can't see sessionStorage: it renders nothing, and the browser decides. So a visitor who
  // already closed it never sees it flash on reload; a new visitor gets it (with its opening animation).
  const dismissed = useSyncExternalStore(noSubscribe, isDesktopEmpty, () => true);

  // Fallback for when animationend never fires (hidden tab, animations disabled).
  useEffect(() => {
    if (!closing) return;
    const id = setTimeout(close, 400);
    return () => clearTimeout(id);
  }, [closing, close]);

  if (dismissed) return null;
  if (minimized) {
    return (
      <p role="status" className="sr-only">
        Bienvenida cerrada. Usa la barra de tareas para abrir una sección.
      </p>
    );
  }

  return (
    <section
      ref={ref}
      aria-labelledby={titleId}
      className={cn("aero-frame welcome-dialog", closing && "window-closing")}
      style={dragStyle(offset)}
      onAnimationEnd={(e) => {
        if (e.target === e.currentTarget && e.animationName === "window-close") close();
      }}
    >
      <header className="aero-titlebar" {...dragHandlers}>
        <Win7Icon name="info" className="aero-title-icon" />
        <h1 id={titleId} className="aero-title">
          Bienvenido
        </h1>
        <div className="caption-btns">
          <button type="button" className="caption-btn caption-btn--close" aria-label="Cerrar" onClick={() => setClosing(true)}>
            <CloseGlyph />
          </button>
        </div>
      </header>
      <div className="aero-client">
        <div className="min-h-0 flex-1 overflow-y-auto">
          <div className="welcome-hero">
            <Avatar src={avatar} name={name} size={72} priority />
            <div className="min-w-[14rem] flex-1">
              <h2 className="text-[24px] leading-tight text-win-heading">Te doy la bienvenida a mi portafolio</h2>
              <p className="mt-1">
                Soy {firstName}, {headline.charAt(0).toLowerCase() + headline.slice(1)}. Este escritorio es mi carta de presentación: aquí
                tienes dónde encontrar cada cosa.
              </p>
            </div>
          </div>

          <section aria-labelledby="welcome-map" className="px-6 py-4">
            <h2 id="welcome-map" className="win-h2">
              ¿Dónde está cada cosa?
            </h2>
            <ul className="mt-2 grid gap-1 sm:grid-cols-2">
              {SITE_NAV.map((item) => (
                <li key={item.href}>
                  <Link href={item.href} className="welcome-task">
                    <span className="size-8 shrink-0">{item.icon}</span>
                    <span className="min-w-0">
                      <span className="block text-win-link">{item.label}</span>
                      <span className="block text-xs text-win-muted">{item.description}</span>
                    </span>
                  </Link>
                </li>
              ))}
              {cvUrl && (
                <li>
                  <a href={cvUrl} download className="welcome-task">
                    <Win7Icon name="document" className="size-8 shrink-0" />
                    <span className="min-w-0">
                      <span className="block text-win-link">Currículum</span>
                      <span className="block text-xs text-win-muted">Descarga mi CV en PDF</span>
                    </span>
                  </a>
                </li>
              )}
            </ul>
          </section>

          <section aria-labelledby="welcome-tips" className="px-6 pb-5">
            <h2 id="welcome-tips" className="win-h2">
              Cómo moverte
            </h2>
            <ul className="mt-2 grid gap-3 sm:grid-cols-3">
              {TIPS.map((tip) => (
                <li key={tip.title} className="flex gap-2.5">
                  <Win7Icon name={tip.icon} className="size-7 shrink-0" />
                  <p className="text-[13px] leading-snug">
                    <strong className="block font-semibold">{tip.title}</strong>
                    <span className="text-win-muted">{tip.text}</span>
                  </p>
                </li>
              ))}
            </ul>
          </section>
        </div>
        <div className="msgbox-buttons">
          <Link href="/proyectos" className="win-button">
            Ver proyectos
          </Link>
          <button type="button" className="win-button win-button--primary min-w-[74px]" onClick={() => setClosing(true)}>
            Cerrar
          </button>
        </div>
      </div>
    </section>
  );
}
