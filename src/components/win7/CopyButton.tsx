"use client";

import { useEffect, useRef, useState } from "react";

type CopyState = "idle" | "ok" | "error";

interface CopyButtonProps {
  value: string;
  label?: string;
  /** What is copied, for the accessible name: "correo" → "Copiar correo". */
  object?: string;
}

export function CopyButton({ value, label = "Copiar", object }: CopyButtonProps) {
  const [state, setState] = useState<CopyState>("idle");
  const timer = useRef<ReturnType<typeof setTimeout>>(undefined);

  useEffect(() => () => clearTimeout(timer.current), []);

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(value);
      setState("ok");
    } catch {
      setState("error");
    }
    clearTimeout(timer.current);
    timer.current = setTimeout(() => setState("idle"), 2500);
  };

  return (
    <>
      <button
        type="button"
        onClick={copy}
        className="win-button"
        aria-label={state === "idle" && object ? `${label} ${object}` : undefined}
      >
        {state === "ok" ? "¡Copiado!" : state === "error" ? "No se pudo copiar" : label}
      </button>
      <span role="status" className="sr-only">
        {state === "ok" ? "Copiado al portapapeles" : state === "error" ? "No se pudo copiar; selecciona el texto manualmente" : ""}
      </span>
    </>
  );
}
