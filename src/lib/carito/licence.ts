/**
 * Carito Music licences as the admin panel sees them. Same rules as public.carito_status (the SQL the app asks), minus the phone:
 * revoked > no limit > a licence up to its last day (El Salvador's date) > the 3-day trial > ended > waiting for one.
 */

export const CARITO_TIME_ZONE = "America/El_Salvador";

export type MemberState =
  | { kind: "revoked" }
  | { kind: "forever" }
  | { kind: "licence"; until: string; daysLeft: number }
  | { kind: "trial"; endsAt: string; daysLeft: number }
  | { kind: "expired"; until: string }
  | { kind: "trial_ended" }
  | { kind: "waiting" };

export interface LicenceFields {
  revoked_at: string | null;
  licence_forever: boolean;
  licence_until: string | null;
  trial_ends_at: string | null;
}

const DAY_MS = 24 * 60 * 60 * 1000;

/** Crockford base32: sin I, L, O ni U, para que nada se lea como otra cosa (el alfabeto del SQL). */
export const CROCKFORD = "0123456789ABCDEFGHJKMNPQRSTVWXYZ";
/** Una licencia: 9 caracteres (como `^[0-9A-HJKMNP-TV-Z]{9}$`). */
export const LICENCE_CHARS = 9;
/** El código de un solo uso que vincula el teléfono del dueño con el panel. */
export const PAIRING_CHARS = 8;

/** Lo que la app manda al servidor: mayúsculas y nada más (la limpieza fina la hace el SQL). */
export function cleanCode(text: string): string {
  return text.toUpperCase().replace(/[^0-9A-Z]/g, "");
}

/** «ABC-123-XYZ»: como se dicta y se lee una licencia. */
export function formatLicenceCode(text: string): string {
  return cleanCode(text).slice(0, LICENCE_CHARS).match(/.{1,3}/g)?.join("-") ?? "";
}

/** El mensaje que se le manda al amigo (el mismo que arma la app del dueño al compartir por WhatsApp). [untilDay] ya viene escrito («17 nov 2026»). */
export function licenceMessage(name: string, code: string, untilDay: string | null): string {
  const who = name.trim() ? `${name.trim()}, tu` : "Tu";
  const length = untilDay ? `Hasta el ${untilDay}` : "Sin fecha de vencimiento";
  return `${who} licencia de Carito Music es: ${formatLicenceCode(code)}\n${length}. Escríbela en la app, donde dice «Introduce tu licencia».`;
}


/** "2026-10-17": the date in El Salvador at [now]. */
export function caritoToday(now: Date = new Date()): string {
  return new Intl.DateTimeFormat("en-CA", { timeZone: CARITO_TIME_ZONE, year: "numeric", month: "2-digit", day: "2-digit" }).format(now);
}

/** Whole days from [from] to [to], both "YYYY-MM-DD". */
export function daysBetween(from: string, to: string): number {
  return Math.round((Date.parse(`${to}T00:00:00Z`) - Date.parse(`${from}T00:00:00Z`)) / DAY_MS);
}

/** [day] plus [months], keeping the day of the month when it exists (31 Jan + 1 month = 28/29 Feb). */
export function addMonths(day: string, months: number): string {
  const [y, m, d] = day.split("-").map(Number);
  const total = m - 1 + months;
  const year = y + Math.floor(total / 12);
  const month = ((total % 12) + 12) % 12;
  const last = new Date(Date.UTC(year, month + 1, 0)).getUTCDate();
  return `${year}-${String(month + 1).padStart(2, "0")}-${String(Math.min(d, last)).padStart(2, "0")}`;
}

export function memberState(member: LicenceFields, now: Date = new Date()): MemberState {
  const today = caritoToday(now);
  if (member.revoked_at) return { kind: "revoked" };
  if (member.licence_forever) return { kind: "forever" };
  if (member.licence_until && member.licence_until >= today) {
    return { kind: "licence", until: member.licence_until, daysLeft: daysBetween(today, member.licence_until) };
  }
  if (member.trial_ends_at && Date.parse(member.trial_ends_at) > now.getTime()) {
    return { kind: "trial", endsAt: member.trial_ends_at, daysLeft: Math.ceil((Date.parse(member.trial_ends_at) - now.getTime()) / DAY_MS) };
  }
  if (member.licence_until) return { kind: "expired", until: member.licence_until };
  if (member.trial_ends_at) return { kind: "trial_ended" };
  return { kind: "waiting" };
}

/**
 * Las licencias sin cuenta, como las ve el panel. Mismas reglas que `public.carito_licence_status` (el SQL que responde
 * a la app): revocada > sin límite > hasta su último día (fecha de El Salvador) > vencida.
 */
export type LicenceState =
  | { kind: "revoked" }
  | { kind: "forever" }
  | { kind: "licence"; until: string; daysLeft: number }
  | { kind: "expired"; until: string }
  | { kind: "waiting" };

/** Lo que decide el estado de una licencia sin cuenta (aquí no hay prueba de 3 días). */
export interface LicenceStateFields {
  revoked_at: string | null;
  licence_until: string | null;
  licence_forever: boolean;
}

export function licenceState(fields: LicenceStateFields, now: Date = new Date()): LicenceState {
  if (fields.revoked_at) return { kind: "revoked" };
  if (fields.licence_forever) return { kind: "forever" };
  const today = caritoToday(now);
  if (fields.licence_until && fields.licence_until >= today) {
    return { kind: "licence", until: fields.licence_until, daysLeft: daysBetween(today, fields.licence_until) };
  }
  if (fields.licence_until) return { kind: "expired", until: fields.licence_until };
  return { kind: "waiting" };
}

export const hasAccess = (state: MemberState) => state.kind === "forever" || state.kind === "licence" || state.kind === "trial";

export const licenceHasAccess = (state: LicenceState) => state.kind === "forever" || state.kind === "licence";

/**
 * The last day of a licence given for [months]: counted from the end of the licence still running (a renewal adds), otherwise
 * from today.
 */
export function renewedUntil(current: string | null, months: number, now: Date = new Date()): string {
  const today = caritoToday(now);
  return addMonths(current && current >= today ? current : today, months);
}

export type Grant = { kind: "months"; months: 1 | 3 | 6 | 12 } | { kind: "date"; day: string } | { kind: "forever" };

/** Reads the grant dialog: null when it is not one of the offered choices or the date is not today or later. */
export function parseGrant(mode: unknown, day: unknown, now: Date = new Date()): Grant | null {
  if (mode === "forever") return { kind: "forever" };
  if (mode === "date") {
    if (typeof day !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(day) || Number.isNaN(Date.parse(`${day}T00:00:00Z`))) return null;
    return day >= caritoToday(now) ? { kind: "date", day } : null;
  }
  const months = Number(mode);
  return months === 1 || months === 3 || months === 6 || months === 12 ? { kind: "months", months } : null;
}

const plural = (n: number, one: string, many: string) => `${n} ${n === 1 ? one : many}`;

export function stateLabel(state: MemberState): string {
  switch (state.kind) {
    case "revoked":
      return "Revocada";
    case "forever":
      return "Sin límite";
    case "licence":
      return state.daysLeft === 0 ? "Último día" : `${plural(state.daysLeft, "día", "días")}`;
    case "trial":
      return `Prueba · ${plural(state.daysLeft, "día", "días")}`;
    case "expired":
      return "Vencida";
    case "trial_ended":
      return "Prueba terminada";
    case "waiting":
      return "Sin licencia";
  }
}
