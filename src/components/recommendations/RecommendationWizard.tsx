"use client";

import Link from "next/link";
import { useActionState, useState, type ChangeEvent, type ReactNode } from "react";
import { siGoogle } from "simple-icons";
import { Avatar } from "@/components/Avatar";
import { IconWarning, Win7Icon } from "@/components/icons";
import { LIMITS, type RecommendationField } from "@/lib/recommendations/input";
import type { SubmitResult } from "@/app/r/[token]/actions";

export type WizardErrorReason = "invalid" | "used" | "expired" | "revoked" | "unavailable";
export type WizardNotice = "cancelado" | "error" | "sin-verificar";

interface Common {
  token: string;
  ownerName: string;
  projectTitle: string;
}

type WizardProps =
  | { step: "error"; reason: WizardErrorReason }
  | ({ step: "signin"; notice: WizardNotice | null } & Common)
  | ({
      step: "form";
      identity: { name: string; pictureUrl: string | null; provider: "Google" | "LinkedIn" };
      submit: (prev: SubmitResult | null, formData: FormData) => Promise<SubmitResult>;
    } & Common);

const ERROR_TEXT: Record<WizardErrorReason, string> = {
  invalid: "Este link de invitación no existe. Revisa que lo hayas copiado completo.",
  used: "Este link ya se usó. Cada invitación sirve para una sola recomendación.",
  expired: "Este link caducó. Pide uno nuevo a quien te lo envió.",
  revoked: "Este link fue anulado por quien lo envió.",
  unavailable: "El servicio no está disponible en este momento. Intenta más tarde; si tu link era válido, lo sigue siendo.",
};

const NOTICE_TEXT: Record<WizardNotice, string> = {
  cancelado: "No se completó el inicio de sesión. Elige una cuenta para continuar.",
  error: "Hubo un problema al iniciar sesión. Intenta de nuevo.",
  "sin-verificar": "Esa cuenta no tiene un correo verificado. Usa otra cuenta.",
};

export function RecommendationWizard(props: WizardProps) {
  if (props.step === "error") {
    return (
      <WizardFrame
        footer={
          <Link href="/" className="win-button win-button--primary">
            Ir al portafolio
          </Link>
        }
      >
        <div className="flex gap-4">
          <Win7Icon name="error" className="size-10 shrink-0" />
          <div>
            <h2 className="wizard-heading">No se puede abrir la invitación</h2>
            <p>{ERROR_TEXT[props.reason]}</p>
          </div>
        </div>
      </WizardFrame>
    );
  }
  if (props.step === "signin") return <SignInStep {...props} />;
  return <FormStep {...props} />;
}

function WizardFrame({ children, footer }: { children: ReactNode; footer: ReactNode }) {
  return (
    <div className="login-screen">
      <div className="wallpaper" aria-hidden="true" />
      <section aria-labelledby="wizard-title" className="aero-frame wizard">
        <header className="aero-titlebar">
          <Win7Icon name="user" className="aero-title-icon" />
          <h1 id="wizard-title" className="aero-title">
            Escribir una recomendación
          </h1>
        </header>
        <div className="wizard-client">
          <div className="wizard-body">{children}</div>
          <div className="msgbox-buttons">{footer}</div>
        </div>
      </section>
    </div>
  );
}

function SignInStep({ token, ownerName, projectTitle, notice }: Extract<WizardProps, { step: "signin" }>) {
  // Plain <a>, not <Link>: prefetching would call the route handler and start OAuth.
  const googleHref = `/auth/signin?provider=google&next=${encodeURIComponent(`/r/${token}`)}`;
  // Explicit, unticked-by-default consent before any personal data is requested from Google.
  const [agreed, setAgreed] = useState(false);
  return (
    <WizardFrame
      footer={
        <Link href="/" className="win-button">
          Cancelar
        </Link>
      }
    >
      <h2 className="wizard-heading">{ownerName} te pide una recomendación</h2>
      <p>
        Es sobre el proyecto <strong>{projectTitle}</strong>. Para que tu recomendación sea verificable, inicia sesión con tu cuenta de Google: solo
        usamos tu nombre, tu foto y tu correo (el correo no se publica).
      </p>
      {notice && (
        <p role="alert" className="wizard-alert">
          <IconWarning className="size-4 shrink-0" />
          {NOTICE_TEXT[notice]}
        </p>
      )}
      <label className="mt-4 flex items-start gap-2 text-sm">
        <input type="checkbox" checked={agreed} onChange={(e) => setAgreed(e.target.checked)} className="mt-1 size-4 shrink-0" />
        <span>
          Acepto que se usen mi nombre, foto y correo para verificar mi identidad, y que mi nombre, foto, cargo, empresa, dominio del correo y
          recomendación se publiquen en este portafolio. Puedo pedir que se retire cuando quiera. Más información en la{" "}
          <Link href="/legal/privacidad" target="_blank" rel="noopener noreferrer" className="win-link">
            Política de privacidad
          </Link>
          .
        </span>
      </label>
      <div className="mt-5 flex justify-center">
        <a
          href={agreed ? googleHref : undefined}
          role={agreed ? undefined : "link"}
          aria-disabled={!agreed}
          className={`wizard-provider w-full sm:w-auto sm:min-w-[260px] justify-center text-center font-medium ${agreed ? "" : "pointer-events-none opacity-50"}`}
        >
          <svg viewBox="0 0 24 24" className="size-5 shrink-0" aria-hidden="true">
            <path d={siGoogle.path} fill={`#${siGoogle.hex}`} />
          </svg>
          Continuar con Google
        </a>
      </div>
    </WizardFrame>
  );
}

