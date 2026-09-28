"use client";

import { useActionState } from "react";
import { saveSettingsAction, type FormResult } from "@/app/(admin)/admin/settings-actions";
import { InfoBar } from "@/components/win7/InfoBar";
import type { SiteSettings } from "@/lib/types";

function Field({ id, label, hint, children }: { id: string; label: string; hint?: string; children: React.ReactNode }) {
  return (
    <div>
      <label htmlFor={id} className="mb-1 block font-semibold text-win-heading">
        {label}
      </label>
      {children}
      {hint && <p className="mt-1 text-[12px] text-win-muted">{hint}</p>}
    </div>
  );
}

/** Contact, social links, SEO and Google integrations. Submitted by «Guardar ajustes» in the window header. */
export function SettingsForm({ settings }: { settings: SiteSettings }) {
  const [state, action, pending] = useActionState<FormResult | null, FormData>(saveSettingsAction, null);

  return (
    <form id="settings-form" action={action} className="grid grid-cols-1 gap-6 text-[13px] md:col-span-2 md:grid-cols-2">
      <fieldset className="win-groupbox min-w-0 space-y-3">
        <legend className="font-semibold text-win-heading">Contacto y disponibilidad</legend>
        <label className="flex items-center gap-2">
          <input type="checkbox" name="availableForWork" defaultChecked={settings.availableForWork} className="size-4" />
          Mostrar «Disponible» en la barra de tareas
        </label>
        <Field id="contactEmail" label="Correo de contacto:">
          <input id="contactEmail" name="contactEmail" type="email" defaultValue={settings.contactEmail} required className="win-textbox" />
        </Field>
        <Field id="phone" label="Teléfono:">
          <input id="phone" name="phone" type="tel" defaultValue={settings.phone ?? ""} placeholder="+503 0000-0000" className="win-textbox" />
        </Field>
        <Field id="whatsappUrl" label="Enlace de WhatsApp:">
          <input id="whatsappUrl" name="whatsappUrl" type="url" defaultValue={settings.whatsappUrl ?? ""} placeholder="https://wa.me/503…" className="win-textbox" />
        </Field>
      </fieldset>

      <fieldset className="win-groupbox min-w-0 space-y-3">
        <legend className="font-semibold text-win-heading">Redes y perfiles</legend>
        <Field id="githubUrl" label="GitHub:">
          <input id="githubUrl" name="githubUrl" type="url" defaultValue={settings.githubUrl ?? ""} placeholder="https://github.com/…" className="win-textbox" />
        </Field>
        <Field id="linkedinUrl" label="LinkedIn:">
          <input id="linkedinUrl" name="linkedinUrl" type="url" defaultValue={settings.linkedinUrl ?? ""} placeholder="https://www.linkedin.com/in/…" className="win-textbox" />
        </Field>
      </fieldset>

      <fieldset className="win-groupbox min-w-0 space-y-3">
        <legend className="font-semibold text-win-heading">Buscadores (SEO)</legend>
        <Field id="seoTitle" label="Título del sitio:" hint="Hasta 70 caracteres. Es lo que Google muestra como enlace.">
          <input id="seoTitle" name="seoTitle" type="text" defaultValue={settings.seoTitle} maxLength={70} required className="win-textbox" />
        </Field>
        <Field id="seoDescription" label="Descripción:" hint="Entre 20 y 200 caracteres. Aparece bajo el enlace en los resultados.">
          <textarea id="seoDescription" name="seoDescription" rows={3} defaultValue={settings.seoDescription} maxLength={200} required className="win-textbox" />
        </Field>
      </fieldset>

      <fieldset className="win-groupbox min-w-0 space-y-3">
        <legend className="font-semibold text-win-heading">Google</legend>
        <Field id="googleSiteVerification" label="Código de verificación de Search Console:" hint="Solo el valor de content=… de la etiqueta meta que te da Google.">
          <input id="googleSiteVerification" name="googleSiteVerification" type="text" defaultValue={settings.googleSiteVerification ?? ""} className="win-textbox" />
        </Field>
        <Field id="gaMeasurementId" label="ID de medición de Google Analytics:" hint="Formato G-XXXXXXXXXX. Se carga solo si el visitante acepta las estadísticas.">
          <input id="gaMeasurementId" name="gaMeasurementId" type="text" defaultValue={settings.gaMeasurementId ?? ""} placeholder="G-XXXXXXXXXX" className="win-textbox" />
        </Field>
      </fieldset>

      <div className="space-y-2 md:col-span-2">
        <p className="text-[12px] text-win-muted">{pending ? "Guardando…" : "Los cambios se ven en el sitio público al guardar."}</p>
        {state && <InfoBar ok={state.ok}>{state.message}</InfoBar>}
      </div>
    </form>
  );
}
