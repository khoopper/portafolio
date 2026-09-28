export const EVENT_KINDS = ["view", "cv", "demo", "repo", "contact"] as const;
export type EventKind = (typeof EVENT_KINDS)[number];

export interface ParsedEvent {
  kind: EventKind;
  path: string;
  projectSlug: string | null;
}

// Pages that are never measured: private areas, auth flows, invitation links (secret token), internals.
const IGNORED = /^\/(admin|api|auth|r|p|brand|_next)(\/|$)/;
const PATH = /^\/[A-Za-z0-9\-._~/%]*$/;
const PROJECT_PATH = /^\/proyectos\/([a-z0-9]+(?:-[a-z0-9]+)*)$/;
const SLUG = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

/** Validates the beacon body. Anything unexpected returns null (dropped silently: this is only statistics). */
export function parseEvent(raw: unknown): ParsedEvent | null {
  if (typeof raw !== "object" || raw === null) return null;
  const { kind, path, project } = raw as Record<string, unknown>;
  if (typeof kind !== "string" || !(EVENT_KINDS as readonly string[]).includes(kind)) return null;
  if (typeof path !== "string" || path.length > 200) return null;

  // Query string and hash never reach the database (they can carry tokens).
  const clean = path.split(/[?#]/)[0].replace(/(.)\/+$/, "$1");
  if (!PATH.test(clean) || clean.length > 200 || IGNORED.test(clean)) return null;

  const fromPath = PROJECT_PATH.exec(clean)?.[1] ?? null;
  const fromBody = typeof project === "string" && project.length <= 80 && SLUG.test(project) ? project : null;
  return { kind: kind as EventKind, path: clean, projectSlug: fromBody ?? fromPath };
}
