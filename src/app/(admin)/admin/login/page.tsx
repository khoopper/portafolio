"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useActionState, useEffect, useRef } from "react";
import { Turnstile } from "@/components/admin/Turnstile";
import { ArrowGlyph, BackButtonImage, IconWarning } from "@/components/icons";
import { IconAdminShield } from "@/components/icons/admin-icons";
import { adminReturnPath } from "@/lib/recommendations/safe-next";
import { adminLoginAction, type LoginState } from "../actions";

const TURNSTILE_SITE_KEY = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY ?? "";

// useSearchParams needs a Suspense boundary so the rest of the page can be prerendered.
export default function AdminLoginPage() {
  return (
    <Suspense>
      <AdminLogin />
    </Suspense>
  );
}

function AdminLogin() {
  const router = useRouter();
  const searchParams = useSearchParams();
  // Never router.push an arbitrary URL: an external `from` would send the admin to a look-alike right after login.
  const from = adminReturnPath(searchParams.get("from"));
  const [state, formAction, isPending] = useActionState<LoginState, FormData>(adminLoginAction, { step: "credentials" });
  const firstField = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (state.step === "done") {
      router.replace(from);
      router.refresh();
    }
  }, [state, from, router]);

  useEffect(() => {
    firstField.current?.focus();
  }, [state.step]);

  const busy = isPending || state.step === "done";
  const arrow = (label: string) => (
    <button type="submit" disabled={busy} className="login-go" aria-label={label} title={label}>
      <ArrowGlyph />
    </button>
  );

  return (
    <div className="login-screen">
      <div className="wallpaper" aria-hidden="true" />

      <div className="absolute left-6 top-6 z-20">
        <Link href="/escritorio" className="win-button flex items-center gap-2 text-xs shadow-md transition-all hover:brightness-105">
          <BackButtonImage className="size-4" />
          <span>Volver al Portafolio</span>
        </Link>
      </div>

      <main className="login-center">
        <div className="user-tile flex items-center justify-center p-3">
          <div className="flex size-full items-center justify-center rounded-lg bg-gradient-to-br from-blue-700/40 via-blue-900/60 to-slate-900/80 p-3 shadow-inner">
            <IconAdminShield className="size-20 drop-shadow-md" />
          </div>
        </div>

        <h1 className="login-name">Administrador</h1>

        <form action={formAction} className="flex flex-col items-center">
          {state.step === "credentials" && (
            <>
              <input type="hidden" name="step" value="credentials" />
              {/* Win7 logon rows: fields centered, the blue arrow hangs to the right of the last one. */}
              <div className="login-field">
                <input
                  ref={firstField}
                  type="email"
                  name="email"
                  placeholder="Correo electrónico"
                  aria-label="Correo electrónico"
                  disabled={busy}
                  required
                  maxLength={254}
                  autoComplete="username"
                  className="login-input"
                />
                <span className="w-[30px] shrink-0" aria-hidden="true" />
              </div>
              <div className="login-field login-field--next">
                <input
                  type="password"
                  name="password"
                  placeholder="Contraseña"
                  aria-label="Contraseña"
                  disabled={busy}
                  required
                  maxLength={256}
                  autoComplete="current-password"
                  className="login-input"
                />
                {arrow("Iniciar sesión")}
              </div>
              {TURNSTILE_SITE_KEY && <Turnstile siteKey={TURNSTILE_SITE_KEY} resetKey={state} />}
            </>
          )}

          {state.step === "enroll" && state.qr && (
            <div className="login-enroll">
              <p className="font-semibold">Protege tu cuenta con un segundo paso</p>
              <p className="mt-1">
                Escanea el código con una app de autenticación (Google Authenticator, Microsoft Authenticator, 1Password…) y escribe el código de 6
                dígitos que te muestre.
              </p>
              {/* QR from Supabase as a data: URL (allowed by img-src data:). */}
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={state.qr} alt="Código QR para la app de autenticación" width={160} height={160} className="mx-auto my-2 size-40 bg-white" />
              <p className="text-[11px] text-win-muted">
                ¿No puedes escanear? Clave manual: <code className="select-all break-all">{state.secret}</code>
              </p>
            </div>
          )}

          {(state.step === "code" || state.step === "enroll") && (
            <>
              <input type="hidden" name="step" value="code" />
              <div className="login-field">
                <input
                  ref={firstField}
                  type="text"
                  name="code"
                  inputMode="numeric"
                  pattern="[0-9 ]{6,7}"
                  placeholder="Código de 6 dígitos"
                  aria-label="Código de verificación de 6 dígitos"
                  disabled={busy}
                  required
                  maxLength={7}
                  autoComplete="one-time-code"
                  className="login-input text-center tracking-[0.3em]"
                />
                {arrow("Verificar código")}
              </div>
              {state.step === "code" && <p className="login-hint">Abre tu app de autenticación y escribe el código.</p>}
            </>
          )}

          {state.error && (
            <div
              role="alert"
              className="relative mt-3 flex w-[256px] items-start gap-2 rounded border border-[#e2a82b] bg-[#fffbe6] p-2.5 text-left text-xs text-[#523b00] shadow-[0_2px_8px_rgba(0,0,0,0.25)]"
            >
              <div className="absolute -top-2 left-6 size-0 border-x-8 border-b-8 border-x-transparent border-b-[#e2a82b]" aria-hidden="true" />
              <IconWarning className="size-4 shrink-0" />
              <span>{state.error}</span>
            </div>
          )}
        </form>
      </main>

      <footer className="login-brand">khoopper.com</footer>
    </div>
  );
}
