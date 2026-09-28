"use client";

import { useRef, useState, type KeyboardEvent, type ReactNode } from "react";
import { cn } from "@/lib/cn";

export interface TabDef {
  id: string;
  label: string;
  content: ReactNode;
}

/**
 * fixedHeight: every panel takes the height of the tallest one, like a Win7 property sheet,
 * so switching tabs never moves the buttons below.
 */
export function Tabs({ label, tabs, fixedHeight = false }: { label: string; tabs: TabDef[]; fixedHeight?: boolean }) {
  const [active, setActive] = useState(tabs[0]?.id);
  const tabRefs = useRef<(HTMLButtonElement | null)[]>([]);

  const onKeyDown = (e: KeyboardEvent<HTMLButtonElement>, index: number) => {
    const delta = e.key === "ArrowRight" ? 1 : e.key === "ArrowLeft" ? -1 : 0;
    if (!delta) return;
    e.preventDefault();
    const next = (index + delta + tabs.length) % tabs.length;
    setActive(tabs[next].id);
    tabRefs.current[next]?.focus();
  };

  return (
    <div>
      <div role="tablist" aria-label={label} className="flex flex-wrap items-end relative z-10 -mb-[1px] pl-0">
        {tabs.map((tab, i) => (
          <button
            key={tab.id}
            ref={(el) => {
              tabRefs.current[i] = el;
            }}
            type="button"
            role="tab"
            id={`tab-${tab.id}`}
            aria-selected={active === tab.id}
            aria-controls={`panel-${tab.id}`}
            tabIndex={active === tab.id ? 0 : -1}
            className="win-tab"
            onClick={() => setActive(tab.id)}
            onKeyDown={(e) => onKeyDown(e, i)}
          >
            {tab.label}
          </button>
        ))}
      </div>
      <div className={fixedHeight ? "grid" : undefined}>
        {tabs.map((tab) => (
          <div
            key={tab.id}
            role="tabpanel"
            id={`panel-${tab.id}`}
            aria-labelledby={`tab-${tab.id}`}
            hidden={!fixedHeight && active !== tab.id}
            tabIndex={0}
            // Inactive panels stay in the grid cell (sizing it) but are invisible and unreachable.
            className={cn("win-tabpanel", fixedHeight && "[grid-area:1/1]", fixedHeight && active !== tab.id && "invisible")}
          >
            {tab.content}
          </div>
        ))}
      </div>
    </div>
  );
}
