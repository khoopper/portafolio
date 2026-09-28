"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useRef, type RefObject } from "react";
import { Avatar } from "@/components/Avatar";
import { openPrivacyCenter } from "@/lib/consent";
import { ENTERED_KEY, setDesktopEmpty } from "@/lib/session-flag";
import type { NavItem } from "./site-nav";
import { useWindowState } from "./window-state";

export interface StartMenuData {
  name: string;
  avatar: string | null;
  featured: { slug: string; title: string }[];
  cvUrl: string | null;
  githubUrl: string | null;
  linkedinUrl: string | null;
  email: string;
}

interface StartMenuProps {
  open: boolean;
  onClose: (returnFocus: boolean) => void;
  orbRef: RefObject<HTMLButtonElement | null>;
  items: NavItem[];
  data: StartMenuData;
}

export function StartMenu({ open, onClose, orbRef, items, data }: StartMenuProps) {
  const ref = useRef<HTMLDivElement>(null);
  const router = useRouter();
  const pathname = usePathname();
  const { minimized, restore } = useWindowState();

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

  const shutdown = () => {
    try {
      localStorage.removeItem(ENTERED_KEY);
      setDesktopEmpty(false);
    } catch {
      // Storage unavailable (private mode): the login screen simply shows again.
    }
    onClose(false);
    router.push("/");
  };

  // Same-route links don't change the URL, so the window-state provider won't un-minimize: do it here.
  const go = (href: string) => {
    onClose(false);
    if (minimized && href.split("#")[0] === pathname) restore();
  };

  const external = { target: "_blank", rel: "noopener noreferrer" } as const;

  return (
    <div id="start-menu" ref={ref} role="dialog" aria-label="Menú Inicio" className="start-menu">
      <div className="start-left">
        <ul>
          {items.map((item) => (
            <li key={item.href}>
              <Link href={item.href} prefetch={true} className="start-item" onClick={() => go(item.href)}>
                <span className="size-8 shrink-0">{item.icon}</span>
                <span className="min-w-0">
                  <span className="block">{item.label}</span>
                  <span className="block text-xs text-win-muted">{item.description}</span>
                </span>
              </Link>
            </li>
          ))}
        </ul>
        {data.featured.length > 0 && (
          <>
            <p className="start-heading">Proyectos destacados</p>
            <ul>
              {data.featured.map((p) => (
                <li key={p.slug}>
                  <Link href={`/proyectos/${p.slug}`} prefetch={true} className="start-item text-sm" onClick={() => go(`/proyectos/${p.slug}`)}>
                    {p.title}
                  </Link>
                </li>
              ))}
            </ul>
          </>
        )}
      </div>
      <div className="start-right">
        <Avatar src={data.avatar} name={data.name} size={56} className="mx-2" />
        <p className="start-name">{data.name}</p>
        <ul>
          {data.cvUrl && (
            <li>
              <a href={data.cvUrl} download className="start-link">
                Descargar CV
              </a>
            </li>
          )}
          {data.githubUrl && (
            <li>
              <a href={data.githubUrl} className="start-link" {...external}>
                GitHub
              </a>
            </li>
          )}
          {data.linkedinUrl && (
            <li>
              <a href={data.linkedinUrl} className="start-link" {...external}>
                LinkedIn
              </a>
            </li>
          )}
          <li>
            <a href={`mailto:${data.email}`} className="start-link">
              Enviar correo
            </a>
          </li>
          <li>
            <Link href="/legal/privacidad" className="start-link" onClick={() => go("/legal/privacidad")}>
              Privacidad y legal
            </Link>
          </li>
          <li>
            <button
              type="button"
              className="start-link w-full text-left"
              onClick={() => {
                onClose(false);
                openPrivacyCenter();
              }}
            >
              Preferencias de privacidad
            </button>
          </li>
        </ul>
        <button type="button" className="win-button start-shutdown mx-2 mt-3" onClick={shutdown}>
          Apagar
        </button>
      </div>
    </div>
  );
}
