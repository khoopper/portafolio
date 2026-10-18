import { describe, expect, it } from "vitest";
import { addMonths, caritoToday, daysBetween, hasAccess, licenceState, memberState, parseGrant, renewedUntil, stateLabel } from "./licence";

// 2026-10-17 20:00 in El Salvador (UTC-6) is already the 18th in UTC.
const NOW = new Date("2026-10-18T02:00:00Z");
const base = { revoked_at: null, licence_forever: false, licence_until: null, trial_ends_at: null };

describe("carito licence", () => {
  it("uses El Salvador's date", () => {
    expect(caritoToday(NOW)).toBe("2026-10-17");
    expect(daysBetween("2026-10-17", "2026-11-17")).toBe(31);
  });

  it("adds months keeping the day when the month has it", () => {
    expect(addMonths("2026-01-31", 1)).toBe("2026-02-28");
    expect(addMonths("2026-10-17", 3)).toBe("2027-01-17");
    expect(addMonths("2026-12-05", 12)).toBe("2027-12-05");
  });

  it("orders the states like the app's SQL", () => {
    expect(memberState({ ...base, revoked_at: "2026-10-01T00:00:00Z", licence_forever: true }, NOW).kind).toBe("revoked");
    expect(memberState({ ...base, licence_forever: true }, NOW).kind).toBe("forever");
    expect(memberState({ ...base, licence_until: "2026-10-17" }, NOW)).toEqual({ kind: "licence", until: "2026-10-17", daysLeft: 0 });
    expect(memberState({ ...base, trial_ends_at: "2026-10-21T02:00:00Z" }, NOW)).toMatchObject({ kind: "trial", daysLeft: 3 });
    expect(memberState({ ...base, licence_until: "2026-10-16" }, NOW).kind).toBe("expired");
    expect(memberState({ ...base, trial_ends_at: "2026-10-17T00:00:00Z" }, NOW).kind).toBe("trial_ended");
    expect(memberState(base, NOW).kind).toBe("waiting");
  });

  it("a renewal counts from the end of the licence still running", () => {
    expect(renewedUntil("2026-12-01", 1, NOW)).toBe("2027-01-01");
    expect(renewedUntil("2026-09-01", 1, NOW)).toBe("2026-11-17");
    expect(renewedUntil(null, 6, NOW)).toBe("2027-04-17");
  });

  it("accepts only the offered grants", () => {
    expect(parseGrant("3", null, NOW)).toEqual({ kind: "months", months: 3 });
    expect(parseGrant("forever", null, NOW)).toEqual({ kind: "forever" });
    expect(parseGrant("date", "2026-12-24", NOW)).toEqual({ kind: "date", day: "2026-12-24" });
    expect(parseGrant("date", "2026-10-16", NOW)).toBeNull();
    expect(parseGrant("2", null, NOW)).toBeNull();
    expect(parseGrant("date", "24/12/2026", NOW)).toBeNull();
  });

  it("labels what the owner reads", () => {
    expect(stateLabel({ kind: "licence", until: "2026-11-17", daysLeft: 31 })).toBe("31 días");
    expect(stateLabel({ kind: "trial", endsAt: "", daysLeft: 1 })).toBe("Prueba · 1 día");
    expect(hasAccess({ kind: "trial_ended" })).toBe(false);
  });

  it("orders the states of a licence without an account like the app's SQL", () => {
    const licence = { revoked_at: null, licence_forever: false, licence_until: null };
    expect(licenceState({ ...licence, revoked_at: "2026-10-01T00:00:00Z", licence_forever: true }, NOW).kind).toBe("revoked");
    expect(licenceState({ ...licence, licence_forever: true }, NOW).kind).toBe("forever");
    expect(licenceState({ ...licence, licence_until: "2026-10-17" }, NOW)).toEqual({ kind: "licence", until: "2026-10-17", daysLeft: 0 });
    expect(licenceState({ ...licence, licence_until: "2026-11-17" }, NOW)).toEqual({ kind: "licence", until: "2026-11-17", daysLeft: 31 });
    expect(licenceState({ ...licence, licence_until: "2026-10-16" }, NOW).kind).toBe("expired");
    expect(licenceState(licence, NOW).kind).toBe("waiting");
  });
});
