import type { ReactNode } from "react";

export function ExplorerLayout({ nav, children }: { nav: ReactNode; children: ReactNode }) {
  return (
    <div className="flex h-full">
      <nav aria-label="Panel de navegación" className="win-navpane hidden w-56 shrink-0 overflow-y-auto md:block">
        {nav}
      </nav>
      <div className="min-w-0 flex-1 overflow-y-auto p-5 [scrollbar-gutter:stable]">{children}</div>
    </div>
  );
}
