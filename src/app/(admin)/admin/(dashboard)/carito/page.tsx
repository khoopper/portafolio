import { CaritoAdmin } from "@/components/admin/CaritoAdmin";
import { IconWindowsMediaPlayer } from "@/components/icons/admin-icons";
import { AeroWindow } from "@/components/win7/AeroWindow";
import { count } from "@/lib/count";
import { hasAccess } from "@/lib/carito/licence";
import { listCaritoLicences, type CaritoLicence } from "@/lib/carito/licences";
import { listCaritoMembers, type CaritoMember } from "@/lib/carito/queries";
import { isSupabaseConfigured } from "@/lib/supabase";

export default async function AdminCaritoPage() {
  const configured = isSupabaseConfigured();
  const members: CaritoMember[] | null = configured
    ? await listCaritoMembers().catch((err) => {
        console.error("[admin/carito] no se pudo leer Supabase:", err);
        return null;
      })
    : [];
  // Sin la segunda migración esta consulta falla y la pestaña Licencias lo dice; Personas sigue funcionando.
  const licences: CaritoLicence[] | null = configured
    ? await listCaritoLicences().catch((err) => {
        console.error("[admin/carito] no se pudieron leer las licencias:", err);
        return null;
      })
    : [];
  const active = members?.filter((m) => hasAccess(m.state)).length ?? 0;
  const trials = members?.filter((m) => m.state.kind === "trial").length ?? 0;

  return (
    <AeroWindow
      title="Carito Music · Panel Administrativo"
      icon={<IconWindowsMediaPlayer className="size-full" />}
      address={["Equipo", "Administración", "Carito Music"]}
      homeHref="/admin"
      statusBar={`${count(members?.length ?? 0, "registrado", "registrados")} · ${count(active, "con acceso", "con acceso")} · ${count(trials, "en prueba", "en prueba")}${
        licences ? ` · ${count(licences.length, "licencia", "licencias")}` : ""
      }`}
    >
      {members === null ? (
        <div className="space-y-3 p-5 text-sm">
          <p>
            No se pudo leer la lista. Si es la primera vez, ejecuta <code>supabase/migrations/20261018000000_carito_music.sql</code> en el SQL
            Editor de Supabase; si no, Supabase tardó en responder.
          </p>
          <a href="/admin/carito" className="win-button win-button--primary inline-flex">
            Reintentar
          </a>
        </div>
      ) : configured ? (
        <CaritoAdmin members={members} licences={licences} />
      ) : (
        <p className="p-5 text-sm">Supabase no está configurado en este entorno.</p>
      )}
    </AeroWindow>
  );
}
