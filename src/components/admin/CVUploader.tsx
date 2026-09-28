"use client";

import { useActionState, useState } from "react";
import { uploadCVAction, type CVActionResult } from "@/app/(admin)/admin/cv-actions";
import { IconDocument, IconSave } from "@/components/icons";
import { FilePicker } from "@/components/win7/FilePicker";
import { InfoBar } from "@/components/win7/InfoBar";

interface CVUploaderProps {
  initialCvUrl: string | null;
  /** "compact" stacks everything for the narrow profile card; "card" is one half of the settings grid. */
  variant?: "card" | "compact";
}

/** Manages the CV PDF (stored in Supabase Storage): current file, download, and replace. */
export function CVUploader({ initialCvUrl, variant = "card" }: CVUploaderProps) {
  const [state, action, pending] = useActionState<CVActionResult | null, FormData>(uploadCVAction, null);
  const [picked, setPicked] = useState<File | null>(null);
  const currentCvUrl = state?.version ? `/api/cv?v=${state.version}` : initialCvUrl;
  const compact = variant === "compact";

  const submit = (
    <button type="submit" disabled={pending || !picked} className={`win-button win-button--primary ${compact ? "w-full" : ""}`}>
      {pending ? "Guardando…" : currentCvUrl ? "Reemplazar currículum" : "Subir currículum"}
    </button>
  );

  return (
    <form action={action} className="h-full w-full text-left">
      <fieldset className="win-groupbox h-full min-w-0 space-y-3">
        <legend className="font-semibold text-win-heading">Currículum vitae (hoja de vida)</legend>

        <div className={`win-fileitem ${compact ? "win-fileitem--stack" : ""}`}>
          <div className="flex min-w-0 flex-1 items-center gap-2.5">
            <IconDocument className="size-8 shrink-0" />
            <div className="min-w-0">
              <p className="break-all font-medium leading-tight">{currentCvUrl ? "Brandon-Ramirez-CV.pdf" : "Sin currículum"}</p>
              <p className="mt-0.5 text-[12px] leading-tight text-win-muted">{currentCvUrl ? "Documento PDF · activo en el sitio" : "Sube un PDF para activarlo"}</p>
            </div>
          </div>
          {currentCvUrl && (
            <a href={currentCvUrl} download="Brandon-Ramirez-CV.pdf" className={`win-button inline-flex items-center justify-center gap-1.5 ${compact ? "w-full" : ""}`}>
              <IconSave className="size-4" />
              Descargar
            </a>
          )}
        </div>

        <p className="text-[12px] text-win-muted">Lo ven los reclutadores en el menú Inicio, el centro de bienvenida y el buscador. Solo PDF, máximo 5 MB.</p>

        {compact ? (
          <div className="space-y-2">
            <FilePicker name="cv" accept=".pdf,application/pdf" label="Currículum en PDF" required stacked onFile={setPicked} />
            {submit}
          </div>
        ) : (
          <div className="flex flex-wrap items-stretch gap-2">
            <FilePicker name="cv" accept=".pdf,application/pdf" label="Currículum en PDF" required className="min-w-[220px] flex-1" onFile={setPicked} />
            {submit}
          </div>
        )}

        {state && <InfoBar ok={state.ok}>{state.message}</InfoBar>}
      </fieldset>
    </form>
  );
}
