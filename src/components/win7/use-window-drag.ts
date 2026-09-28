"use client";

import { useRef, type PointerEvent, type RefObject } from "react";

export interface Offset {
  x: number;
  y: number;
}

/**
 * Title-bar drag for a window (desktop widths only). Moves the element directly while dragging
 * so the window content is not re-rendered on every pointer move; `onDrop` gets the final offset.
 */
export function useWindowDrag(ref: RefObject<HTMLElement | null>, offset: Offset, onDrop: (o: Offset) => void, enabled = true) {
  const drag = useRef<{ x: number; y: number; ox: number; oy: number; left: number; top: number; width: number } | null>(null);

  const next = (e: PointerEvent<HTMLElement>): Offset | null => {
    const d = drag.current;
    if (!d) return null;
    // Keep part of the title bar on screen, as Windows does.
    return {
      x: Math.min(Math.max(d.ox + e.clientX - d.x, 120 - d.left - d.width), window.innerWidth - 120 - d.left),
      y: Math.min(Math.max(d.oy + e.clientY - d.y, -d.top), window.innerHeight - 90 - d.top),
    };
  };

  return {
    onPointerDown(e: PointerEvent<HTMLElement>) {
      const el = ref.current;
      if (!el || !enabled || e.button !== 0 || (e.target as HTMLElement).closest("button, a")) return;
      if (!window.matchMedia("(min-width: 768px)").matches) return;
      const r = el.getBoundingClientRect();
      drag.current = { x: e.clientX, y: e.clientY, ox: offset.x, oy: offset.y, left: r.left - offset.x, top: r.top - offset.y, width: r.width };
      e.currentTarget.setPointerCapture(e.pointerId);
    },
    onPointerMove(e: PointerEvent<HTMLElement>) {
      const pos = next(e);
      if (pos && ref.current) ref.current.style.translate = `${pos.x}px ${pos.y}px`;
    },
    onPointerUp(e: PointerEvent<HTMLElement>) {
      const pos = next(e);
      drag.current = null;
      if (pos) onDrop(pos);
    },
    onPointerCancel() {
      drag.current = null;
      if (ref.current) ref.current.style.translate = dragStyle(offset)?.translate ?? "";
    },
  };
}

/** Inline style for a dragged window; nothing when it sits in its default spot. */
export const dragStyle = (o: Offset, off = false) => (off || (!o.x && !o.y) ? undefined : { translate: `${o.x}px ${o.y}px` });
