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

export const hasAccess = (state: MemberState) => state.kind === "forever" || state.kind === "licence" || state.kind === "trial";

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
