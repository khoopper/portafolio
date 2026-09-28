import { describe, expect, it } from "vitest";
import { generateInviteToken, hashInviteToken, inviteStatus, isWellFormedToken } from "./invite";

describe("tokens de invitación", () => {
  it("genera tokens base64url de 43 caracteres y su hash sha256", () => {
    const { token, hash } = generateInviteToken();
    expect(isWellFormedToken(token)).toBe(true);
    expect(hash).toMatch(/^[0-9a-f]{64}$/);
    expect(hashInviteToken(token)).toBe(hash);
  });

  it("cada token es distinto", () => {
    expect(generateInviteToken().token).not.toBe(generateInviteToken().token);
  });

  it("rechaza tokens mal formados", () => {
    for (const bad of ["", "abc", "a".repeat(44), `${"a".repeat(42)}!`, "../../etc/passwd"]) {
      expect(isWellFormedToken(bad)).toBe(false);
    }
  });
});

describe("inviteStatus", () => {
  const now = new Date("2026-09-28T12:00:00Z");
  const base = { expires_at: "2026-10-28T12:00:00Z", used_at: null, revoked_at: null };

  it("sin usar", () => expect(inviteStatus(base, now)).toBe("unused"));
  it("usada", () => expect(inviteStatus({ ...base, used_at: "2026-09-28T11:00:00Z" }, now)).toBe("used"));
  it("caducada justo al vencer", () => expect(inviteStatus({ ...base, expires_at: "2026-09-28T12:00:00Z" }, now)).toBe("expired"));
  it("revocada gana a todo", () =>
    expect(inviteStatus({ ...base, used_at: "2026-09-28T11:00:00Z", revoked_at: "2026-09-28T11:30:00Z" }, now)).toBe("revoked"));
});
