import { describe, expect, it, vi } from "vitest";
import { getProject, getProjects } from "@/lib/data";
import type { Project } from "@/lib/types";

vi.mock("@/content/projects", () => {
  const make = (slug: string, status: Project["status"], featured: boolean): Project => ({
    slug,
    title: slug,
    tagline: "",
    description: "",
    role: "",
    year: 2025,
    status,
    featured,
    demoUrl: null,
    repoUrl: null,
    videoUrl: null,
    cover: null,
    highlights: [],
    tech: [],
  });
  return {
    projects: [
      make("published-featured", "published", true),
      make("published-plain", "published", false),
      make("draft-featured", "draft", true),
    ],
  };
});

const slugs = (ps: Project[]) => ps.map((p) => p.slug);

describe("data layer filtering", () => {
  it("getProjects() excludes drafts", async () => {
    expect(slugs(await getProjects())).toEqual(["published-featured", "published-plain"]);
  });

  it("getProjects({ featured: true }) excludes non-featured and drafts", async () => {
    expect(slugs(await getProjects({ featured: true }))).toEqual(["published-featured"]);
  });

  it("getProject(<draft slug>) returns null", async () => {
    expect(await getProject("draft-featured")).toBeNull();
    expect((await getProject("published-plain"))?.slug).toBe("published-plain");
  });
});
