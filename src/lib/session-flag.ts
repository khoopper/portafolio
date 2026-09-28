/** localStorage key set when the visitor passes the login screen (per-viewer convenience only). */
export const ENTERED_KEY = "portfolio:entered";

/**
 * sessionStorage flag: the visitor closed every window, so the desktop stays empty on reload
 * (the welcome window does not reopen). Cleared on a new login / "Apagar"; a new visit starts fresh.
 */
const DESKTOP_EMPTY_KEY = "portfolio:desktop-empty";

export function isDesktopEmpty(): boolean {
  try {
    return sessionStorage.getItem(DESKTOP_EMPTY_KEY) !== null;
  } catch {
    return false; // Storage unavailable: behave like a first visit.
  }
}

export function setDesktopEmpty(empty: boolean): void {
  try {
    if (empty) sessionStorage.setItem(DESKTOP_EMPTY_KEY, "1");
    else sessionStorage.removeItem(DESKTOP_EMPTY_KEY);
  } catch {
    // Ignore: the welcome window will simply show again.
  }
}
