"use client";

import { usePathname, useRouter } from "next/navigation";
import { setDesktopEmpty } from "@/lib/session-flag";
import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from "react";

interface WindowState {
  /** The window is off the desktop: minimized to the taskbar or closed. */
  minimized: boolean;
  /** Closed with the X (the taskbar button is no longer highlighted). */
  closed: boolean;
  maximized: boolean;
  restoring: boolean;
  /** Dragged position (px from the centered spot); survives navigation like a real window. */
  offset: { x: number; y: number };
  minimize(): void;
  close(): void;
  restore(): void;
  toggleMaximize(): void;
  clearRestoring(): void;
  setOffset(offset: { x: number; y: number }): void;
}

const WindowStateContext = createContext<WindowState | null>(null);

/**
 * `desktopHref`: the empty-desktop route. When set (public site), closing a window goes back to it and
 * the desktop stays empty on reload, like a real desktop. Admin and the shared view have none.
 */
export function WindowStateProvider({ children, desktopHref }: { children: ReactNode; desktopHref?: string }) {
  const pathname = usePathname();
  const router = useRouter();
  const [hidden, setHidden] = useState<null | "minimized" | "closed">(null);
  const [maximized, setMaximized] = useState(false);
  const [restoring, setRestoring] = useState(false);
  const [offset, setOffset] = useState({ x: 0, y: 0 });

  // Any route change reopens the window (render-time state adjustment, no effect).
  const [prevPath, setPrevPath] = useState(pathname);
  if (prevPath !== pathname) {
    setPrevPath(pathname);
    setHidden(null);
  }

  const minimize = useCallback(() => setHidden("minimized"), []);
  const close = useCallback(() => {
    setHidden("closed");
    if (!desktopHref) return;
    setDesktopEmpty(true);
    // replace: closing a window is not a page you can go "back" to.
    if (pathname !== desktopHref) router.replace(desktopHref);
  }, [desktopHref, pathname, router]);
  const restore = useCallback(() => {
    setHidden(null);
    setRestoring(true);
  }, []);
  const toggleMaximize = useCallback(() => setMaximized((m) => !m), []);
  const clearRestoring = useCallback(() => setRestoring(false), []);

  const value = useMemo(
    () => ({
      minimized: hidden !== null,
      closed: hidden === "closed",
      maximized,
      restoring,
      offset,
      minimize,
      close,
      restore,
      toggleMaximize,
      clearRestoring,
      setOffset,
    }),
    [hidden, maximized, restoring, offset, minimize, close, restore, toggleMaximize, clearRestoring],
  );

  return <WindowStateContext.Provider value={value}>{children}</WindowStateContext.Provider>;
}

export function useWindowState(): WindowState {
  const value = useContext(WindowStateContext);
  if (!value) throw new Error("useWindowState must be used inside <WindowStateProvider>");
  return value;
}
