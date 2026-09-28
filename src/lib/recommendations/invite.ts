import { createHash, randomBytes } from "node:crypto";

export const INVITE_TTL_DAYS = 30;

/** Only this hash is stored: a database leak can't be turned back into working links. */
export function hashInviteToken(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}

export function generateInviteToken(): { token: string; hash: string } {
  const token = randomBytes(32).toString("base64url");
  return { token, hash: hashInviteToken(token) };
}

/** 32 random bytes in base64url are always 43 characters; anything else never reaches the database. */
export const isWellFormedToken = (token: string) => /^[A-Za-z0-9_-]{43}$/.test(token);

export type InviteStatus = "unused" | "used" | "expired" | "revoked";

export interface InviteDates {
  expires_at: string;
  used_at: string | null;
  revoked_at: string | null;
}

export function inviteStatus(invite: InviteDates, now = new Date()): InviteStatus {
  if (invite.revoked_at) return "revoked";
  if (invite.used_at) return "used";
  if (new Date(invite.expires_at) <= now) return "expired";
  return "unused";
}

export const INVITE_STATUS_LABEL: Record<InviteStatus, string> = {
  unused: "Sin usar",
  used: "Usada",
  expired: "Caducada",
  revoked: "Revocada",
};
