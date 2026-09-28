"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { hasAdminSession } from "@/lib/admin-auth";
import { getAllProjects, persistProject, removeProject } from "@/lib/data/projects-manager";
import { parseProjectForm } from "@/lib/project-input";
import type { Project } from "@/lib/types";

// A project shows up on many prerendered pages: its own /proyectos/<slug> and /p/<slug> (old and new
// slug), the Start menu and search index baked into every (site) page, and /recomendaciones.
// Invalidate everything under the root layout so an unpublished/deleted project is never served stale.
const revalidateAllPages = () => revalidatePath("/", "layout");

export interface ProjectActionResult {
  success: boolean;
  error?: string;
  slug?: string;
}

export async function saveProjectAction(
  _prevState: ProjectActionResult | null,
  formData: FormData
): Promise<ProjectActionResult> {
  // Server Actions are public endpoints: the /admin proxy alone does not protect them.
  if (!(await hasAdminSession())) return { success: false, error: "Sesión administrativa no válida." };
  // Whitelist + validate every field: the form is a public POST endpoint, so never trust its shape.
  const parsed = parseProjectForm(Object.fromEntries(formData));
  if (!parsed.ok) return { success: false, error: parsed.error };
  const originalSlug = String(formData.get("originalSlug") ?? "") || undefined;
  const project: Project = { ...parsed.value, videoUrl: null };
  const slug = project.slug;

  // Creating, or renaming onto, an existing slug would silently overwrite another project.
  if (slug !== originalSlug && (await getAllProjects()).some((p) => p.slug === slug)) {
    return { success: false, error: "Ya existe un proyecto con ese identificador." };
  }

  try {
    await persistProject(project, originalSlug);
    revalidateAllPages();
    return { success: true, slug };
  } catch (err: unknown) {
    // Log the detail on the server; the browser only gets a generic message.
    console.error("[proyectos] no se pudo guardar:", err);
    return { success: false, error: "No se pudo guardar el proyecto." };
  }
}

export async function deleteProjectAction(formData: FormData): Promise<void> {
  if (!(await hasAdminSession())) redirect("/admin/login");
  const slug = formData.get("slug") as string;
  if (slug) {
    try {
      await removeProject(slug);
    } catch (err) {
      console.error("[proyectos] no se pudo eliminar:", err);
      redirect("/admin/proyectos?aviso=no-eliminado");
    }
    revalidateAllPages();
  }
  redirect("/admin/proyectos");
}
