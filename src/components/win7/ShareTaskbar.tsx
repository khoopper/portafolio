"use client";

import Link from "next/link";
import { IconFolder, Win7Icon } from "@/components/icons";
import { TrayClock } from "./TrayClock";
import { useWindowState } from "./window-state";

/** Taskbar of the shared view: one button for the project and a way into the full portfolio. */
export function ShareTaskbar({ title, href }: { title: string; href: string }) {
  const { minimized, closed, restore } = useWindowState();
  return (
    <nav aria-label="Barra de tareas" className="taskbar">
      <span className="start-orb" aria-hidden="true">
        <Win7Icon name="start-orb" className="size-full" />
      </span>
      <ul className="ml-1 flex items-center gap-1">
        <li>
          <Link
            href={href}
            aria-current={closed ? undefined : "page"}
            title={title}
            className="taskbar-btn"
            onClick={(e) => {
              if (minimized) {
                e.preventDefault();
                restore();
              }
            }}
          >
            <span className="size-7 shrink-0">
              <IconFolder className="size-full" />
            </span>
            <span className="sr-only sm:not-sr-only">{title}</span>
          </Link>
        </li>
      </ul>
      <div className="taskbar-tray ml-auto">
        <Link href="/" className="win-button text-xs">
          Ver portafolio completo
        </Link>
        <TrayClock />
      </div>
    </nav>
  );
}
