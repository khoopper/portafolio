"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useId, useRef, useState } from "react";
import { CloseGlyph, Win7Icon } from "@/components/icons";
import { ALLOW_ALL, DENY_ALL, onPrivacyCenterOpen, saveConsent, useConsent, type Consent } from "@/lib/consent";

/** Green "go" circle of the Windows 7 setup wizard command links. */
function GoArrow() {
  return (
    <svg viewBox="0 0 24 24" className="size-6 shrink-0" aria-hidden="true">
      <defs>
        <linearGradient id="cmd-go" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#8fe88a" />
          <stop offset="0.5" stopColor="#2fae34" />
          <stop offset="1" stopColor="#1b7a21" />
        </linearGradient>
      </defs>
      <circle cx="12" cy="12" r="11" fill="url(#cmd-go)" stroke="#155f1a" />
      <path d="M6.5 12h9m-3.5-4 4 4-4 4" fill="none" stroke="#fff" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function CommandLink({ title, text, onClick }: { title: string; text: string; onClick: () => void }) {
  return (
    <button type="button" className="cmdlink" onClick={onClick}>
      <GoArrow />
      <span className="min-w-0">
        <span className="cmdlink-title">{title}</span>
        <span className="cmdlink-text">{text}</span>
      </span>
    </button>
  );
}

type View = "choose" | "custom";

/**
 * Privacy setup, styled after the Windows 7 first-run wizard. Opens by itself until the visitor
 * chooses (never on the legal pages, so they can be read first, nor in /admin); reopens from the
 * tray shield or the Start menu. The three answers carry equal weight, and closing the window
 * counts as the recommended setting (nothing optional is ever loaded by default).
 */
export function PrivacyCenter() {
  const pathname = usePathname();
  const consent = useConsent();
  const [manualOpen, setManualOpen] = useState(false);
  const [view, setView] = useState<View>("choose");
  const [draft, setDraft] = useState<Consent>(DENY_ALL);
  const ref = useRef<HTMLDialogElement>(null);
  const titleId = useId();

  const quiet = pathname.startsWith("/legal") || pathname.startsWith("/admin");
  const open = manualOpen || (consent === null && !quiet);

  useEffect(
    () =>
      onPrivacyCenterOpen(() => {
        setView("choose");
        setManualOpen(true);
      }),
    [],
  );

  useEffect(() => {
    const dialog = ref.current;
    if (open && dialog && !dialog.open) dialog.showModal();
    if (!open && dialog?.open) dialog.close();
  }, [open]);

  if (consent === undefined) return null; // server / hydration

  const choose = (value: Consent) => {
    saveConsent(value);
    setManualOpen(false);
  };
  const keep = () => choose(consent ?? DENY_ALL); // Esc / X: whatever was set, or the recommended setting
  const openCustom = () => {
    setDraft(consent ?? DENY_ALL);
    setView("custom");
  };

  return (
    <dialog
      ref={ref}
      className="msgbox privacy-dialog aero-frame"
      aria-labelledby={titleId}
      onCancel={(e) => {
        e.preventDefault();
        keep();
      }}
    >
      <header className="aero-titlebar">
        <Win7Icon name="shield-ok" className="aero-title-icon" />
        <h2 id={titleId} className="aero-title text-[13px]">
          Configuración de privacidad
        </h2>
        <div className="caption-btns">
          <button type="button" className="caption-btn caption-btn--close" aria-label="Cerrar" onClick={keep}>
            <CloseGlyph />
          </button>
        </div>
      </header>
      <div className="msgbox-client privacy-client">
        <div className="privacy-body">
          <h3 className="privacy-heading">Protege tu privacidad</h3>
          <p>
            Este sitio no usa cookies de publicidad. Cuenta las visitas de forma anónima, sin cookies ni IP. Los videos de YouTube y las estadísticas
            detalladas de Google Analytics solo se activan si tú lo permites.
          </p>

          {view === "choose" ? (
            <div className="mt-3 space-y-1">
              <CommandLink title="Usar la configuración recomendada" text="Solo lo estrictamente necesario. Sin videos externos ni Google Analytics." onClick={() => choose(DENY_ALL)} />
              <CommandLink title="Aceptar todo" text="Permite los videos de YouTube y las estadísticas de Google Analytics." onClick={() => choose(ALLOW_ALL)} />
              <CommandLink title="Personalizar" text="Elige qué categorías permites." onClick={openCustom} />
            </div>
          ) : (
            <fieldset className="privacy-fieldset">
              <legend className="sr-only">Categorías</legend>
              <label className="privacy-row">
                <input type="checkbox" checked disabled />
                <span>
                  <strong>Necesarias</strong> (siempre activas)
                  <span className="privacy-note">Recordar que ya entraste y tu elección de privacidad. Sin ellas el sitio no funciona.</span>
                </span>
              </label>
              <label className="privacy-row">
                <input type="checkbox" checked={draft.media} onChange={(e) => setDraft({ ...draft, media: e.target.checked })} />
                <span>
                  <strong>Contenido externo</strong> (YouTube y Vimeo)
                  <span className="privacy-note">Permite reproducir los videos incrustados. YouTube o Vimeo reciben tu IP y pueden guardar datos en tu navegador.</span>
                </span>
              </label>
              <label className="privacy-row">
                <input type="checkbox" checked={draft.analytics} onChange={(e) => setDraft({ ...draft, analytics: e.target.checked })} />
                <span>
                  <strong>Estadísticas</strong> (Google Analytics)
                  <span className="privacy-note">Google guarda cookies para medir cómo se usa el sitio (páginas, tiempo, origen). No se usan para publicidad.</span>
                </span>
              </label>
              <div className="mt-3 flex flex-wrap justify-end gap-2">
                <button type="button" className="win-button" onClick={() => setView("choose")}>
                  Atrás
                </button>
                <button type="button" className="win-button win-button--primary" onClick={() => choose(draft)}>
                  Guardar mi selección
                </button>
              </div>
            </fieldset>
          )}
        </div>
        <p className="privacy-links">
          Más información:{" "}
          <Link href="/legal/privacidad" className="win-link" onClick={() => setManualOpen(false)}>
            Política de privacidad
          </Link>
          {" · "}
          <Link href="/legal/cookies" className="win-link" onClick={() => setManualOpen(false)}>
            Cookies
          </Link>
          {" · "}
          <Link href="/legal/terminos" className="win-link" onClick={() => setManualOpen(false)}>
            Términos
          </Link>
        </p>
      </div>
    </dialog>
  );
}
