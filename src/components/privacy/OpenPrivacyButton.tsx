"use client";

import { openPrivacyCenter } from "@/lib/consent";

export function OpenPrivacyButton({ className = "win-button", children = "Preferencias de privacidad" }: { className?: string; children?: string }) {
  return (
    <button type="button" className={className} onClick={openPrivacyCenter}>
      {children}
    </button>
  );
}
