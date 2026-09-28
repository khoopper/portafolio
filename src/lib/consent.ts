import { useMemo, useSyncExternalStore } from "react";

/** localStorage key with the visitor's privacy choices (JSON, see parseConsent). */
export const CONSENT_KEY = "portfolio:consent";

/** Bump when a category or its purpose changes: everyone is asked again. (2: Google Analytics added.) */
export const CONSENT_VERSION = 2;

/** A choice is asked again after 12 months (GDPR guidance: consent should not last forever). */
const MAX_AGE_MS = 365 * 24 * 60 * 60 * 1000;

const CHANGE_EVENT = "portfolio:consent-change";
const OPEN_EVENT = "portfolio:privacy-open";

/** What the visitor allowed. `media`: YouTube/Vimeo players. `analytics`: Google Analytics. Necessary storage is always on. */
export interface Consent {
  media: boolean;
  analytics: boolean;
}

export const DENY_ALL: Consent = { media: false, analytics: false };
export const ALLOW_ALL: Consent = { media: true, analytics: true };

/** Pure: turns the stored string into a decision. Anything malformed, old or expired counts as "never chose". */
export function parseConsent(raw: string | null, now: number): Consent | null {
  if (!raw) return null;
  try {
    const data: unknown = JSON.parse(raw);
    if (typeof data !== "object" || data === null) return null;
    const { v, media, analytics, at } = data as Record<string, unknown>;
    if (v !== CONSENT_VERSION || typeof media !== "boolean" || typeof analytics !== "boolean" || typeof at !== "number") return null;
    if (at > now || now - at > MAX_AGE_MS) return null;
    return { media, analytics };
  } catch {
    return null;
  }
}

export function serializeConsent(consent: Consent, now: number): string {
  return JSON.stringify({ v: CONSENT_VERSION, media: consent.media, analytics: consent.analytics, at: now });
}

function readRaw(): string | null {
  try {
    return localStorage.getItem(CONSENT_KEY);
  } catch {
    return null; // Storage blocked: behave like a visitor who never chose (everything optional stays off).
  }
}

/** Remembers the choice and tells every open component. Withdrawing = saving `false`s. */
export function saveConsent(consent: Consent): void {
  try {
    localStorage.setItem(CONSENT_KEY, serializeConsent(consent, Date.now()));
  } catch {
    // Storage blocked: the choice only lasts for this page load.
  }
  window.dispatchEvent(new Event(CHANGE_EVENT));
}

/** Opens the privacy center (tray icon, Start menu, legal pages). */
export function openPrivacyCenter(): void {
  window.dispatchEvent(new Event(OPEN_EVENT));
}

export function onPrivacyCenterOpen(handler: () => void): () => void {
  window.addEventListener(OPEN_EVENT, handler);
  return () => window.removeEventListener(OPEN_EVENT, handler);
}

function subscribe(onChange: () => void) {
  window.addEventListener(CHANGE_EVENT, onChange);
  window.addEventListener("storage", onChange); // another tab changed it
  return () => {
    window.removeEventListener(CHANGE_EVENT, onChange);
    window.removeEventListener("storage", onChange);
  };
}

// The snapshot is a primitive string ("10" = media yes, analytics no), so React sees a stable value between renders.
const snapshot = (): string | null => {
  const c = parseConsent(readRaw(), Date.now());
  return c ? `${c.media ? 1 : 0}${c.analytics ? 1 : 0}` : null;
};

/** undefined on the server and during hydration (show nothing yet); null = never chose; otherwise the decision. */
export function useConsent(): Consent | null | undefined {
  const code = useSyncExternalStore(subscribe, snapshot, () => undefined);
  return useMemo(() => (code === undefined ? undefined : code === null ? null : { media: code[0] === "1", analytics: code[1] === "1" }), [code]);
}

/** Keeps the analytics choice and changes only the media one (the video placeholder's «Permitir siempre»). */
export function allowMedia(): void {
  saveConsent({ media: true, analytics: parseConsent(readRaw(), Date.now())?.analytics ?? false });
}
