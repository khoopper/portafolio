import { beforeEach, describe, expect, it, vi } from "vitest";

// In-memory stand-in for the Supabase Storage bucket.
const store = new Map<string, string>();
vi.mock("@/lib/site-content", () => ({
  readContent: async (key: string) => (store.has(key) ? new TextEncoder().encode(store.get(key)) : null),
  writeContent: async (key: string, body: string) => void store.set(key, body),
}));

const { getProjectBySlug, persistProject, removeProject } = await import("./projects-manager");
const stored = () => JSON.parse(store.get("projects.json") ?? "[]") as { slug: string; title: string }[];

describe("projects-manager (persistencia en Storage)", () => {
  beforeEach(() => {
    store.clear();
    vi.stubEnv("NODE_ENV", "development");
  });

  it("eliminar guarda la lista sin el proyecto (no vuelve al recargar)", async () => {
    const first = (await import("@/content/projects.json")).default[0] as { slug: string };
    await removeProject(first.slug);
    expect(stored().some((p) => p.slug === first.slug)).toBe(false);
    expect(await getProjectBySlug(first.slug)).toBeNull();
  });

  it("una lista guardada vacía (sin marca) publica el proyecto base una vez; luego se respeta el borrado", async () => {
    store.set("projects.json", "[]");
    const first = (await import("@/content/projects.json")).default[0] as { slug: string };
    expect((await getProjectBySlug(first.slug))?.slug).toBe(first.slug);
    expect(stored().some((p) => p.slug === first.slug)).toBe(true); // persisted, so the admin can edit it

    await removeProject(first.slug);
    expect(await getProjectBySlug(first.slug)).toBeNull();
    expect(stored()).toEqual([]);
  });

  it("guardar reemplaza por slug original o agrega al inicio", async () => {
    store.set("projects.json", JSON.stringify([{ slug: "a", title: "A" }, { slug: "b", title: "B" }]));
    await persistProject({ slug: "a2", title: "A renombrado" } as never, "a");
    await persistProject({ slug: "c", title: "C" } as never);
    expect(stored().map((p) => p.slug)).toEqual(["c", "a2", "b"]);
  });
});
