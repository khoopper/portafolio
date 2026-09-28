"use client";

import { useActionState, useState } from "react";
import { uploadLogoAction, type LogoActionResult } from "@/app/(admin)/admin/brand-actions";
import { FilePicker } from "@/components/win7/FilePicker";
import { InfoBar } from "@/components/win7/InfoBar";

/** Logo shown as the desktop shortcut icon. */
export function LogoUploader({ initialSrc }: { initialSrc: string }) {
  const [state, action, pending] = useActionState<LogoActionResult | null, FormData>(uploadLogoAction, null);
  const [preview, setPreview] = useState<string | null>(null);
  // After an upload, the new content hash makes the <img> fetch the new file.
  const current = state?.version ? `/brand/logo?v=${state.version}` : initialSrc;

  return (
    <form action={action} className="h-full">
      <fieldset className="win-groupbox h-full min-w-0 space-y-3">
        <legend className="font-semibold text-win-heading">Logotipo del sitio</legend>
        <div className="win-fileitem">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={preview ?? current} alt="Logotipo actual" width={48} height={48} className="win-thumb" />
          <p className="min-w-0 flex-1 text-[12px] text-win-muted">Es el ícono del acceso directo del escritorio. PNG, JPG o WebP cuadrado, máximo 900 KB.</p>
        </div>
        <div className="flex flex-wrap items-stretch gap-2">
          <FilePicker
            name="logo"
            accept="image/png,image/jpeg,image/webp"
            label="Logotipo"
            required
            className="min-w-[220px] flex-1"
            onFile={(f) =>
              setPreview((old) => {
                if (old) URL.revokeObjectURL(old);
                return f ? URL.createObjectURL(f) : null;
              })
            }
          />
          <button type="submit" disabled={pending} className="win-button win-button--primary">
            {pending ? "Aplicando…" : "Aplicar logotipo"}
          </button>
        </div>
        {state && <InfoBar ok={state.ok}>{state.message}</InfoBar>}
      </fieldset>
    </form>
  );
}
