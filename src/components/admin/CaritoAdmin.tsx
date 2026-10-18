"use client";

import { useActionState, useEffect, useRef, useState, useTransition, type ReactNode } from "react";
import {
  createCaritoLicenceAction,
  createOwnerPairingAction,
  deleteCaritoLicenceAction,
  deleteCaritoMemberAction,
  grantCaritoLicenceAction,
  releaseCaritoLicenceDeviceAction,
  releaseCaritoDeviceAction,
  renewCaritoLicenceAction,
  setCaritoLicenceRevokedAction,
  setCaritoRevokedAction,
} from "@/app/(admin)/admin/carito-actions";
import { CloseGlyph } from "@/components/icons";
import { Tabs } from "@/components/win7/Tabs";
import {
  CARITO_TIME_ZONE,
  addMonths,
  caritoToday,
  formatLicenceCode,
  hasAccess,
  licenceHasAccess,
  licenceInTrial,
  licenceMessage,
  renewedUntil,
  stateLabel,
  type MemberState,
} from "@/lib/carito/licence";
import type { CaritoLicence, LicenceState } from "@/lib/carito/licences";
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

const LICENCE_BADGE: Record<LicenceState["kind"], string> = {
  forever: BADGE.forever,
  licence: BADGE.licence,
  trial: BADGE.trial,
  trial_waiting: BADGE.trial,
  trial_ended: BADGE.trial_ended,
  waiting: BADGE.waiting,
  expired: BADGE.expired,
  revoked: BADGE.revoked,
};

/**
 * Carito Music: todas las licencias en un solo lugar, en el orden Todos · Con acceso · En prueba · Revocados · Sin acceso. Cada pestaña
 * muestra las licencias que el dueño reparte (el amigo escribe el código una vez y su teléfono queda ligado a ella, con sus playlists)
 * y, si hay, las cuentas de Google (prueba de 3 días). Las licencias de la 2.6 suben solas desde el teléfono del dueño.
 */
export function CaritoAdmin({ members, licences }: { members: CaritoMember[]; licences: CaritoLicence[] | null }) {
  const [creating, setCreating] = useState(false);
  const [renewing, setRenewing] = useState<CaritoLicence | null>(null);
  const [granting, setGranting] = useState<CaritoMember | null>(null);
  const [pairing, setPairing] = useState(false);
  const all = licences ?? [];

  const groups = [
    { id: "todos", label: "Todos", licences: all, members, empty: "Todavía no hay licencias ni cuentas." },
    {
      id: "activos",
      label: "Con acceso",
      licences: all.filter((l) => licenceHasAccess(l.state)),
      members: members.filter((m) => hasAccess(m.state) && m.state.kind !== "trial"),
      empty: "Nadie tiene acceso todavía.",
    },
    {
      id: "prueba",
      label: "En prueba",
      licences: all.filter((l) => licenceInTrial(l.state)),
      members: members.filter((m) => m.state.kind === "trial"),
      empty: "Nadie está en prueba.",
    },
    {
      id: "revocados",
      label: "Revocados",
      licences: all.filter((l) => l.state.kind === "revoked"),
      members: members.filter((m) => m.state.kind === "revoked"),
      empty: "No revocaste ninguna licencia.",
    },
    {
      id: "sin",
      label: "Sin acceso",
      licences: all.filter((l) => !licenceHasAccess(l.state) && !licenceInTrial(l.state) && l.state.kind !== "revoked"),
      members: members.filter((m) => !hasAccess(m.state) && m.state.kind !== "revoked"),
      empty: "Nadie se quedó sin acceso.",
    },
  ];

  return (
    <div className="p-5">
      <div className="mb-4 flex flex-wrap items-start justify-between gap-3 border-b border-[#d5dfe5] pb-3">
        <div className="max-w-2xl">
          <h2 className="win-h1">Carito Music</h2>
          <p className="mt-0.5 text-xs text-win-muted">
            El amigo escribe su licencia una vez en la app: su teléfono queda ligado a ella y sus playlists se guardan con ella. Una licencia
            revocada deja de abrir en cuanto el teléfono se conecta (sin conexión, a más tardar en 30 días). Lo mismo se maneja desde el
            teléfono del dueño, en Ajustes &gt; Cuenta y licencia.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button type="button" className="win-button win-button--primary text-xs" onClick={() => setCreating(true)} disabled={!licences}>
            Crear licencia
          </button>
          <button type="button" className="win-button text-xs" onClick={() => setPairing(true)} disabled={!licences}>
            Vincular mi teléfono
          </button>
        </div>
      </div>

      {!licences && <MissingLicences />}

      <Tabs
        label="Carito Music"
        tabs={groups.map((g) => ({
          id: g.id,
          label: `${g.label} (${g.licences.length + g.members.length})`,
          content:
            g.licences.length + g.members.length === 0 ? (
              <p className="p-4 text-sm text-win-muted">{g.empty}</p>
            ) : (
              <div className="space-y-4">
                {g.licences.length > 0 && (
                  <section>
                    <h3 className="mb-1.5 text-xs font-semibold text-[#1e3287]">Licencias ({g.licences.length})</h3>
                    <LicencesTable items={g.licences} empty="" onRenew={setRenewing} />
                  </section>
                )}
                {g.members.length > 0 && (
                  <section>
                    <h3 className="mb-1.5 text-xs font-semibold text-[#1e3287]">Cuentas de Google ({g.members.length})</h3>
                    <MembersTable items={g.members} empty="" onGrant={setGranting} />
                  </section>
                )}
              </div>
            ),
        }))}
      />

      {creating && <CreateLicenceDialog onClose={() => setCreating(false)} />}
      {renewing && <RenewLicenceDialog licence={renewing} onClose={() => setRenewing(null)} />}
      {pairing && <PairingDialog onClose={() => setPairing(false)} />}
      {granting && <GrantDialog member={granting} onClose={() => setGranting(null)} />}
    </div>
  );
}

