import Image from "next/image";
import Link from "next/link";
import styles from "./carito.module.css";

/** The page's links, from the product page itself ("") or from a legal page ("/carito"). */
function href(base: string, anchor: string) {
  return `${base}#${anchor}`;
}

/** apple.com's local nav: the product's name on the left, its sections and one small pill on the right. Translucent, sticky. */
export function CaritoNav({ base = "" }: { base?: string }) {
  return (
    <header className={`${styles.nav} sticky top-0 z-40 border-b border-white/[0.08]`}>
      <div className="mx-auto flex h-[52px] max-w-[1024px] items-center justify-between px-5">
        <Link href={base || "#inicio"} className="flex items-center gap-2.5 text-[#f5f5f7]">
          <Image src="/carito/icono-192.webp" alt="" width={24} height={24} className="h-6 w-6 rounded-[6px]" />
          <span className="text-[19px] font-semibold tracking-[-0.01em]">Carito Music</span>
        </Link>
        <nav aria-label="Secciones" className="flex items-center gap-6 text-[12px] text-[#d2d2d7]">
          <a href={href(base, "capturas")} className="hidden transition-colors hover:text-white sm:inline">Capturas</a>
          <a href={href(base, "funciones")} className="hidden transition-colors hover:text-white sm:inline">Funciones</a>
          <a href={href(base, "instalar")} className="hidden transition-colors hover:text-white md:inline">Instalar</a>
          <a href={href(base, "licencia")} className="hidden transition-colors hover:text-white md:inline">Licencia</a>
          <a href={href(base, "inicio")} className={`${styles.press} rounded-full bg-[#7c3aed] px-3.5 py-1 text-[12px] font-medium text-white hover:bg-[#6d28d9]`}>
            Descargar
          </a>
        </nav>
      </div>
    </header>
  );
}

/** apple.com's footer: footnotes first (what Carito is and is not), then the legal links and the copyright. */
export function CaritoFooter({ allReleases }: { allReleases?: string }) {
  const year = new Date().getFullYear();
  return (
    <footer className="bg-[#f5f5f7] text-[12px] leading-[1.45] text-[#6e6e73]">
      <div className="mx-auto max-w-[980px] px-5 py-10">
        <ol className="grid gap-2.5 border-b border-[#d2d2d7] pb-6">
          <li>
            Carito Music es una app independiente hecha por KHOOPPER. No está afiliada, patrocinada ni respaldada por YouTube, Google, Spotify, Apple ni
            Microsoft. YouTube, YouTube Music, Spotify, Apple Music, Android y Windows son marcas de sus respectivos dueños; aquí se nombran solo para
            describir con qué funciona Carito o en qué se inspira el estilo de un tema.
          </li>
          <li>
            Carito no aloja, vende ni distribuye música: reproduce lo que ya está disponible en línea y la música de tu propio equipo. Cada persona es
            responsable de usarla respetando los derechos de autor y los términos de los servicios que use.
          </li>
          <li>
            Las capturas del teléfono son de la app en uso; las carátulas y los nombres de las canciones pertenecen a sus dueños. Las capturas de PC usan
            canciones y carátulas de demostración.
          </li>
        </ol>
        <div className="flex flex-col gap-3 pt-5 sm:flex-row sm:items-center sm:justify-between">
          <p>Copyright © {year} KHOOPPER. Todos los derechos reservados.</p>
          <nav aria-label="Legal" className="flex flex-wrap gap-x-4 gap-y-1.5">
            <Link href="/carito/privacidad" className="text-[#424245] hover:underline">Privacidad</Link>
            <Link href="/carito/terminos" className="text-[#424245] hover:underline">Términos de uso</Link>
            <Link href="/carito/derechos-de-autor" className="text-[#424245] hover:underline">Derechos de autor y marcas</Link>
            {allReleases && (
              <a href={allReleases} target="_blank" rel="noopener noreferrer" className="text-[#424245] hover:underline">Todas las versiones</a>
            )}
          </nav>
        </div>
      </div>
    </footer>
  );
}
