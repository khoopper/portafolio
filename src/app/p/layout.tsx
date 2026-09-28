import type { ReactNode } from "react";
import { WindowStateProvider } from "@/components/win7/window-state";

/** Focused desktop for a shared project: wallpaper + one window, no login, gadgets or icons. */
export default function ShareLayout({ children }: { children: ReactNode }) {
  return (
    <WindowStateProvider>
      <div className="wallpaper" aria-hidden="true" />
      <main id="contenido" className="desktop-main">
        {children}
      </main>
    </WindowStateProvider>
  );
}
