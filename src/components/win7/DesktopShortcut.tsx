"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useWindowState } from "./window-state";

const HREF = "/recomendaciones";

/** Desktop icon for the client recommendations window. */
export function DesktopShortcut({ logoSrc }: { logoSrc: string }) {
  const pathname = usePathname();
  const { minimized, restore } = useWindowState();
  return (
    // Same route while minimized: the URL won't change, so reopen the window here.
    <Link href={HREF} className="desktop-shortcut" onClick={() => pathname === HREF && minimized && restore()}>
      <span className="relative block size-12">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={logoSrc} alt="" width={48} height={48} loading="eager" decoding="sync" fetchPriority="high" className="size-12 rounded-md object-cover shadow-lg" draggable={false} />
        {/* The little Win7 shortcut arrow */}
        <svg viewBox="0 0 16 16" className="absolute -bottom-0.5 -left-0.5 size-4" aria-hidden="true">
          <rect x="0.5" y="0.5" width="15" height="15" rx="1" fill="#fff" stroke="#8a95a3" />
          <path d="M4 12c0-4 2-6 6-6V4l3.5 3.5L10 11V9c-3 0-4.6 1-6 3z" fill="#2a7fd4" />
        </svg>
      </span>
      <span className="desktop-shortcut-label">Recomendaciones</span>
    </Link>
  );
}
