"use client";

import { usePathname, useRouter } from "next/navigation";
import { useEffect, useId, useLayoutEffect, useRef, useState, useSyncExternalStore, type AnimationEvent, type ReactNode } from "react";
import { BackButtonImage, CloseGlyph, MaxGlyph, MinGlyph } from "@/components/icons";
import { cn } from "@/lib/cn";
import { canGoBackNow, subscribeHistory } from "@/lib/history";
import { dragStyle, useWindowDrag } from "./use-window-drag";
import { useWindowState } from "./window-state";

interface AeroWindowProps {
  title: string;
  icon: ReactNode;
  /** Breadcrumb segments shown in the address bar. */
  address?: string[];
  /** Extra controls on the right of the command bar. */
  toolbar?: ReactNode;
  statusBar?: ReactNode;
  /** false when the child manages its own scrolling (e.g. ExplorerLayout). */
  scroll?: boolean;
  homeHref?: string;
  children: ReactNode;
}

/** Points the minimize/restore animation at the current page's taskbar button. */
function aimAtTaskbarIcon(win: HTMLElement) {
  const icon = document.querySelector('.taskbar-btn[aria-current="page"]');
  if (!icon) return;
  const w = win.getBoundingClientRect();
  const i = icon.getBoundingClientRect();
  win.style.setProperty("--to-icon-x", `${i.left + i.width / 2 - (w.left + w.width / 2)}px`);
  win.style.setProperty("--to-icon-y", `${i.top + i.height / 2 - (w.top + w.height / 2)}px`);
}

// Slightly longer than the CSS animations: a fallback for when animationend never fires
// (hidden tab, animations disabled by the browser).
const ANIMATION_FALLBACK_MS = 400;

export function AeroWindow({ title, icon, address, toolbar, statusBar, scroll = true, homeHref, children }: AeroWindowProps) {
  const titleId = useId();
  const pathname = usePathname();
  const router = useRouter();
  const { minimized, maximized, restoring, offset, minimize, close, toggleMaximize, clearRestoring, setOffset } = useWindowState();
  const [leaving, setLeaving] = useState<null | "minimize" | "close">(null);
  const windowRef = useRef<HTMLElement>(null);
  // Whether the browser has a same-site page to go back to (drives the Back button below).
  const hasHistory = useSyncExternalStore(subscribeHistory, canGoBackNow, () => false);
  const dragHandlers = useWindowDrag(windowRef, offset, setOffset, !maximized);

  useEffect(() => {
    if (!leaving) return;
    const id = setTimeout(() => {
      setLeaving(null);
      if (leaving === "minimize") minimize();
      else close();
    }, ANIMATION_FALLBACK_MS);
    return () => clearTimeout(id);
  }, [leaving, minimize, close]);

  useEffect(() => {
    if (!restoring) return;
    const id = setTimeout(clearRestoring, ANIMATION_FALLBACK_MS);
    return () => clearTimeout(id);
  }, [restoring, clearRestoring]);

  // Restore grows back out of the taskbar button it went into; measured before paint.
  useLayoutEffect(() => {
    if (restoring && windowRef.current) aimAtTaskbarIcon(windowRef.current);
  }, [restoring, minimized]);

  // The desktop (gadgets) is drawn by the layout; only announce the change here.
  if (minimized) {
    return (
      <p role="status" className="sr-only">
        Ventana cerrada. Usa la barra de tareas para volver a abrirla.
      </p>
    );
  }

  const onAnimationEnd = (e: AnimationEvent<HTMLElement>) => {
    if (e.target !== e.currentTarget) return;
    if (e.animationName === "window-minimize") {
      setLeaving(null);
      minimize();
    } else if (e.animationName === "window-close") {
      setLeaving(null);
      close();
    } else if (e.animationName === "window-restore") {
      clearRestoring();
    }
  };

  const startMinimize = () => {
    if (windowRef.current) aimAtTaskbarIcon(windowRef.current);
    setLeaving("minimize");
  };

  const targetHome = homeHref || (pathname.startsWith("/admin") ? "/admin" : "/inicio");
  const isHome = pathname === targetHome;
  // Back is one real step back, like a browser. Only when there is no history (a page opened directly,
  // a new tab) does it fall back to the section's home; on the home itself it then stays disabled.
  const canGoBack = hasHistory || !isHome;
  const goBack = () => {
    if (canGoBackNow()) router.back();
    else router.push(targetHome);
  };

  return (
    <section
      ref={windowRef}
      aria-labelledby={titleId}
      className={cn(
        "aero-frame",
        maximized ? "window-max" : "window-default",
        restoring && "window-restore",
        leaving === "minimize" && "window-minimizing",
        leaving === "close" && "window-closing",
      )}
      style={dragStyle(offset, maximized)}
      onAnimationEnd={onAnimationEnd}
    >
      <header
        className="aero-titlebar"
        onDoubleClick={toggleMaximize}
        {...dragHandlers}
      >
        <span className="aero-title-icon" aria-hidden="true">
          {icon}
        </span>
        <h1 id={titleId} className="aero-title">
          {title}
        </h1>
        {/* Stop double-clicks on the buttons from reaching the title bar (toggle maximize). */}
        <div className="caption-btns" onDoubleClick={(e) => e.stopPropagation()}>
          <button type="button" className="caption-btn" aria-label="Minimizar" onClick={startMinimize}>
            <MinGlyph />
          </button>
          <button
            type="button"
            className="caption-btn"
            aria-label={maximized ? "Restaurar tamaño" : "Maximizar"}
            onClick={toggleMaximize}
          >
            <MaxGlyph />
          </button>
          <button type="button" className="caption-btn caption-btn--close" aria-label="Cerrar" onClick={() => setLeaving("close")}>
            <CloseGlyph />
          </button>
        </div>
      </header>
      <div className="aero-body">
        {(address || toolbar) && (
          <div className="win-commandbar">
            <button type="button" className="explorer-back" aria-label="Atrás" title={canGoBack ? "Atrás" : undefined} onClick={goBack} disabled={!canGoBack}>
              <BackButtonImage className="size-full" />
            </button>
            {address && (
              <nav aria-label="Ubicación" className="win-address">
                <ol className="flex min-w-0 items-center gap-1.5">
                  {address.map((segment, i) => (
                    <li key={segment} className="flex min-w-0 items-center gap-1.5">
                      {i > 0 && (
                        <span aria-hidden="true" className="text-win-muted">
                          ▸
                        </span>
                      )}
                      <span className="truncate" aria-current={i === address.length - 1 ? "page" : undefined}>
                        {segment}
                      </span>
                    </li>
                  ))}
                </ol>
              </nav>
            )}
            {toolbar}
          </div>
        )}
        {/* Like Win7 Explorer: navigation sits on the glass, content in the white client area. */}
        <div className="aero-client">
          <div className={cn("min-h-0 flex-1", scroll ? "overflow-y-auto [scrollbar-gutter:stable]" : "overflow-hidden")}>{children}</div>
          {statusBar && <footer className="win-statusbar">{statusBar}</footer>}
        </div>
      </div>
    </section>
  );
}
