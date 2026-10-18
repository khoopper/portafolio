"use client";

import { useActionState, useEffect, useRef, useState, type ReactNode } from "react";
import {
  deleteCaritoMemberAction,
  grantCaritoLicenceAction,
  releaseCaritoDeviceAction,
  setCaritoRevokedAction,
} from "@/app/(admin)/admin/carito-actions";
import { CloseGlyph } from "@/components/icons";
import { Tabs } from "@/components/win7/Tabs";
import { CARITO_TIME_ZONE, addMonths, caritoToday, hasAccess, renewedUntil, stateLabel, type MemberState } from "@/lib/carito/licence";
import type { CaritoMember } from "@/lib/carito/queries";

const small = "win-button text-xs py-1 px-3";
const day = (ymd: string) => new Date(`${ymd}T12:00:00Z`).toLocaleDateString("es", { day: "2-digit", month: "short", year: "numeric", timeZone: "UTC" });
const moment = (iso: string) =>
  new Date(iso).toLocaleString("es", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit", timeZone: CARITO_TIME_ZONE });

const BADGE: Record<MemberState["kind"], string> = {
  forever: "bg-[#dff3e4] text-[#1d6b34] border-[#9fd2ad]",
  licence: "bg-[#dff3e4] text-[#1d6b34] border-[#9fd2ad]",
  trial: "bg-[#e3effc] text-[#1e3287] border-[#a9c6ea]",
  waiting: "bg-[#fff6db] text-[#7a5b00] border-[#ecd58c]",
  trial_ended: "bg-[#fff6db] text-[#7a5b00] border-[#ecd58c]",
  expired: "bg-[#fdeaea] text-[#9b1c1c] border-[#efb1b1]",
  revoked: "bg-[#fdeaea] text-[#9b1c1c] border-[#efb1b1]",
};

/** Carito Music's licences: everyone registered with Google, how long they have left, and give / renew / revoke. */
export function CaritoAdmin({ members }: { members: CaritoMember[] }) {
  const [granting, setGranting] = useState<CaritoMember | null>(null);
  const withAccess = members.filter((m) => hasAccess(m.state));
  const trials = members.filter((m) => m.state.kind === "trial");
  const without = members.filter((m) => !hasAccess(m.state) && m.state.kind !== "revoked");
  const revoked = members.filter((m) => m.state.kind === "revoked");
  const table = (list: CaritoMember[], empty: string) => <MembersTable items={list} empty={empty} onGrant={setGranting} />;

  return (
    <div className="p-5">
      <div className="mb-4 border-b border-[#d5dfe5] pb-3">
        <h2 className="win-h1">Carito Music</h2>
        <p className="mt-0.5 text-xs text-win-muted">
          Quien abre la app entra con su cuenta de Google y aparece aquí. Los nuevos tienen 3 días de prueba (una por teléfono). Una
          licencia revocada deja de abrir en cuanto el teléfono se conecta; sin conexión, la app comprueba a más tardar cada 30 días.
        </p>
      </div>

      <Tabs
        label="Personas registradas"
        tabs={[
          { id: "sin", label: `Sin acceso (${without.length})`, content: table(without, "Nadie está esperando una licencia.") },
          { id: "activos", label: `Con acceso (${withAccess.length})`, content: table(withAccess, "Nadie tiene acceso todavía.") },
          { id: "prueba", label: `En prueba (${trials.length})`, content: table(trials, "Nadie está en prueba.") },
          { id: "revocados", label: `Revocados (${revoked.length})`, content: table(revoked, "No revocaste ninguna licencia.") },
          { id: "todos", label: `Todos (${members.length})`, content: table(members, "Todavía no se registró nadie.") },
        ]}
      />

      {granting && <GrantDialog member={granting} onClose={() => setGranting(null)} />}
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

function until(state: MemberState): string | null {
  switch (state.kind) {
    case "licence":
    case "expired":
      return `hasta el ${day(state.until)}`;
    case "trial":
      return `termina ${moment(state.endsAt)}`;
    default:
      return null;
  }
}

function ConfirmForm({ action, fields, label, question }: { action: (f: FormData) => Promise<void>; fields: Record<string, string>; label: string; question?: string }) {
  return (
    <form action={action} className="inline" onSubmit={(e) => question && !window.confirm(question) && e.preventDefault()}>
      {Object.entries(fields).map(([name, value]) => (
        <input key={name} type="hidden" name={name} value={value} />
      ))}
      <button type="submit" className={small}>
        {label}
      </button>
    </form>
  );
}

function MembersTable({ items, empty, onGrant }: { items: CaritoMember[]; empty: string; onGrant: (m: CaritoMember) => void }) {
  if (!items.length) return <p className="p-4 text-sm text-win-muted">{empty}</p>;
  return (
    <DetailsTable head={["Persona", "Teléfono", "Licencia", "Biblioteca", "Último uso", "Acciones"]}>
      {items.map((m) => {
        const who = m.name || m.email;
        const renew = m.state.kind === "licence" || m.state.kind === "forever";
        return (
          <tr key={m.userId} className="align-top hover:bg-[#eef5fc]">
            <td className="p-2.5">
              <div className="flex items-center gap-2">
                <span className="grid size-8 shrink-0 place-items-center overflow-hidden rounded-full bg-[#dbe7f5] font-semibold text-[#1e3287]">
                  {m.photoUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={m.photoUrl} alt="" className="size-full object-cover" referrerPolicy="no-referrer" />
                  ) : (
                    who.slice(0, 1).toUpperCase()
                  )}
                </span>
                <span>
                  <span className="block font-semibold text-[#1e3287]">{who}</span>
                  <span className="block text-win-muted">{m.email}</span>
                  {m.legacy && <span className="block text-[11px] text-win-muted">Tenía licencia antes del registro</span>}
                </span>
              </div>
            </td>
            <td className="p-2.5">
              <span className="block">{m.deviceModel ?? "—"}</span>
              <span className="block font-mono text-win-muted">
                {m.deviceCode ?? "libre"}
                {m.appVersion ? ` · v${m.appVersion}` : ""}
              </span>
              {m.deviceChanges > 0 && <span className="block text-[11px] text-win-muted">Cambió de teléfono {m.deviceChanges}×</span>}
            </td>
            <td className="p-2.5">
              <span className={`inline-block rounded border px-2 py-0.5 font-semibold ${BADGE[m.state.kind]}`}>{stateLabel(m.state)}</span>
              {until(m.state) && <span className="mt-0.5 block text-win-muted">{until(m.state)}</span>}
            </td>
            <td className="whitespace-nowrap p-2.5">
              {m.librarySavedAt ? (
                <>
                  <span className="block">
                    {m.playlists} playlists · {m.favorites} favoritas
                  </span>
                  <span className="block text-win-muted">copia {moment(m.librarySavedAt)}</span>
                </>
              ) : (
                <span className="text-win-muted">Sin copia</span>
              )}
            </td>
            <td className="whitespace-nowrap p-2.5">
              <span className="block">{moment(m.lastSeenAt)}</span>
              <span className="block text-win-muted">desde {day(m.registeredAt.slice(0, 10))}</span>
            </td>
            <td className="space-y-1 p-2.5">
              <div className="flex flex-wrap gap-1">
                <button type="button" className={`${small} win-button--primary`} onClick={() => onGrant(m)}>
                  {renew ? "Renovar" : "Dar licencia"}
                </button>
                {m.state.kind === "revoked" ? (
                  <ConfirmForm action={setCaritoRevokedAction} fields={{ userId: m.userId, revoke: "0" }} label="Restaurar" />
                ) : (
                  <ConfirmForm
                    action={setCaritoRevokedAction}
                    fields={{ userId: m.userId, revoke: "1" }}
                    label="Revocar"
                    question={`¿Quitarle el acceso a ${who}? La app se le bloquea en cuanto se conecte.`}
                  />
                )}
              </div>
              <details className="text-[11px]">
                <summary className="cursor-pointer text-win-muted">Más</summary>
                <div className="mt-1 flex flex-wrap gap-1">
                  <ConfirmForm
                    action={releaseCaritoDeviceAction}
                    fields={{ userId: m.userId }}
                    label="Liberar teléfono"
                    question={`El próximo teléfono que abra Carito con la cuenta de ${who} la usará. ¿Continuar?`}
                  />
                  <ConfirmForm
                    action={deleteCaritoMemberAction}
                    fields={{ userId: m.userId }}
                    label="Eliminar registro"
                    question={`¿Eliminar el registro de ${who} y la copia de su biblioteca? No se puede deshacer.`}
                  />
                </div>
              </details>
            </td>
          </tr>
        );
      })}
    </DetailsTable>
  );
}

const MONTHS = [
  { value: "1", label: "1 mes" },
  { value: "3", label: "3 meses" },
  { value: "6", label: "6 meses" },
  { value: "12", label: "1 año" },
] as const;

function GrantDialog({ member, onClose }: { member: CaritoMember; onClose: () => void }) {
  const ref = useRef<HTMLDialogElement>(null);
  const [state, formAction, pending] = useActionState(grantCaritoLicenceAction, null);
  const [mode, setMode] = useState<string>("1");
  const today = caritoToday();
  const [date, setDate] = useState(addMonths(today, 1));
  const current = member.state.kind === "licence" ? member.state.until : null;

  useEffect(() => {
    if (!ref.current?.open) ref.current?.showModal();
  }, []);
  useEffect(() => {
    if (state?.ok) onClose();
  }, [state, onClose]);

  const preview =
    mode === "forever" ? "Sin fecha de vencimiento" : `Hasta el ${day(mode === "date" ? date : renewedUntil(current, Number(mode)))}`;

  return (
    <dialog
      ref={ref}
      className="msgbox aero-frame"
      aria-labelledby="grant-title"
      onCancel={(e) => {
        e.preventDefault();
        onClose();
      }}
    >
      <header className="aero-titlebar">
        <h2 id="grant-title" className="aero-title pl-1 text-[13px]">
          {current ? "Renovar licencia" : "Dar licencia"}
        </h2>
        <div className="caption-btns">
          <button type="button" className="caption-btn caption-btn--close" aria-label="Cerrar" onClick={onClose}>
            <CloseGlyph />
          </button>
        </div>
      </header>
      <div className="msgbox-client">
        <form action={formAction}>
          <input type="hidden" name="userId" value={member.userId} />
          <div className="space-y-3 p-5 text-sm">
            <p>
              <strong>{member.name || member.email}</strong> · {member.email}
              {current && (
                <>
                  <br />
                  Tiene licencia hasta el {day(current)}: los meses se suman desde ese día.
                </>
              )}
            </p>
            <fieldset className="grid grid-cols-2 gap-2">
              <legend className="mb-1 font-semibold">¿Cuánto dura?</legend>
              {MONTHS.map((option) => (
                <label key={option.value} className="flex items-center gap-2">
                  <input type="radio" name="mode" value={option.value} checked={mode === option.value} onChange={() => setMode(option.value)} />
                  {option.label}
                </label>
              ))}
              <label className="flex items-center gap-2">
                <input type="radio" name="mode" value="forever" checked={mode === "forever"} onChange={() => setMode("forever")} />
                Sin límite
              </label>
              <label className="flex items-center gap-2">
                <input type="radio" name="mode" value="date" checked={mode === "date"} onChange={() => setMode("date")} />
                Hasta un día
              </label>
            </fieldset>
            {mode === "date" && (
              <label className="wizard-field">
                Último día
                <input type="date" name="day" min={today} value={date} onChange={(e) => setDate(e.target.value)} className="win-textbox" required />
              </label>
            )}
            <p className="font-semibold text-[#1e3287]">{preview}</p>
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
              {pending ? "Guardando…" : current ? "Renovar" : "Dar licencia"}
            </button>
          </div>
        </form>
      </div>
    </dialog>
  );
}