/** Falta la segunda migración (`20261018010000_carito_licences.sql`): el panel lo dice sin romper la página. */
function MissingLicences() {
  return (
    <p className="mb-3 p-1 text-sm text-win-muted">
      No se pudieron leer las licencias. Si es la primera vez, ejecuta <code>supabase/migrations/20261018010000_carito_licences.sql</code> en
      el SQL Editor de Supabase y recarga; si no, Supabase tardó en responder.
    </p>
  );
}

/** Hasta cuándo abre una licencia, como lo lee el dueño. */
function licenceUntil(state: LicenceState): string | null {
  switch (state.kind) {
    case "licence":
      return `hasta el ${day(state.until)}`;
    case "expired":
      return `venció el ${day(state.until)}`;
    case "trial":
      return `termina el ${day(state.until)}`;
    case "trial_waiting":
      return "empieza cuando la escriba";
    case "trial_ended":
      return `terminó el ${day(state.until)}`;
    default:
      return null;
  }
}

function LicencesTable({ items, empty, onRenew }: { items: CaritoLicence[]; empty: string; onRenew: (l: CaritoLicence) => void }) {
  if (!items.length) return <p className="p-4 text-sm text-win-muted">{empty}</p>;
  return (
    <DetailsTable head={["Licencia", "Para", "Teléfono", "Estado", "Biblioteca", "Último uso", "Acciones"]}>
      {items.map((l) => {
        const until = licenceUntil(l.state);
        return (
          <tr key={l.id} className="align-top hover:bg-[#eef5fc]">
            <td className="p-2.5">
              <span className="block font-mono text-[13px] font-semibold text-[#1e3287]">{formatLicenceCode(l.code)}</span>
              <span className="block text-win-muted">creada {day(l.createdAt.slice(0, 10))}</span>
              {l.source === "import" && <span className="block text-[11px] text-win-muted">Importada de la 2.6</span>}
              {l.source === "app" && <span className="block text-[11px] text-win-muted">Hecha en tu teléfono</span>}
            </td>
            <td className="p-2.5 font-semibold">{l.name || <span className="font-normal text-win-muted">—</span>}</td>
            <td className="p-2.5">
              <span className="block">{l.deviceModel ?? <span className="text-win-muted">Sin escribir todavía</span>}</span>
              {l.deviceCode && (
                <span className="block font-mono text-win-muted">
                  {l.deviceCode}
                  {l.appVersion ? ` · v${l.appVersion}` : ""}
                </span>
              )}
              {l.deviceChanges > 0 && <span className="block text-[11px] text-win-muted">Cambió de teléfono {l.deviceChanges}×</span>}
            </td>
            <td className="p-2.5">
              <span className={`inline-block rounded border px-2 py-0.5 font-semibold ${LICENCE_BADGE[l.state.kind]}`}>{licenceStateLabel(l)}</span>
              {until && <span className="mt-0.5 block text-win-muted">{until}</span>}
            </td>
            <td className="whitespace-nowrap p-2.5">
              {l.librarySavedAt ? (
                <>
                  <span className="block">
                    {l.playlists} playlists · {l.favorites} favoritas
                  </span>
                  <span className="block text-win-muted">copia {moment(l.librarySavedAt)}</span>
                </>
              ) : (
                <span className="text-win-muted">Sin copia</span>
              )}
            </td>
            <td className="whitespace-nowrap p-2.5">
              {l.lastSeenAt ? (
                <>
                  <span className="block">{moment(l.lastSeenAt)}</span>
                  {l.activatedAt && <span className="block text-win-muted">activada {day(l.activatedAt.slice(0, 10))}</span>}
                </>
              ) : (
                <span className="text-win-muted">Nunca la escribió</span>
              )}
            </td>
            <td className="space-y-1 p-2.5">
              <div className="flex flex-wrap gap-1">
                <button type="button" className={`${small} win-button--primary`} onClick={() => onRenew(l)}>
                  Cambiar fecha
                </button>
                {l.state.kind === "revoked" ? (
                  <ConfirmForm action={setCaritoLicenceRevokedAction} fields={{ licenceId: l.id, revoke: "0" }} label="Restaurar" />
                ) : (
                  <ConfirmForm
                    action={setCaritoLicenceRevokedAction}
                    fields={{ licenceId: l.id, revoke: "1" }}
                    label="Revocar"
                    question={`¿Quitarle el acceso a esta licencia${l.name ? ` de ${l.name}` : ""}? El teléfono se bloquea en cuanto se conecte.`}
                  />
                )}
              </div>
              <details className="text-[11px]">
                <summary className="cursor-pointer text-win-muted">Más</summary>
                <div className="mt-1 flex flex-wrap gap-1">
                  <CopyCode code={l.code} />
                  {l.deviceCode && (
                    <ConfirmForm
                      action={releaseCaritoLicenceDeviceAction}
                      fields={{ licenceId: l.id }}
                      label="Pasar a otro teléfono"
                      question={`Para cuando ${l.name || "la persona"} cambia de teléfono: ${l.deviceModel ?? "el teléfono actual"} deja de abrir y la licencia queda libre para el próximo teléfono que la escriba. ¿Continuar?`}
                    />
                  )}
                  <ConfirmForm
                    action={deleteCaritoLicenceAction}
                    fields={{ licenceId: l.id }}
                    label="Eliminar"
                    question={`¿Eliminar la licencia ${formatLicenceCode(l.code)} y la copia de su biblioteca? El teléfono se bloquea en cuanto se conecte. No se puede deshacer.`}
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

function licenceStateLabel(l: CaritoLicence): string {
  switch (l.state.kind) {
    case "revoked":
      return "Revocada";
    case "forever":
      return "Sin límite";
    case "licence":
      return l.state.daysLeft === 0 ? "Último día" : `${l.state.daysLeft} ${l.state.daysLeft === 1 ? "día" : "días"}`;
    case "expired":
      return "Vencida";
    case "trial":
      return `Prueba · ${l.state.daysLeft === 0 ? "último día" : `${l.state.daysLeft} ${l.state.daysLeft === 1 ? "día" : "días"}`}`;
    case "trial_waiting":
      return `Prueba de ${l.state.days} días`;
    case "trial_ended":
      return "Prueba terminada";
    case "waiting":
      return "Sin usar";
  }
}

/** Copia el código al portapapeles. */
function CopyCode({ code }: { code: string }) {
  const [done, setDone] = useState(false);
  return (
    <button
      type="button"
      className={small}
      onClick={async () => {
        try {
          await navigator.clipboard.writeText(formatLicenceCode(code));
          setDone(true);
          setTimeout(() => setDone(false), 1500);
        } catch {
          // Sin permiso del navegador: el código se copia a mano.
        }
      }}
    >
      {done ? "Copiado" : "Copiar código"}
    </button>
  );
}

// --- Dar / renovar / vincular ----------------------------------------------------------------------------------------------

/** Crear una licencia: para quién, para qué teléfono (si se sabe) y cuánto dura. Al final muestra el código para mandarlo. */
function CreateLicenceDialog({ onClose }: { onClose: () => void }) {
  const ref = useRef<HTMLDialogElement>(null);
  const [state, formAction, pending] = useActionState(createCaritoLicenceAction, null);
  const [mode, setMode] = useState<string>("3");
  const today = caritoToday();
  const [date, setDate] = useState(addMonths(today, 3));

  useEffect(() => {
    if (!ref.current?.open) ref.current?.showModal();
  }, []);

  const code = state?.ok ? state.code : undefined;
  const untilDay = mode === "forever" || mode === "trial" ? null : mode === "date" ? day(date) : day(renewedUntil(null, Number(mode)));
  const message = code ? licenceMessage("", code, untilDay, mode === "trial" ? 3 : null) : "";

  return (
    <dialog
      ref={ref}
      className="msgbox aero-frame"
      aria-labelledby="create-licence-title"
      onCancel={(e) => {
        e.preventDefault();
        onClose();
      }}
    >
      <header className="aero-titlebar">
        <h2 id="create-licence-title" className="aero-title pl-1 text-[13px]">
          Crear licencia
        </h2>
        <div className="caption-btns">
          <button type="button" className="caption-btn caption-btn--close" aria-label="Cerrar" onClick={onClose}>
            <CloseGlyph />
          </button>
        </div>
      </header>
      <div className="msgbox-client">
        {code ? (
          <div className="space-y-3 p-5 text-sm">
            <p>
              Listo. Mándale este código; se escribe una vez, donde dice <strong>«Introduce tu licencia»</strong>:
            </p>
            <p className="text-center font-mono text-2xl font-bold tracking-wider text-[#1e3287]">{formatLicenceCode(code)}</p>
            <p className="text-win-muted">{message}</p>
          </div>
        ) : (
          <form action={formAction}>
            <div className="space-y-3 p-5 text-sm">
              <label className="wizard-field">
                ¿Para quién? (opcional)
                <input type="text" name="name" maxLength={60} placeholder="Ana" className="win-textbox" />
              </label>
              <label className="wizard-field">
                Código del teléfono (opcional)
                <input type="text" name="device" maxLength={9} placeholder="K7P2Q" className="win-textbox uppercase" />
                <span className="text-[11px] text-win-muted">Lo muestra la app en Ajustes &gt; Cuenta y licencia. Si no lo pones, la toma el primero que la escriba.</span>
              </label>
              <DurationFields mode={mode} setMode={setMode} date={date} setDate={setDate} today={today} allowTrial />
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
                {pending ? "Creando…" : "Crear licencia"}
              </button>
            </div>
          </form>
        )}
        {code && (
          <div className="msgbox-buttons">
            <CopyCode code={code} />
            <button type="button" className="win-button win-button--primary" onClick={onClose}>
              Listo
            </button>
          </div>
        )}
      </div>
    </dialog>
  );
}

/** Renovar: los meses se suman desde el final de la licencia vigente, como en las personas registradas. */
function RenewLicenceDialog({ licence, onClose }: { licence: CaritoLicence; onClose: () => void }) {
  const ref = useRef<HTMLDialogElement>(null);
  const [state, formAction, pending] = useActionState(renewCaritoLicenceAction, null);
  const [mode, setMode] = useState<string>("3");
  const today = caritoToday();
  const [date, setDate] = useState(addMonths(today, 3));
  const current = licence.state.kind === "licence" ? licence.state.until : null;

  useEffect(() => {
    if (!ref.current?.open) ref.current?.showModal();
  }, []);
  useEffect(() => {
    if (state?.ok) onClose();
  }, [state, onClose]);

  const preview = mode === "forever" ? "Sin fecha de vencimiento" : `Hasta el ${day(mode === "date" ? date : renewedUntil(current, Number(mode)))}`;

  return (
    <dialog
      ref={ref}
      className="msgbox aero-frame"
      aria-labelledby="renew-licence-title"
      onCancel={(e) => {
        e.preventDefault();
        onClose();
      }}
    >
      <header className="aero-titlebar">
        <h2 id="renew-licence-title" className="aero-title pl-1 text-[13px]">
          Cambiar fecha
        </h2>
        <div className="caption-btns">
          <button type="button" className="caption-btn caption-btn--close" aria-label="Cerrar" onClick={onClose}>
            <CloseGlyph />
          </button>
        </div>
      </header>
      <div className="msgbox-client">
        <form action={formAction}>
          <input type="hidden" name="licenceId" value={licence.id} />
          <div className="space-y-3 p-5 text-sm">
            <p>
              <strong>{formatLicenceCode(licence.code)}</strong>
              {licence.name && ` · ${licence.name}`}
              {current && (
                <>
                  <br />
                  Abre hasta el {day(current)}: los meses se suman desde ese día.
                </>
              )}
              {licence.state.kind === "revoked" && (
                <>
                  <br />
                  Está revocada: al renovarla vuelve a abrir.
                </>
              )}
            </p>
            <DurationFields mode={mode} setMode={setMode} date={date} setDate={setDate} today={today} />
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
              {pending ? "Guardando…" : "Guardar"}
            </button>
          </div>
        </form>
      </div>
    </dialog>
  );
}

/** El código de 15 minutos que el teléfono del dueño escribe en la app para vincularse al panel. */
function PairingDialog({ onClose }: { onClose: () => void }) {
  const ref = useRef<HTMLDialogElement>(null);
  const [code, setCode] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [, start] = useTransition();

  useEffect(() => {
    if (!ref.current?.open) ref.current?.showModal();
    start(async () => {
      const result = await createOwnerPairingAction();
      if (result.ok && result.code) setCode(result.code);
      else setError(result.error ?? "No se pudo crear el código.");
    });
  }, [start]);

  return (
    <dialog
      ref={ref}
      className="msgbox aero-frame"
      aria-labelledby="pairing-title"
      onCancel={(e) => {
        e.preventDefault();
        onClose();
      }}
    >
      <header className="aero-titlebar">
        <h2 id="pairing-title" className="aero-title pl-1 text-[13px]">
          Vincular mi teléfono
        </h2>
        <div className="caption-btns">
          <button type="button" className="caption-btn caption-btn--close" aria-label="Cerrar" onClick={onClose}>
            <CloseGlyph />
          </button>
        </div>
      </header>
      <div className="msgbox-client">
        <div className="space-y-3 p-5 text-sm">
          {code ? (
            <>
              <p>
                En tu teléfono, abre <strong>Ajustes &gt; Cuenta y licencia &gt; Soy el dueño &gt; Vincular con el panel</strong> y escribe:
              </p>
              <p className="text-center font-mono text-2xl font-bold tracking-wider text-[#1e3287]">{code.slice(0, 4)}-{code.slice(4)}</p>
              <p className="text-win-muted">
                Vale 15 minutos y una sola vez. Con esto tu teléfono maneja todas las licencias y sube solas las que hiciste en la 2.6.
              </p>
            </>
          ) : error ? (
            <p role="alert" className="wizard-alert">
              {error}
            </p>
          ) : (
            <p className="text-win-muted">Preparando el código…</p>
          )}
        </div>
        <div className="msgbox-buttons">
          <button type="button" className="win-button" onClick={onClose}>
            Cerrar
          </button>
        </div>
      </div>
    </dialog>
  );
}

/** La duración que ofrecen los tres diálogos (dar, crear y renovar): 1, 3, 6 o 12 meses, un día, o sin límite. */
function DurationFields({
  mode,
  setMode,
  date,
  setDate,
  today,
  allowTrial = false,
}: {
  mode: string;
  setMode: (mode: string) => void;
  date: string;
  setDate: (date: string) => void;
  today: string;
  /** Solo al crear: una prueba de 3 días que empieza cuando la persona la escribe. */
  allowTrial?: boolean;
}) {
  return (
    <>
      <fieldset className="grid grid-cols-2 gap-2">
        <legend className="mb-1 font-semibold">¿Cuánto dura?</legend>
        {allowTrial && (
          <label className="col-span-2 flex items-center gap-2">
            <input type="radio" name="mode" value="trial" checked={mode === "trial"} onChange={() => setMode("trial")} />
            Prueba gratis de 3 días <span className="text-win-muted">(empiezan cuando la escriba)</span>
          </label>
        )}
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
    </>
  );
}

// --- Piezas compartidas ----------------------------------------------------------------------------------------------------

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

  const preview = mode === "forever" ? "Sin fecha de vencimiento" : `Hasta el ${day(mode === "date" ? date : renewedUntil(current, Number(mode)))}`;

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
            <DurationFields mode={mode} setMode={setMode} date={date} setDate={setDate} today={today} />
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
