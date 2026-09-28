"use client";

import { useActionState, useEffect, useOptimistic, useRef, useState, type ReactNode } from "react";
import { createInviteAction, revokeInviteAction, setRecommendationStatusAction } from "@/app/(admin)/admin/recommendation-actions";
import { CloseGlyph, IconAdd } from "@/components/icons";
import { CopyButton } from "@/components/win7/CopyButton";
import { Tabs } from "@/components/win7/Tabs";
import { INVITE_STATUS_LABEL } from "@/lib/recommendations/invite";
import { PROVIDER_LABEL } from "@/lib/recommendations/public";
import type { AdminInvite, AdminRecommendation } from "@/lib/recommendations/queries";

interface ProjectOption {
  slug: string;
  title: string;
}

interface Props {
  projects: ProjectOption[];
  invites: AdminInvite[];
  recommendations: AdminRecommendation[];
}

const STATUS_LABEL = { pending: "Pendiente", approved: "Publicada", hidden: "Oculta" } as const;
const date = (iso: string) => new Date(iso).toLocaleDateString("es", { day: "2-digit", month: "short", year: "numeric", timeZone: "UTC" });
const small = "win-button text-xs py-1 px-3";

export function RecommendationsAdmin({ projects, invites, recommendations }: Props) {
  const [dialogOpen, setDialogOpen] = useState(false);
  const title = (slug: string) => projects.find((p) => p.slug === slug)?.title ?? slug;
  const pending = recommendations.filter((r) => r.status === "pending").length;

  return (
    <div className="p-5">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3 border-b border-[#d5dfe5] pb-3">
        <div>
          <h2 className="win-h1">Recomendaciones</h2>
          <p className="mt-0.5 text-xs text-win-muted">Invita a tus clientes y publica lo que escriben. No puedes editar sus textos.</p>
        </div>
        <button type="button" className="win-button win-button--primary flex items-center gap-1.5 text-xs" onClick={() => setDialogOpen(true)}>
          <IconAdd className="size-4" />
          Nueva invitación
        </button>
      </div>

      <Tabs
        label="Recomendaciones"
        tabs={[
          { id: "recs", label: `Recomendaciones (${pending} pendientes)`, content: <RecommendationsTable items={recommendations} title={title} /> },
          { id: "invites", label: `Invitaciones (${invites.length})`, content: <InvitesTable items={invites} title={title} /> },
        ]}
      />

      {dialogOpen && <NewInviteDialog projects={projects} onClose={() => setDialogOpen(false)} />}
    </div>
  );
}

function DetailsTable({ head, children }: { head: string[]; children: ReactNode }) {
  return (
    <div className="overflow-x-auto rounded border border-[#a4b3c7] bg-white shadow-sm">
      <table className="w-full border-collapse text-left text-xs">
        <thead className="border-b border-[#a0afc3] bg-gradient-to-b from-[#f9fbfd] to-[#e4edf7] text-[#1e3287]">
          <tr>
            {head.map((h) => (
              <th key={h} className="border-r border-[#d2dce8] p-2.5 font-semibold last:border-r-0">
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-100 text-[#1e1e1e]">{children}</tbody>
      </table>
    </div>
  );
}

function StatusButton({ id, status, label }: { id: string; status: "approved" | "hidden"; label: string }) {
  return (
    <form action={setRecommendationStatusAction} className="inline">
      <input type="hidden" name="id" value={id} />
      <input type="hidden" name="status" value={status} />
      <button type="submit" className={small}>
        {label}
      </button>
    </form>
  );
}

function RecommendationsTable({ items, title }: { items: AdminRecommendation[]; title: (slug: string) => string }) {
  if (!items.length) return <p className="p-4 text-sm text-win-muted">Aún no llega ninguna recomendación.</p>;
  return (
    <DetailsTable head={["Nombre", "Proyecto", "Estado", "Fecha", "Acciones"]}>
      {items.map((r) => (
        <tr key={r.id} className="align-top hover:bg-[#eef5fc]">
          <td className="max-w-md p-2.5">
            <details>
              <summary className="cursor-pointer font-semibold text-[#1e3287]">
                {r.name}{" "}
                <span className="font-normal text-win-muted">
                  · {r.role}, {r.company}
                </span>
              </summary>
              <p className="mt-2 whitespace-pre-line text-[13px]">{r.body}</p>
              <p className="mt-1 text-win-muted">
                {r.email} · {PROVIDER_LABEL[r.provider]}
              </p>
            </details>
          </td>
          <td className="p-2.5">{title(r.projectSlug)}</td>
          <td className="p-2.5">{STATUS_LABEL[r.status]}</td>
          <td className="whitespace-nowrap p-2.5">{date(r.createdAt)}</td>
          <td className="space-x-1 whitespace-nowrap p-2.5">
            {r.status !== "approved" && <StatusButton id={r.id} status="approved" label="Aprobar" />}
            {r.status !== "hidden" && <StatusButton id={r.id} status="hidden" label="Ocultar" />}
          </td>
        </tr>
      ))}
    </DetailsTable>
  );
}

function InvitesTable({ items, title }: { items: AdminInvite[]; title: (slug: string) => string }) {
  // The row disappears the moment the button is pressed; the server deletes it in the background.
  const [visible, hide] = useOptimistic(items, (list, id: string) => list.filter((inv) => inv.id !== id));
  const remove = (formData: FormData) => {
    hide(String(formData.get("id") ?? ""));
    return revokeInviteAction(formData);
  };
  if (!visible.length) return <p className="p-4 text-sm text-win-muted">Todavía no creas invitaciones.</p>;
  return (
    <DetailsTable head={["Nota", "Proyecto", "Estado", "Creada", "Acciones"]}>
      {visible.map((inv) => (
        <tr key={inv.id} className="hover:bg-[#eef5fc]">
          <td className="p-2.5 font-semibold text-[#1e3287]">{inv.note}</td>
          <td className="p-2.5">{title(inv.projectSlug)}</td>
          <td className="p-2.5">{INVITE_STATUS_LABEL[inv.status]}</td>
          <td className="whitespace-nowrap p-2.5">{date(inv.createdAt)}</td>
          <td className="p-2.5">
            {(inv.status === "unused" || inv.status === "expired") && (
              <form action={remove}>
                <input type="hidden" name="id" value={inv.id} />
                <button type="submit" className={small}>
                  {inv.status === "unused" ? "Revocar" : "Eliminar"}
                </button>
              </form>
            )}
          </td>
        </tr>
      ))}
    </DetailsTable>
  );
}

function NewInviteDialog({ projects, onClose }: { projects: ProjectOption[]; onClose: () => void }) {
  const ref = useRef<HTMLDialogElement>(null);
  const [state, formAction, pending] = useActionState(createInviteAction, null);

  useEffect(() => {
    if (!ref.current?.open) ref.current?.showModal();
  }, []);

  const whatsapp = state?.link
    ? `https://wa.me/?text=${encodeURIComponent(`Hola, ¿me ayudas con una recomendación sobre el sistema que te entregué? Solo toma un minuto: ${state.link}`)}`
    : null;

  return (
    <dialog
      ref={ref}
      className="msgbox aero-frame"
      aria-labelledby="invite-title"
      onCancel={(e) => {
        e.preventDefault();
        onClose();
      }}
    >
      <header className="aero-titlebar">
        <h2 id="invite-title" className="aero-title pl-1 text-[13px]">
          Nueva invitación
        </h2>
        <div className="caption-btns">
          <button type="button" className="caption-btn caption-btn--close" aria-label="Cerrar" onClick={onClose}>
            <CloseGlyph />
          </button>
        </div>
      </header>
      <div className="msgbox-client">
        {state?.link && whatsapp ? (
          <>
            <div className="space-y-3 p-5 text-sm">
              <p>
                Manda este link a tu cliente. <strong>Solo se muestra esta vez</strong>: sirve para una recomendación y caduca en 30 días.
              </p>
              <input
                readOnly
                value={state.link}
                aria-label="Link de invitación"
                className="win-textbox font-mono text-xs"
                onFocus={(e) => e.currentTarget.select()}
              />
            </div>
            <div className="msgbox-buttons">
              <CopyButton value={state.link} object="link" />
              <a href={whatsapp} target="_blank" rel="noopener noreferrer" className="win-button">
                WhatsApp
              </a>
              <button type="button" className="win-button win-button--primary" onClick={onClose}>
                Cerrar
              </button>
            </div>
          </>
        ) : (
          <form action={formAction}>
            <div className="space-y-3 p-5 text-sm">
              <label className="wizard-field">
                Proyecto
                <select name="projectSlug" className="win-textbox" required>
                  {projects.map((p) => (
                    <option key={p.slug} value={p.slug}>
                      {p.title}
                    </option>
                  ))}
                </select>
              </label>
              <label className="wizard-field">
                Nota (solo la ves tú)
                <input name="note" className="win-textbox" maxLength={120} required placeholder="Ej. Dra. López – Clínica San Rafael" />
              </label>
              {state?.error && (
                <p role="alert" className="wizard-alert">
                  {state.error}
                </p>
              )}
            </div>
            <div className="msgbox-buttons">
              <button type="button" className="win-button" onClick={onClose}>
                Cancelar
              </button>
              <button type="submit" className="win-button win-button--primary" disabled={pending}>
                {pending ? "Creando…" : "Crear link"}
              </button>
            </div>
          </form>
        )}
      </div>
    </dialog>
  );
}
