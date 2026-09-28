import { cache } from "react";
import seedProjects from "@/content/projects.json";
import { projects as defaultProjects } from "@/content/projects";
import { readContent, writeContent } from "@/lib/site-content";
import type { Project } from "@/lib/types";

const KEY = "projects.json";
// Marker: which shipped project list was last published into Storage. Change SEED_REV when the projects in
// projects.json should replace an EMPTY saved list once (e.g. after clearing the portfolio); every save from the
// admin panel also writes it, so a list the admin emptied on purpose stays empty.
const REV_KEY = "projects-seed-rev";
const SEED_REV = "turismo-2026-09-29";

/** Content shipped with the code, used until the admin saves the list for the first time. */
const seed = (): Project[] => (Array.isArray(seedProjects) && seedProjects.length > 0 ? (seedProjects as Project[]) : [...defaultProjects]);

/** Always the stored list (no process-level cache: every server instance must see the same data). */
async function loadProjects(): Promise<Project[]> {
  if (process.env.NODE_ENV === "test") return [...defaultProjects];
  const stored = await readContent(KEY);
  if (!stored) return seed();
  const parsed: unknown = JSON.parse(new TextDecoder().decode(stored));
  if (Array.isArray(parsed) && parsed.length > 0) return parsed as Project[];

  // Empty (or unreadable) saved list: publish the shipped projects once per SEED_REV, then respect the admin.
  const applied = await readContent(REV_KEY);
  if (applied && new TextDecoder().decode(applied) === SEED_REV) return [];
  const shipped = seed();
  try {
    await save(shipped);
  } catch (err) {
    console.error("[proyectos] no se pudo publicar la lista base:", err); // still show it this time
  }
  return shipped;
}

/** Deduplicated per request (layout + page read it together). */
export const getAllProjects = cache(loadProjects);

export async function getProjectBySlug(slug: string): Promise<Project | null> {
  return (await getAllProjects()).find((p) => p.slug === slug) ?? null;
}

async function save(list: Project[]): Promise<void> {
  await writeContent(KEY, JSON.stringify(list, null, 2), "application/json");
  await writeContent(REV_KEY, SEED_REV, "text/plain");
}

/** Throws if storage fails, so the admin never sees "saved" for a change that was lost. */
export async function persistProject(project: Project, originalSlug?: string): Promise<void> {
  const all = await loadProjects();
  const index = all.findIndex((p) => p.slug === (originalSlug || project.slug));
  await save(index >= 0 ? all.map((p, i) => (i === index ? project : p)) : [project, ...all]);
}

export async function removeProject(slug: string): Promise<void> {
  const all = await loadProjects();
  await save(all.filter((p) => p.slug !== slug));
}
