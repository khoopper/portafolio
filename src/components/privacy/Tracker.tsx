"use client";

import { usePathname } from "next/navigation";
import { useEffect, useRef } from "react";
import type { EventKind } from "@/lib/analytics/event";

/** Nothing is stored in the browser and Do Not Track / Global Privacy Control switch this off. */
function optedOut(): boolean {
  const nav = navigator as Navigator & { globalPrivacyControl?: boolean };
  return navigator.doNotTrack === "1" || nav.globalPrivacyControl === true;
}

function send(kind: EventKind, path: string, project?: string) {
  const body = JSON.stringify({ kind, path, project });
  try {
    if (navigator.sendBeacon?.("/api/t", new Blob([body], { type: "application/json" }))) return;
    void fetch("/api/t", { method: "POST", body, keepalive: true, headers: { "Content-Type": "application/json" } });
  } catch {
    // Statistics never get in the way.
  }
}

function clickKind(target: HTMLElement): EventKind | null {
  if (target.closest('[data-track="demo"]')) return "demo";
  const link = target.closest<HTMLAnchorElement>("a[href]");
  if (!link) return null;
  if (link.hasAttribute("download") || /\/api\/cv(\?|$)|\.pdf$/i.test(link.pathname)) return "cv";
  if (/^mailto:/i.test(link.href) || /(^|\.)wa\.me$|(^|\.)linkedin\.com$/i.test(link.hostname)) return "contact";
  if (/(^|\.)github\.com$/i.test(link.hostname)) return "repo";
  return null;
}

/** Counts page views and a few key clicks (CV, demo, repository, contact) for the admin dashboard. */
export function Tracker() {
  const pathname = usePathname();
  const last = useRef<string | null>(null);

  useEffect(() => {
    if (last.current === pathname || pathname.startsWith("/admin") || optedOut()) return;
    last.current = pathname;
    send("view", pathname);
  }, [pathname]);

  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      if (!(e.target instanceof HTMLElement) || optedOut()) return;
      const kind = clickKind(e.target);
      if (!kind) return;
      const path = location.pathname;
      send(kind, path, /^\/proyectos\/([^/]+)$/.exec(path)?.[1]);
    };
    document.addEventListener("click", onClick, { capture: true, passive: true });
    return () => document.removeEventListener("click", onClick, { capture: true });
  }, []);

  return null;
}
