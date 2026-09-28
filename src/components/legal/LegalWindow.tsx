import Link from "next/link";
import type { ReactNode } from "react";
import { Win7Icon } from "@/components/icons";
import { AeroWindow } from "@/components/win7/AeroWindow";
import { ExplorerLayout } from "@/components/win7/ExplorerLayout";
import { OpenPrivacyButton } from "@/components/privacy/OpenPrivacyButton";
import { LEGAL_DOCS, LEGAL_UPDATED, type LegalSlug } from "@/content/legal";

/** Explorer-style window shared by the legal pages: document list on the left, text on the right. */
export function LegalWindow({ current, title, children }: { current: LegalSlug; title: string; children: ReactNode }) {
  return (
    <AeroWindow
      title={title}
      icon={<Win7Icon name="document" className="size-full" />}
      address={["Equipo", "Legal", title]}
      scroll={false}
      statusBar={`Última actualización: ${LEGAL_UPDATED}`}
      toolbar={<OpenPrivacyButton className="win-button hidden sm:inline-flex" />}
    >
      <ExplorerLayout
        nav={
          <>
            <p className="navpane-heading">Documentos</p>
            <ul>
              {LEGAL_DOCS.map((doc) => (
                <li key={doc.slug}>
                  <Link href={`/legal/${doc.slug}`} className="navpane-item" aria-current={doc.slug === current ? "page" : undefined}>
                    {doc.label}
                  </Link>
                </li>
              ))}
            </ul>
          </>
        }
      >
        <article className="legal-doc">
          <h1 className="win-h1">{title}</h1>
          <p className="legal-updated mt-1">Última actualización: {LEGAL_UPDATED}</p>
          {children}
          <nav aria-label="Otros documentos legales" className="mt-8 border-t border-[#e3e8ee] pt-3 text-sm">
            <span className="text-win-muted">Otros documentos: </span>
            {LEGAL_DOCS.filter((d) => d.slug !== current).map((doc, i) => (
              <span key={doc.slug}>
                {i > 0 && " · "}
                <Link href={`/legal/${doc.slug}`} className="win-link">
                  {doc.label}
                </Link>
              </span>
            ))}
            {" · "}
            <OpenPrivacyButton className="win-link" >Preferencias de privacidad</OpenPrivacyButton>
          </nav>
        </article>
      </ExplorerLayout>
    </AeroWindow>
  );
}
