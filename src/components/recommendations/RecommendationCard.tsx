"use client";

import Link from "next/link";
import { Avatar } from "@/components/Avatar";
import { Win7Icon } from "@/components/icons";
import { useConfirm } from "@/components/win7/MessageBox";
import { PROVIDER_LABEL, type PublicRecommendation } from "@/lib/recommendations/public";

// UTC: the same text on the server and in the browser (no hydration mismatch).
const monthYear = (iso: string) => new Date(iso).toLocaleDateString("es", { month: "short", year: "numeric", timeZone: "UTC" });

export function RecommendationCard({ rec, projectTitle }: { rec: PublicRecommendation; projectTitle?: string }) {
  const [notify, messageBox] = useConfirm();
  const provider = PROVIDER_LABEL[rec.provider];

  const explain = () =>
    notify({
      title: "Recomendación verificada",
      icon: "info",
      confirmLabel: null,
      cancelLabel: "Aceptar",
      message: `${rec.name} inició sesión con su cuenta de ${provider} para escribir esta recomendación: el nombre y la foto vienen de esa cuenta. No puedo editar su texto, solo publicarlo u ocultarlo, y el link de invitación era de un solo uso para este proyecto.`,
    });

  return (
    <article className="rec-card">
      <header className="flex items-center gap-3">
        <Avatar src={rec.avatarUrl} name={rec.name} size={48} />
        <div className="min-w-0">
          <h4 className="truncate font-semibold text-win-heading">{rec.name}</h4>
          <p className="truncate text-xs text-win-muted">
            {rec.role} · {rec.company}
          </p>
        </div>
      </header>
      <blockquote className="rec-body">{rec.body}</blockquote>
      <footer className="rec-foot">
        <button type="button" className="rec-seal" onClick={explain}>
          <Win7Icon name="shield-ok" className="size-4" />
          Verificado con {provider}
        </button>
        <span>· {monthYear(rec.createdAt)}</span>
        {rec.emailDomain && <span className="w-full">Correo verificado de {rec.emailDomain}</span>}
        {projectTitle && (
          <Link href={`/proyectos/${rec.projectSlug}`} className="win-link w-full">
            {projectTitle}
          </Link>
        )}
      </footer>
      {messageBox}
    </article>
  );
}
