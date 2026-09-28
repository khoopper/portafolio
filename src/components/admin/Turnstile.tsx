"use client";

import Script from "next/script";
import { useEffect, useRef, useState } from "react";

interface TurnstileApi {
  render(el: HTMLElement, options: Record<string, unknown>): string;
  reset(widgetId: string): void;
  remove(widgetId: string): void;
}
declare global {
  interface Window {
    turnstile?: TurnstileApi;
  }
}

/**
 * Cloudflare Turnstile anti-bot check. The widget adds a hidden `cf-turnstile-response` input to the
 * surrounding form; Supabase Auth verifies that token server-side. `resetKey` changes after each attempt
 * because a token can only be used once.
 */
export function Turnstile({ siteKey, resetKey }: { siteKey: string; resetKey: unknown }) {
  const container = useRef<HTMLDivElement>(null);
  const widget = useRef<string | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    if (!ready || !container.current || widget.current || !window.turnstile) return;
    widget.current = window.turnstile.render(container.current, { sitekey: siteKey, language: "es", theme: "light" });
    return () => {
      if (widget.current) window.turnstile?.remove(widget.current);
      widget.current = null;
    };
  }, [ready, siteKey]);

  useEffect(() => {
    if (widget.current) window.turnstile?.reset(widget.current);
  }, [resetKey]);

  return (
    <>
      <Script src="https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit" strategy="afterInteractive" onReady={() => setReady(true)} />
      <div ref={container} className="mt-3 min-h-[65px]" />
    </>
  );
}
