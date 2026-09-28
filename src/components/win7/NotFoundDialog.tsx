"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { CloseGlyph, Win7Icon } from "@/components/icons";

/** 404 styled as an authentic Windows 7 "Location Not Available" error dialog. */
export function NotFoundDialog() {
  const pathname = usePathname();
  const router = useRouter();

  return (
    <div className="login-screen">
      <div className="wallpaper" aria-hidden="true" />
      <section
        role="alertdialog"
        aria-labelledby="nf-title"
        aria-describedby="nf-text"
        className="aero-frame msgbox notfound-dialog sm:min-w-[440px]"
      >
        <header className="aero-titlebar">
          <div className="flex items-center gap-1.5 min-w-0">
            <Win7Icon name="error" className="aero-title-icon" />
            <h1 id="nf-title" className="aero-title truncate">
              Explorador de Windows · Ubicación no disponible
            </h1>
          </div>
          <div className="caption-btns">
            <Link href="/escritorio" className="caption-btn caption-btn--close" aria-label="Cerrar">
              <CloseGlyph />
            </Link>
          </div>
        </header>

        <div className="msgbox-client">
          <div className="msgbox-body">
            <Win7Icon name="error" className="size-9 shrink-0 text-red-600" />
            <div id="nf-text" className="space-y-1.5 text-xs text-win-body">
              <p className="font-semibold text-win-heading text-sm">
                No se puede encontrar <strong className="break-all text-blue-700">«{pathname}»</strong>.
              </p>
              <p className="leading-relaxed text-win-muted">
                No se encuentra el elemento o la ruta especificada. Es posible que el proyecto o sección haya cambiado de nombre,
                se haya movido o la dirección esté mal escrita.
              </p>
              <div className="mt-2.5 rounded border border-[#d8e3ef] bg-[#f4f7fb] p-2 font-mono text-[11px] text-[#4d5c6e]">
                Código de diagnóstico: 0x80070002 · HTTP 404 (ERROR_FILE_NOT_FOUND)
              </div>
            </div>
          </div>

          <div className="msgbox-buttons">
            <button
              type="button"
              onClick={() => router.back()}
              className="win-button min-w-[76px]"
            >
              Atrás
            </button>
            <Link href="/proyectos" className="win-button min-w-[76px]">
              Ver proyectos
            </Link>
            <Link href="/escritorio" className="win-button win-button--primary min-w-[84px]">
              Ir al escritorio
            </Link>
          </div>
        </div>
      </section>

      <footer className="login-brand">Brandon Ramírez · Portafolio Windows 7</footer>
    </div>
  );
}
