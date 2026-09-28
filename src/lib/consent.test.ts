import { describe, expect, it } from "vitest";
import { ALLOW_ALL, CONSENT_VERSION, DENY_ALL, parseConsent, serializeConsent } from "@/lib/consent";

const NOW = Date.UTC(2026, 8, 29);
const DAY = 24 * 60 * 60 * 1000;

describe("parseConsent", () => {
  it("round-trips every combination", () => {
    for (const c of [ALLOW_ALL, DENY_ALL, { media: true, analytics: false }, { media: false, analytics: true }]) {
      expect(parseConsent(serializeConsent(c, NOW), NOW)).toEqual(c);
    }
  });

  it("treats a missing value as never chose", () => {
    expect(parseConsent(null, NOW)).toBeNull();
    expect(parseConsent("", NOW)).toBeNull();
  });

  it("ignores garbage and wrong shapes", () => {
    for (const raw of ["nope", "null", "[]", '{"v":2}', '{"v":2,"media":"yes","analytics":true,"at":1}', '{"v":2,"media":true,"analytics":true,"at":"x"}', '{"v":2,"media":true,"at":1}']) {
      expect(parseConsent(raw, NOW), raw).toBeNull();
    }
  });

  it("asks again after a policy version change (a v1 choice has no analytics answer)", () => {
    expect(parseConsent(JSON.stringify({ v: CONSENT_VERSION - 1, media: true, at: NOW }), NOW)).toBeNull();
    expect(parseConsent(JSON.stringify({ v: CONSENT_VERSION - 1, media: true, analytics: true, at: NOW }), NOW)).toBeNull();
  });

  it("expires after 12 months and rejects timestamps from the future", () => {
    expect(parseConsent(serializeConsent(ALLOW_ALL, NOW - 364 * DAY), NOW)).toEqual(ALLOW_ALL);
    expect(parseConsent(serializeConsent(ALLOW_ALL, NOW - 366 * DAY), NOW)).toBeNull();
    expect(parseConsent(serializeConsent(ALLOW_ALL, NOW + DAY), NOW)).toBeNull();
  });
});