function FormStep({ ownerName, projectTitle, identity, submit }: Extract<WizardProps, { step: "form" }>) {
  const [state, formAction, pending] = useActionState(submit, null);
  // Controlled fields: React resets uncontrolled forms after an action, and a validation error must not wipe the text.
  const [values, setValues] = useState<Record<RecommendationField, string>>({ role: "", company: "", body: "" });

  if (state?.ok) {
    return (
      <WizardFrame
        footer={
          <Link href="/" className="win-button win-button--primary">
            Ver el portafolio
          </Link>
        }
      >
        <div className="flex gap-4">
          <Win7Icon name="ok" className="size-10 shrink-0" />
          <div>
            <h2 className="wizard-heading">¡Gracias!</h2>
            <p>Tu recomendación quedó enviada. Se publicará cuando {ownerName} la revise.</p>
          </div>
        </div>
      </WizardFrame>
    );
  }

  const field = (name: RecommendationField) => ({
    name,
    value: values[name],
    required: true,
    maxLength: LIMITS[name].max,
    onChange: (e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => setValues((v) => ({ ...v, [name]: e.target.value })),
    "aria-invalid": state?.fieldErrors?.[name] ? true : undefined,
    "aria-describedby": state?.fieldErrors?.[name] ? `${name}-error` : undefined,
  });
  const fieldError = (name: RecommendationField) =>
    state?.fieldErrors?.[name] && (
      <span id={`${name}-error`} className="wizard-error">
        {state.fieldErrors[name]}
      </span>
    );

  return (
    <form action={formAction}>
      <WizardFrame
        footer={
          <>
            <Link href="/" className="win-button">
              Cancelar
            </Link>
            <button type="submit" className="win-button win-button--primary min-w-[74px]" disabled={pending}>
              {pending ? "Enviando…" : "Enviar"}
            </button>
          </>
        }
      >
        <h2 className="wizard-heading">Tu recomendación sobre {projectTitle}</h2>
        <div className="wizard-identity">
          {identity.pictureUrl ? (
            // Provider photo (Google/LinkedIn host): plain img, no referrer.
            // eslint-disable-next-line @next/next/no-img-element
            <img src={identity.pictureUrl} alt="" width={40} height={40} referrerPolicy="no-referrer" className="size-10 rounded-md object-cover" />
          ) : (
            <Avatar src={null} name={identity.name} size={40} />
          )}
          <div className="min-w-0">
            <p className="truncate font-semibold">{identity.name}</p>
            <p className="text-xs text-win-muted">Verificado con {identity.provider}</p>
          </div>
        </div>
        {state?.error && (
          <p role="alert" className="wizard-alert">
            <IconWarning className="size-4 shrink-0" />
            {state.error}
          </p>
        )}
        <div className="mt-3 grid gap-3 sm:grid-cols-2">
          <label className="wizard-field">
            Cargo
            <input className="win-textbox" autoComplete="organization-title" placeholder="Ej. Directora" {...field("role")} />
            {fieldError("role")}
          </label>
          <label className="wizard-field">
            Empresa
            <input className="win-textbox" autoComplete="organization" placeholder="Ej. Clínica San Rafael" {...field("company")} />
            {fieldError("company")}
          </label>
        </div>
        <label className="wizard-field mt-3">
          Recomendación
          <textarea className="win-textbox min-h-[140px]" rows={6} {...field("body")} />
          {fieldError("body")}
        </label>
        <p className="mt-1 text-right text-xs text-win-muted" aria-live="polite">
          {[...values.body].length} / {LIMITS.body.max}
        </p>
        <p className="mt-2 text-xs text-win-muted">
          Se publicarán tu nombre, tu foto, tu cargo, tu empresa y, si tu correo es de empresa, su dominio (por ejemplo «clinica.com»). Tu correo completo
          nunca se muestra.
        </p>
      </WizardFrame>
    </form>
  );
}
