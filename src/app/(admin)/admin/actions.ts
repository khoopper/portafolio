"use server";

import { redirect } from "next/navigation";
import { adminEmail, isAdminConfigured } from "@/lib/admin-auth";
import { createSessionClient } from "@/lib/supabase";

export type LoginStep = "credentials" | "code" | "enroll" | "done";

export interface LoginState {
  step: LoginStep;
  error?: string;
  /** First login only: QR (data: URL) and manual key to add the account to an authenticator app. */
  qr?: string;
  secret?: string;
}

// One message for every credential failure: never reveal whether the email or the password was wrong.
const BAD_CREDENTIALS = "El correo o la contraseña no son correctos.";
const BAD_CODE = "El código no es correcto o ya caducó.";
const TOO_MANY = "Demasiados intentos. Espera unos minutos y vuelve a intentarlo.";
const BOT_CHECK = "No pudimos comprobar que no eres un robot. Vuelve a intentarlo.";
const NOT_CONFIGURED = "El panel no está disponible en este momento.";

const EMAIL = /^[^\s@]{1,64}@[^\s@]{1,190}\.[^\s@]{2,}$/;

function authError(error: { code?: string; status?: number } | null): string {
  if (error?.code === "captcha_failed") return BOT_CHECK;
  if (error?.status === 429 || error?.code === "over_request_rate_limit") return TOO_MANY;
  return BAD_CREDENTIALS;
}

/** Single entry for the login wizard: step 1 = email + password (+ anti-bot), step 2 = 6-digit code. */
export async function adminLoginAction(prev: LoginState, formData: FormData): Promise<LoginState> {
  if (!isAdminConfigured()) return { step: "credentials", error: NOT_CONFIGURED };
  return formData.get("step") === "code" ? verifyCode(prev, formData) : signIn(formData);
}

async function signIn(formData: FormData): Promise<LoginState> {
  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  const password = String(formData.get("password") ?? "");
  const captchaToken = String(formData.get("cf-turnstile-response") ?? "") || undefined;
  if (!EMAIL.test(email) || !password || password.length > 256) return { step: "credentials", error: BAD_CREDENTIALS };

  const supabase = await createSessionClient();
  const { data, error } = await supabase.auth.signInWithPassword({ email, password, options: { captchaToken } });
  if (error || !data.user) return { step: "credentials", error: authError(error) };

  // A valid account that is not the admin gets exactly the same answer as a wrong password.
  if (data.user.email?.toLowerCase() !== adminEmail()) {
    await supabase.auth.signOut({ scope: "local" });
    return { step: "credentials", error: BAD_CREDENTIALS };
  }

  const { data: factors } = await supabase.auth.mfa.listFactors();
  const totp = (factors?.all ?? []).filter((f) => f.factor_type === "totp");
  if (totp.some((f) => f.status === "verified")) return { step: "code" };

  // First login: register an authenticator app. Drop half-finished enrollments first.
  for (const f of totp) await supabase.auth.mfa.unenroll({ factorId: f.id });
  const { data: enrolled, error: enrollError } = await supabase.auth.mfa.enroll({ factorType: "totp", friendlyName: "Portafolio admin" });
  if (enrollError || !enrolled) {
    console.error("[admin] no se pudo iniciar el registro del segundo factor:", enrollError?.message);
    return { step: "credentials", error: NOT_CONFIGURED };
  }
  return { step: "enroll", qr: enrolled.totp.qr_code, secret: enrolled.totp.secret };
}

async function verifyCode(prev: LoginState, formData: FormData): Promise<LoginState> {
  const retry = (error: string): LoginState => ({ ...prev, error });
  const code = String(formData.get("code") ?? "").replace(/\s/g, "");
  if (!/^\d{6}$/.test(code)) return retry(BAD_CODE);

  const supabase = await createSessionClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  // Session gone or not the admin: start over without saying why.
  if (!user || user.email?.toLowerCase() !== adminEmail()) return { step: "credentials", error: BAD_CREDENTIALS };

  const { data: factors } = await supabase.auth.mfa.listFactors();
  const totp = (factors?.all ?? []).filter((f) => f.factor_type === "totp");
  const factor = totp.find((f) => f.status === "verified") ?? totp[0];
  if (!factor) return { step: "credentials", error: BAD_CREDENTIALS };

  const { error } = await supabase.auth.mfa.challengeAndVerify({ factorId: factor.id, code });
  if (error) return retry(error.status === 429 ? TOO_MANY : BAD_CODE);
  return { step: "done" };
}

export async function logoutAction(): Promise<void> {
  const supabase = await createSessionClient();
  // Global: revokes every refresh token of the admin, not just this browser's.
  await supabase.auth.signOut({ scope: "global" });
  redirect("/admin/login");
}
