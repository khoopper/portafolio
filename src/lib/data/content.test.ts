import { describe, expect, it } from "vitest";
import { profile } from "@/content/profile";
import { projects } from "@/content/projects";
import { settings } from "@/content/settings";
import { technologies } from "@/content/technologies";
import { getProject, getProjects } from "@/lib/data";
import { TECH_ICONS } from "@/lib/tech-icons";

const KEBAB = /^[a-z0-9]+(-[a-z0-9]+)*$/;
const isHttpsOrNull = (url: string | null) => url === null || url.startsWith("https://");

describe("content integrity", () => {
  it("project slugs are unique kebab-case", () => {
    const slugs = projects.map((p) => p.slug);
    expect(new Set(slugs).size).toBe(slugs.length);
    for (const slug of slugs) expect(slug).toMatch(KEBAB);
  });

  it("technology slugs are unique and every icon slug exists", () => {
    const slugs = technologies.map((t) => t.slug);
    expect(new Set(slugs).size).toBe(slugs.length);
    for (const t of technologies) {
      if (t.iconSlug !== null) expect(TECH_ICONS[t.iconSlug], t.iconSlug).toBeDefined();
    }
  });

  it("projects only reference known technologies", () => {
    const known = new Set(technologies.map((t) => t.slug));
    for (const p of projects) for (const s of p.tech) expect(known.has(s), `${p.slug} → ${s}`).toBe(true);
  });

  it("every external URL is https or null", () => {
    const urls = [
      ...projects.flatMap((p) => [p.demoUrl, p.repoUrl, p.videoUrl]),
      settings.whatsappUrl,
      settings.linkedinUrl,
      settings.githubUrl,
      profile.cvUrl?.startsWith("/") ? null : profile.cvUrl,
    ];
    for (const url of urls) expect(isHttpsOrNull(url), String(url)).toBe(true);
  });

  it("language percents are within 0–100", () => {
    for (const l of profile.languages) {
      expect(l.percent).toBeGreaterThanOrEqual(0);
      expect(l.percent).toBeLessThanOrEqual(100);
    }
  });
});

describe("data layer", () => {
  it("getProjects({ featured: true }) returns only featured, published projects", async () => {
    const featured = await getProjects({ featured: true });
    expect(featured.length).toBeGreaterThan(0);
    for (const p of featured) {
      expect(p.featured).toBe(true);
      expect(p.status).toBe("published");
    }
  });

  it("getProjects() hides drafts", async () => {
    const all = await getProjects();
    expect(all.every((p) => p.status === "published")).toBe(true);
  });

  it("getProject returns the project or null", async () => {
    const [first] = await getProjects();
    expect((await getProject(first.slug))?.title).toBe(first.title);
    expect(await getProject("no-existe")).toBeNull();
  });
});
