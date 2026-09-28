import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { SiteStatsPanel } from "@/components/admin/SiteStatsPanel";
import { emptyStats, normalizeStats } from "@/lib/analytics/stats";

const html = (stats: Parameters<typeof SiteStatsPanel>[0]["stats"]) => renderToStaticMarkup(createElement(SiteStatsPanel, { stats }));

describe("SiteStatsPanel", () => {
  it("shows the migration notice and only zeros when the database is not ready", () => {
    const out = html(emptyStats(false));
    expect(out).toContain("site_events.sql");
    expect(out).not.toMatch(/[1-9]\d*<\/span><\/div>/); // no non-zero counters
  });

  it("says nobody visited yet when the table is empty", () => {
    expect(html(normalizeStats({}))).toContain("nadie ha visitado");
  });

  it("shows real numbers and country names when there is data", () => {
    const out = html(
      normalizeStats({
        views_today: 5,
        views_7d: 12,
        views_30d: 40,
        countries: [{ country: "SV", views: 9 }],
        top_pages: [{ path: "/inicio", views: 9 }],
      }),
    );
    expect(out).toContain("El Salvador");
    expect(out).toContain("/inicio");
    expect(out).not.toContain("nadie ha visitado");
  });
});
