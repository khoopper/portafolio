"use client";

import { useActionState } from "react";
import { saveProfileAction, type FormResult } from "@/app/(admin)/admin/settings-actions";
import { InfoBar } from "@/components/win7/InfoBar";
import type { EditableProfile } from "@/lib/profile-input";

/** Public profile text (Sobre mí, Inicio, login). Submitted by the «Guardar cambios» button in the window header. */
export function ProfileForm({ profile }: { profile: EditableProfile }) {
  const [state, action, pending] = useActionState<FormResult | null, FormData>(saveProfileAction, null);

  return (
    <form id="profile-form" action={action} className="space-y-4 text-[13px]">
      <div>
        <label htmlFor="name" className="mb-1 block font-semibold text-win-heading">
          Nombre completo:
        </label>
        <input id="name" name="name" type="text" defaultValue={profile.name} maxLength={80} required className="win-textbox" />
      </div>
      <div>
        <label htmlFor="headline" className="mb-1 block font-semibold text-win-heading">
          Titular / rol principal:
        </label>
        <input id="headline" name="headline" type="text" defaultValue={profile.headline} maxLength={120} required className="win-textbox" />
      </div>
      <div>
        <label htmlFor="location" className="mb-1 block font-semibold text-win-heading">
          Ubicación:
        </label>
        <input id="location" name="location" type="text" defaultValue={profile.location} maxLength={80} required className="win-textbox" />
      </div>
      <div>
        <label htmlFor="shortBio" className="mb-1 block font-semibold text-win-heading">
          Resumen corto (Inicio y buscadores):
        </label>
        <textarea id="shortBio" name="shortBio" rows={3} defaultValue={profile.shortBio} maxLength={400} required className="win-textbox" />
      </div>
      <div>
        <label htmlFor="bio" className="mb-1 block font-semibold text-win-heading">
          Biografía (una línea en blanco separa los párrafos):
        </label>
        <textarea id="bio" name="bio" rows={9} defaultValue={profile.bio.join("\n\n")} required className="win-textbox leading-relaxed" />
      </div>
      <p className="text-[12px] text-win-muted">{pending ? "Guardando…" : "Los cambios se ven en el sitio público al guardar."}</p>
      {state && <InfoBar ok={state.ok}>{state.message}</InfoBar>}
    </form>
  );
}
