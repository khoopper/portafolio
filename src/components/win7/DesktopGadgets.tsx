"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState, useSyncExternalStore, type FormEvent } from "react";
import { IconInternet, Win7Icon } from "@/components/icons";
import { cn } from "@/lib/cn";
import { searchPortfolio, type SearchItem } from "@/lib/search";
import { useWindowState } from "./window-state";

/* One shared 1 s ticker for every gadget; null on the server (no hydration mismatch). */
function subscribeSecond(onTick: () => void) {
  const id = setInterval(onTick, 1000);
  return () => clearInterval(id);
}
const useNow = () => useSyncExternalStore(subscribeSecond, () => Math.floor(Date.now() / 1000), () => null);

/**
 * The Win7 desktop gadgets. They live under the window (like the real sidebar): always on wide
 * screens, and on any screen once the window is closed or minimized.
 */
export function DesktopGadgets({ index }: { index: SearchItem[] }) {
  const { minimized, maximized } = useWindowState();
  // The empty desktop always shows its gadgets (on any screen size).
  const onDesktop = usePathname() === "/escritorio";
  if (maximized && !minimized && !onDesktop) return null;
  return (
    <aside aria-label="Gadgets de escritorio" className={cn("gadgets", (minimized || onDesktop) && "gadgets--visible")}>
      <SearchGadget index={index} />
      <ClockGadget />
    </aside>
  );
}

const SECTION_ICONS: Record<string, string> = {
  "/inicio": "computer",
  "/proyectos": "folder",
  "/recomendaciones": "shield-ok",
  "/tecnologias": "control-panel",
  "/sobre-mi": "user",
  "/contacto": "mail",
};
const iconFor = (item: SearchItem) =>
  item.kind === "section"
    ? SECTION_ICONS[item.href] ?? "folder"
    : { project: "folder", tech: "properties", document: "document", contact: item.external ? "internet" : "mail" }[item.kind];

function SearchGadget({ index }: { index: SearchItem[] }) {
  const { minimized, restore } = useWindowState();
  const [query, setQuery] = useState("");
  const results = searchPortfolio(index, query);
  const q = query.trim();
  const webSearch = () => window.open(`https://www.google.com/search?q=${encodeURIComponent(q)}`, "_blank", "noopener,noreferrer");

  // Enter opens the first result, like the Start menu search box (the web search row when
  // nothing matches). Clicking the rendered element keeps Link / download / new-tab behavior.
  const submit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (q) e.currentTarget.querySelector<HTMLElement>(".gadget-result")?.click();
  };

  return (
    <form role="search" className="gadget" onSubmit={submit}>
      <p className="gadget-title">
        <Win7Icon name="computer" className="size-5" />
        Búsqueda
      </p>
      <div className="gadget-field">
        <input
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Proyectos, CV, React…"
          aria-label="Buscar en el portafolio"
          aria-controls="gadget-results"
          className="min-w-0 flex-1 bg-transparent px-2 text-sm outline-none"
        />
        <button type="submit" className="gadget-go" aria-label="Buscar">
          <svg viewBox="0 0 16 16" className="size-4" aria-hidden="true">
            <circle cx="6.5" cy="6.5" r="4.2" fill="none" stroke="#4a5b70" strokeWidth="1.8" />
            <path d="M9.8 9.8l4 4" stroke="#4a5b70" strokeWidth="2.2" strokeLinecap="round" />
          </svg>
        </button>
      </div>
      {q && (
        <ul id="gadget-results" className="gadget-results" aria-live="polite">
          {results.map((item) => {
            const body = (
              <>
                <Win7Icon name={iconFor(item)} className="size-6 shrink-0" />
                <span className="min-w-0">
                  <span className="block truncate">{item.label}</span>
                  {item.hint && <span className="block truncate text-xs text-win-muted">{item.hint}</span>}
                </span>
              </>
            );
            return (
              <li key={`${item.kind}-${item.href}-${item.label}`}>
                {item.external || item.download || item.href.startsWith("mailto:") ? (
                  <a
                    href={item.href}
                    className="gadget-result"
                    download={item.download || undefined}
                    {...(item.external ? { target: "_blank", rel: "noopener noreferrer" } : {})}
                  >
                    {body}
                  </a>
                ) : (
                  // Same-page result while the window is closed: the URL won't change, so reopen it here.
                  <Link href={item.href} className="gadget-result" onClick={() => minimized && restore()}>
                    {body}
                  </Link>
                )}
              </li>
            );
          })}
          <li>
            <button type="button" className="gadget-result w-full" onClick={webSearch}>
              <IconInternet className="size-6 shrink-0" />
              <span className="min-w-0 truncate text-left">Buscar «{q}» en Internet</span>
            </button>
          </li>
        </ul>
      )}
    </form>
  );
}

/** The Win7 clock gadget: white face, black hands, red second hand. */
function ClockGadget() {
  const now = useNow();
  const d = now === null ? null : new Date(now * 1000);
  const s = d?.getSeconds() ?? 0;
  const m = (d?.getMinutes() ?? 0) + s / 60;
  const h = ((d?.getHours() ?? 0) % 12) + m / 60;
  const hand = (deg: number, len: number, width: number, color: string) => (
    <line x1="50" y1="50" x2="50" y2={50 - len} stroke={color} strokeWidth={width} strokeLinecap="round" transform={`rotate(${deg} 50 50)`} />
  );
  return (
    <div className="gadget-clock" role="img" aria-label={d ? `Reloj: ${d.toLocaleTimeString("es")}` : "Reloj"}>
      <svg viewBox="0 0 100 100" className="size-full">
        <defs>
          <radialGradient id="clock-face" cx="50%" cy="38%" r="65%">
            <stop offset="0" stopColor="#ffffff" />
            <stop offset="1" stopColor="#dfe6ee" />
          </radialGradient>
          <linearGradient id="clock-rim" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor="#6b7a8c" />
            <stop offset="1" stopColor="#1d2733" />
          </linearGradient>
        </defs>
        <circle cx="50" cy="50" r="48" fill="url(#clock-rim)" />
        <circle cx="50" cy="50" r="44" fill="url(#clock-face)" />
        {Array.from({ length: 60 }, (_, i) => (
          <line key={i} x1="50" y1="9" x2="50" y2={i % 5 ? 11 : 14} stroke="#2b333d" strokeWidth={i % 5 ? 0.8 : 2} transform={`rotate(${i * 6} 50 50)`} />
        ))}
        {d && (
          <>
            {hand(h * 30, 22, 3.4, "#1c232b")}
            {hand(m * 6, 32, 2.4, "#1c232b")}
            {hand(s * 6, 36, 1, "#d62b1f")}
          </>
        )}
        <circle cx="50" cy="50" r="2.6" fill="#d62b1f" />
        {/* glass reflection */}
        <path d="M14 42a37 37 0 0 1 72 0c-20-9-52-9-72 0z" fill="#fff" opacity=".35" />
      </svg>
    </div>
  );
}
