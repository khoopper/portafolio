// Same-origin history awareness for the window's Back button. The Navigation API only counts entries of
// this site (a page we were opened from on another site does not count); older browsers fall back to
// history.length, which can also include external pages.
interface NavigationLike extends EventTarget {
  canGoBack: boolean;
}

const nav = (): NavigationLike | undefined => (typeof window === "undefined" ? undefined : (window as unknown as { navigation?: NavigationLike }).navigation);

export function canGoBackNow(): boolean {
  const n = nav();
  return n ? n.canGoBack : typeof history !== "undefined" && history.length > 1;
}

export function subscribeHistory(onChange: () => void): () => void {
  const n = nav();
  n?.addEventListener("currententrychange", onChange);
  window.addEventListener("popstate", onChange);
  return () => {
    n?.removeEventListener("currententrychange", onChange);
    window.removeEventListener("popstate", onChange);
  };
}
