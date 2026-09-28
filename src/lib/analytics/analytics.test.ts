import { describe, expect, it } from "vitest";
import { parseEvent } from "@/lib/analytics/event";
import { emptyStats, normalizeStats } from "@/lib/analytics/stats";
import { deviceOf, isBot, visitorId } from "@/lib/analytics/visitor";

describe("parseEvent", () => {
  it("accepts a page view and strips query, hash and trailing slash", () => {
    expect(parseEvent({ kind: "view", path: "/proyectos/?utm=x#top" })).toEqual({ kind: "view", path: "/proyectos", projectSlug: null });
  });

  it("derives the project slug from the path", () => {
    expect(parseEvent({ kind: "view", path: "/proyectos/mi-proyecto" })?.projectSlug).toBe("mi-proyecto");
  });

  it("takes the project slug from the body for clicks", () => {
    expect(parseEvent({ kind: "demo", path: "/proyectos/a-b", project: "a-b" })?.projectSlug).toBe("a-b");
    expect(parseEvent({ kind: "demo", path: "/inicio", project: "NO valido" })?.projectSlug).toBeNull();
  });

  it("drops private areas, unknown kinds and malformed input", () => {
    for (const bad of [
      { kind: "view", path: "/admin/login" },
      { kind: "view", path: "/r/secret-token" },
      { kind: "view", path: "/api/t" },
      { kind: "hack", path: "/inicio" },
      { kind: "view", path: "inicio" },
      { kind: "view", path: "/a b" },
      { kind: "view", path: "/" + "a".repeat(250) },
      { kind: "view" },
      null,
      "text",
    ]) {
      expect(parseEvent(bad), JSON.stringify(bad)).toBeNull();
    }
  });
});

describe("visitor helpers", () => {
  it("hashes deterministically within a day and differently across days, without leaking the IP", () => {
    const a = visitorId("secret", "2026-09-29", "1.2.3.4", "UA");
    expect(a).toBe(visitorId("secret", "2026-09-29", "1.2.3.4", "UA"));
    expect(a).not.toBe(visitorId("secret", "2026-09-30", "1.2.3.4", "UA"));
    expect(a).not.toBe(visitorId("secret", "2026-09-29", "1.2.3.5", "UA"));
    expect(a).toMatch(/^[0-9a-f]{32}$/);
    expect(a).not.toContain("1.2.3.4");
  });

  it("classifies devices and bots", () => {
    expect(deviceOf("Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) Mobile/15E148")).toBe("mobile");
    expect(deviceOf("Mozilla/5.0 (iPad; CPU OS 17_0 like Mac OS X)")).toBe("tablet");
    expect(deviceOf("Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/120")).toBe("desktop");
    expect(isBot("Googlebot/2.1")).toBe(true);
    expect(isBot(null)).toBe(true);
    expect(isBot("Mozilla/5.0 (Windows NT 10.0) Chrome/120")).toBe(false);
  });
});

describe("normalizeStats", () => {
  it("returns zeros for garbage and for an empty database", () => {
    expect(normalizeStats(null)).toEqual(emptyStats(true));
    expect(normalizeStats({ views_today: "x", top_pages: "no" })).toEqual(emptyStats(true));
  });

  it("maps the SQL function output", () => {
    const s = normalizeStats({
      views_today: 3,
      views_30d: 10,
      by_day: [{ day: "2026-09-29", views: 3, visitors: 2 }],
      clicks: [
        { kind: "cv", total: 4 },
        { kind: "bogus", total: 9 },
      ],
      recent: [{ created_at: "2026-09-29T10:00:00Z", kind: "view", path: "/inicio", country: null, device: "desktop" }],
    });
    expect(s.viewsToday).toBe(3);
    expect(s.viewsMonth).toBe(10);
    expect(s.byDay[0]).toEqual({ day: "2026-09-29", views: 3, visitors: 2 });
    expect(s.clicks).toEqual({ cv: 4, demo: 0, repo: 0, contact: 0 });
    expect(s.recent[0].country).toBeNull();
  });
});
