import { RecommendationsAdmin } from "@/components/admin/RecommendationsAdmin";
import { Win7Icon } from "@/components/icons";
import { AeroWindow } from "@/components/win7/AeroWindow";
import { count } from "@/lib/count";
import { getAllProjects } from "@/lib/data";
import { listAllRecommendations, listInvites } from "@/lib/recommendations/queries";
import { isSupabaseConfigured } from "@/lib/supabase";

export default async function AdminRecommendationsPage() {
  const configured = isSupabaseConfigured();
  // Reads are retried inside the queries; if Supabase is still unreachable show a message, not a 500 page.
  const [projects, loaded] = await Promise.all([
    getAllProjects(),
    Promise.all([configured ? listInvites() : Promise.resolve([]), configured ? listAllRecommendations() : Promise.resolve([])]).catch((err) => {
      console.error("[admin/recomendaciones] no se pudo leer Supabase:", err);
      return null;
    }),
  ]);
  const [invites, recommendations] = loaded ?? [[], []];
  const pending = recommendations.filter((r) => r.status === "pending").length;

  return (
    <AeroWindow
      title="Recomendaciones · Panel Administrativo"
      icon={<Win7Icon name="shield-ok" className="size-full" />}
      address={["Equipo", "Administración", "Recomendaciones"]}
      homeHref="/admin"
      statusBar={`${count(pending, "pendiente", "pendientes")} · ${count(invites.length, "invitación", "invitaciones")}`}
    >
      {loaded === null ? (
        <div className="space-y-3 p-5 text-sm">
          <p>No se pudieron cargar las recomendaciones: Supabase tardó demasiado en responder. No se perdió nada.</p>
          <a href="/admin/recomendaciones" className="win-button win-button--primary inline-flex">
            Reintentar
          </a>
        </div>
      ) : configured ? (
        <RecommendationsAdmin projects={projects.map((p) => ({ slug: p.slug, title: p.title }))} invites={invites} recommendations={recommendations} />
      ) : (
        <p className="p-5 text-sm">
          Supabase no está configurado. Llena <code>SUPABASE_URL</code>, <code>SUPABASE_PUBLISHABLE_KEY</code> y{" "}
          <code>SUPABASE_SECRET_KEY</code> en <code>.env.local</code> (ver <code>.env.example</code>).
        </p>
      )}
    </AeroWindow>
  );
}
