"use client";

import Image from "next/image";
import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { CaritoFooter, CaritoNav } from "./CaritoChrome";
import styles from "./carito.module.css";

/** A version ready to download, as the page shows it (the size already written). */
export type CaritoDownload = { version: string; url: string; fileName: string; size: string | null; notes: string[] };

type Platform = "android" | "pc";
type Shot = { src: string; width: number; height: number; title: string; theme: string };

const PHONE = { width: 640, height: 1423 };
const SHOTS: Record<Platform, Shot[]> = {
  android: [
    { src: "/carito/android/inicio-khoopper.webp", ...PHONE, title: "Inicio", theme: "KHOOPPER" },
    { src: "/carito/android/reproductor-khoopper.webp", ...PHONE, title: "Reproduciendo", theme: "KHOOPPER" },
    { src: "/carito/android/bloqueo.webp", ...PHONE, title: "Pantalla de bloqueo", theme: "KHOOPPER" },
    { src: "/carito/android/reproductor-apple.webp", ...PHONE, title: "Reproduciendo", theme: "estilo Apple Music" },
    { src: "/carito/android/inicio-gerbera.webp", ...PHONE, title: "Inicio", theme: "Gerbera" },
    { src: "/carito/android/reproductor-spotify.webp", ...PHONE, title: "Reproduciendo", theme: "estilo Spotify" },
    { src: "/carito/android/playlist.webp", ...PHONE, title: "Una playlist", theme: "Dark" },
    { src: "/carito/android/ajustes.webp", ...PHONE, title: "Ajustes y temas", theme: "Dark" },
  ],
  pc: [
    { src: "/carito/pc/reproductor-dark.webp", width: 1600, height: 900, title: "Reproduciendo, con la letra", theme: "Dark" },
    { src: "/carito/pc/biblioteca-spotify.webp", width: 1280, height: 800, title: "Tu biblioteca y Hechos para ti", theme: "estilo Spotify" },
    { src: "/carito/pc/laboratorio.webp", width: 1280, height: 800, title: "Laboratorio de audio", theme: "Dark" },
    { src: "/carito/pc/reproductor-gerbera.webp", width: 1280, height: 800, title: "Letra sincronizada", theme: "Gerbera" },
    { src: "/carito/pc/spotify.webp", width: 1280, height: 800, title: "Importar tus playlists", theme: "estilo Apple Music" },
    { src: "/carito/pc/buscar.webp", width: 1280, height: 800, title: "Buscar", theme: "Dark" },
  ],
};

const FEATURES: Record<Platform, { title: string; text: string }[]> = {
  android: [
    { title: "Toda la música", text: "Busca cualquier canción, artista o álbum y escucha su radio, junto a la música que ya tienes en tu teléfono." },
    { title: "Música sin conexión", text: "Guarda canciones y playlists en la carpeta que elijas, en FLAC, para escucharlas sin internet." },
    { title: "Cinco temas completos", text: "Cada uno cambia el reproductor, la pantalla de bloqueo, los avisos y el widget." },
    { title: "Suena fuerte y claro", text: "Laboratorio de audio con ecualizador de 10 bandas, envolvente, compresor y ajustes para tu DAC, cable o Bluetooth." },
    { title: "Automix DJ", text: "Mezcla las canciones en el beat y al mismo tempo, como un DJ. Crossfade sin bajones." },
    { title: "Hechos para ti", text: "Mixes del día y del momento, el Top 50 de tu país, tus artistas y Tu año en Carito." },
    { title: "Letras sincronizadas", text: "Con carátulas animadas, cola editable y temporizador para dormir." },
    { title: "Tus playlists a salvo", text: "Se guardan con tu licencia cada noche y vuelven en otro teléfono o en tu PC." },
    { title: "Se actualiza sola", text: "Te avisa de cada versión nueva y la instala con un toque." },
  ],
  pc: [
    { title: "Toda la música, en línea", text: "Busca cualquier canción, escucha su radio y guarda tus playlists y favoritas." },
    { title: "Tus playlists de Spotify", text: "Pega el enlace de una playlist o conecta tu cuenta: queda en Carito, en el mismo orden." },
    { title: "Cinco temas, hechos para PC", text: "Una ventana de escritorio que se adapta a tu pantalla, de la laptop al monitor grande." },
    { title: "El sonido de Carito", text: "Potente y claro de entrada, laboratorio de audio por salida, 32 bits y Modo puro bit-perfect." },
    { title: "Automix DJ y crossfade", text: "Mezcla en el compás y al mismo tempo, como un DJ." },
    { title: "Hechos para ti", text: "Mixes del día y del momento, el Top 50 de tu país, tus artistas y Tu año en Carito." },
    { title: "Letras sincronizadas", text: "Con traducción, carátulas animadas, cola editable y temporizador." },
    { title: "Integrada con Windows", text: "Teclas multimedia, pantalla de bloqueo, bandeja y un mini reproductor con los widgets del teléfono." },
    { title: "La misma licencia", text: "Tu licencia del teléfono abre Carito en tu PC y trae tus playlists y favoritas." },
  ],
};

/** One stroke icon set, drawn with the text colour. */
const ICONS = {
  phone: <><rect x="6.5" y="2.5" width="11" height="19" rx="2.5" /><path d="M10.5 18.5h3" /></>,
  monitor: <><rect x="2.5" y="4" width="19" height="12.5" rx="2" /><path d="M8.5 20.5h7M12 16.5v4" /></>,
  download: <><path d="M12 3.5v12m0 0-4.5-4.5M12 15.5l4.5-4.5" /><path d="M4 16.5v2a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-2" /></>,
  check: <path d="m5 12.5 4.5 4.5L19 7.5" />,
  chevron: <path d="m9 5 7 7-7 7" />,
  close: <path d="M6 6l12 12M18 6 6 18" />,
};

function Icon({ name, className = "h-5 w-5" }: { name: keyof typeof ICONS; className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden="true">
      {ICONS[name]}
    </svg>
  );
}

function detect(): { platform: Platform; mobile: boolean; ios: boolean } {
  const ua = navigator.userAgent;
  const ios = /iPhone|iPad|iPod/i.test(ua) || (/Macintosh/.test(ua) && navigator.maxTouchPoints > 1);
  const android = /Android/i.test(ua);
  const mobile = ios || android || /Mobile/i.test(ua);
  const hash = window.location.hash.replace("#", "");
  if (hash === "pc" || hash === "android") return { platform: hash, mobile, ios };
  return { platform: !mobile && /Windows NT/i.test(ua) ? "pc" : "android", mobile, ios };
}

const H2 = `${styles.display} text-[clamp(2.25rem,5vw,3.5rem)]`;
const LEAD = "mx-auto mt-4 max-w-[46ch] text-[clamp(1.125rem,2vw,1.3125rem)] leading-[1.45]";

export function CaritoLanding({ android, pc, allReleases }: { android: CaritoDownload | null; pc: CaritoDownload | null; allReleases: string }) {
  const [platform, setPlatform] = useState<Platform>("android");
  const [mobile, setMobile] = useState(true);
  const [ios, setIos] = useState(false);
  const [open, setOpen] = useState<Shot | null>(null);

  useEffect(() => {
    // The visitor's device can only be read in the browser, once the page is drawn.
    const found = detect();
    /* eslint-disable react-hooks/set-state-in-effect */
    setPlatform(found.platform);
    setMobile(found.mobile);
    setIos(found.ios);
    /* eslint-enable react-hooks/set-state-in-effect */
  }, []);

  const choose = useCallback((next: Platform) => {
    setPlatform(next);
    window.history.replaceState(null, "", `#${next}`);
  }, []);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(null);
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  const release = platform === "android" ? android : pc;
  const isAndroid = platform === "android";

  return (
    <div className={`${styles.root} min-h-screen`}>
      <CaritoNav />

      {/* The product, first: its name, one line, the choice of device, the download, and the app itself at full size. */}
      <section id="inicio" className="scroll-mt-[52px] overflow-hidden bg-black pt-16 text-center text-[#f5f5f7] sm:pt-20">
        <div className="mx-auto max-w-[980px] px-5">
          <Image src="/carito/icono-512.webp" alt="Ícono de Carito Music" width={512} height={512} priority className="mx-auto h-[88px] w-[88px] rounded-[20px] shadow-[0_12px_32px_-8px_rgba(124,58,237,0.55)]" />
          <h1 className={`${styles.display} mt-6 text-[clamp(3rem,8vw,5.25rem)]`}>Carito Music</h1>
          <p className={`${styles.display} mx-auto mt-3 max-w-[30ch] text-[clamp(1.375rem,3vw,2rem)] [text-wrap:balance] !leading-[1.15] text-[#a1a1a6]`}>Tu música, con el sonido de Carito.</p>

          <PlatformSwitch platform={platform} onChange={choose} />
          <DownloadArea platform={platform} release={release} mobile={mobile} ios={ios} allReleases={allReleases} />
        </div>

        <div key={platform} className={`${styles.rise} mx-auto mt-14 max-w-[1080px] px-5 pb-20 sm:mt-16 sm:pb-24`}>
          {isAndroid ? (
            <div className="flex items-end justify-center gap-3 sm:gap-8">
              <div className="w-[29%] max-w-[250px]"><PhoneFrame shot={SHOTS.android[0]} dark priority /></div>
              <div className="w-[34%] max-w-[290px]"><PhoneFrame shot={SHOTS.android[1]} dark priority /></div>
              <div className="w-[29%] max-w-[250px]"><PhoneFrame shot={SHOTS.android[2]} dark priority /></div>
            </div>
          ) : (
            <WindowFrame shot={SHOTS.pc[0]} priority />
          )}
        </div>
      </section>

      {/* Every screenshot, whole: a grid, never a carousel or a crop. */}
      <section id="capturas" className="scroll-mt-[52px] bg-[#f5f5f7] py-20 text-[#1d1d1f] sm:py-28">
        <div className="mx-auto max-w-[1024px] px-5 text-center">
          <h2 className={H2}>{isAndroid ? "Cinco temas. Cada uno, completo." : "Hecha para tu escritorio."}</h2>
          <p className={`${LEAD} text-[#6e6e73]`}>
            {isAndroid
              ? "Dark, KHOOPPER, Gerbera y dos inspirados en Apple Music y Spotify. Cada tema cambia el inicio, el reproductor y la pantalla de bloqueo."
              : "Los cinco temas del teléfono en una ventana de escritorio que se adapta a tu pantalla."}
          </p>
        </div>
        <ul className={`mx-auto mt-14 grid max-w-[1024px] px-5 ${isAndroid ? "grid-cols-2 gap-x-5 gap-y-10 sm:grid-cols-4 sm:gap-x-8 sm:gap-y-14" : "gap-x-8 gap-y-12 md:grid-cols-2"}`}>
          {SHOTS[platform].map((shot, i) => (
            <li key={shot.src} className={!isAndroid && i === 0 ? "md:col-span-2" : undefined}>
              <button type="button" onClick={() => setOpen(shot)} className="group block w-full text-center" aria-label={`Ver más grande: ${shot.title}, ${shot.theme}`}>
                {isAndroid ? <PhoneFrame shot={shot} /> : <WindowFrame shot={shot} />}
                <span className="mt-4 block text-[14px] font-semibold text-[#1d1d1f]">{shot.title}</span>
                <span className="block text-[14px] text-[#6e6e73]">{shot.theme}</span>
              </button>
            </li>
          ))}
        </ul>
      </section>

      <section id="funciones" className="scroll-mt-[52px] bg-black py-20 text-[#f5f5f7] sm:py-28">
        <div className="mx-auto max-w-[1024px] px-5">
          <div className="text-center">
            <h2 className={H2}>Todo lo que hace.</h2>
            <p className={`${LEAD} text-[#a1a1a6]`}>
              {isAndroid ? "Un reproductor completo para tu teléfono, con el sonido que lo distingue." : "Todo lo del teléfono, pensado para teclado, mouse y pantalla grande."}
            </p>
          </div>
          <ul className="mt-16 grid gap-x-12 gap-y-10 sm:grid-cols-2 lg:grid-cols-3">
            {FEATURES[platform].map((f) => (
              <li key={f.title} className="border-t border-white/[0.16] pt-5">
                <h3 className="text-[21px] font-semibold leading-snug tracking-[-0.01em]">{f.title}</h3>
                <p className="mt-2 text-[17px] leading-[1.5] text-[#a1a1a6]">{f.text}</p>
              </li>
            ))}
          </ul>
        </div>
      </section>

      <section id="instalar" className="scroll-mt-[52px] bg-white py-20 text-[#1d1d1f] sm:py-28">
        <div className="mx-auto max-w-[1024px] px-5">
          <div className="text-center">
            <h2 className={H2}>Instalarla toma un minuto.</h2>
            <p className={`${LEAD} text-[#6e6e73]`}>{isAndroid ? "Se baja desde aquí, sin tienda de apps." : "Un instalador para Windows 10 y 11."}</p>
          </div>
          <ol className="mt-16 grid gap-10 md:grid-cols-3 md:gap-12">
            {steps(platform, release).map((step, i) => (
              <li key={step.title}>
                <span className={`${styles.display} block text-[44px] text-[#7c3aed]`}>{i + 1}</span>
                <h3 className="mt-3 text-[21px] font-semibold tracking-[-0.01em]">{step.title}</h3>
                <p className="mt-2 text-[17px] leading-[1.5] text-[#6e6e73]">{step.text}</p>
              </li>
            ))}
          </ol>
          <div className="mt-16 border-t border-[#d2d2d7] pt-8">
            <h3 className="text-[17px] font-semibold">Necesitas</h3>
            <ul className="mt-4 grid gap-x-12 gap-y-2.5 text-[17px] text-[#424245] sm:grid-cols-2">
              {requirements(platform, release).map((item) => (
                <li key={item} className="flex items-start gap-2.5">
                  <Icon name="check" className="mt-[3px] h-[18px] w-[18px] shrink-0 text-[#7c3aed]" />
                  {item}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      <section id="licencia" className="scroll-mt-[52px] bg-[#4c1d95] py-20 text-center text-white sm:py-28">
        <div className="mx-auto max-w-[1024px] px-5">
          <h2 className={H2}>Una licencia. Tu teléfono y tu PC.</h2>
          <p className={`${LEAD} text-[#ddd6fe]`}>
            Carito se abre con una licencia. La misma abre tu teléfono Android y tu PC con Windows, y guarda tus playlists y favoritas cada noche.
          </p>
          <ul className="mx-auto mt-14 grid max-w-[900px] gap-10 sm:grid-cols-3">
            {[
              { title: "Prueba gratis de 3 días", text: "Pídela y empieza a escuchar el mismo día." },
              { title: "Teléfono y PC", text: "Tus playlists y favoritas llegan a los dos." },
              { title: "Plan familiar", text: "Tú y 2 personas más, cada quien con su propio perfil y sus playlists." },
            ].map((item) => (
              <li key={item.title}>
                <h3 className="text-[21px] font-semibold tracking-[-0.01em]">{item.title}</h3>
                <p className="mt-2 text-[17px] text-[#ddd6fe]">{item.text}</p>
              </li>
            ))}
          </ul>
          <Link href="/contacto" className={`${styles.press} mt-14 inline-flex items-center rounded-full bg-white px-7 py-3 text-[17px] font-medium text-[#4c1d95] hover:bg-[#f5f3ff]`}>
            Pedir mi licencia
          </Link>
        </div>
      </section>

      <section className="bg-white py-20 text-[#1d1d1f] sm:py-24">
        <div className="mx-auto flex max-w-[880px] flex-col items-center gap-10 px-5 text-center md:flex-row md:gap-14 md:text-left">
          <Image src="/carito/qr.webp" alt="Código QR que abre khoopper.com/carito" width={720} height={720} className="h-56 w-56 shrink-0 rounded-[28px] shadow-[0_18px_40px_-16px_rgba(43,11,87,0.45)] ring-1 ring-black/5" />
          <div>
            <h2 className={`${styles.display} text-[clamp(2rem,4vw,2.75rem)]`}>Compártela con un código.</h2>
            <p className="mt-4 max-w-[40ch] text-[19px] leading-[1.45] text-[#6e6e73]">
              Quien lo escanee con la cámara de su teléfono llega aquí y elige Android o PC.
            </p>
            <a href="/carito/carito-qr-tarjeta.png" download className="mt-5 inline-flex items-center gap-1 text-[17px] text-[#6d28d9] hover:underline">
              Descargar la tarjeta con el código <Icon name="chevron" className="h-4 w-4" />
            </a>
          </div>
        </div>
      </section>

      <CaritoFooter allReleases={allReleases} />

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 p-4 sm:p-8" onClick={() => setOpen(null)} role="dialog" aria-modal="true" aria-label={`${open.title}, ${open.theme}`}>
          <button type="button" onClick={() => setOpen(null)} className={`${styles.press} absolute right-4 top-4 rounded-full bg-white/15 p-2.5 text-white hover:bg-white/25`} aria-label="Cerrar">
            <Icon name="close" />
          </button>
          <Image src={open.src} alt={`${open.title}, ${open.theme}`} width={open.width} height={open.height} sizes="92vw" className="h-auto max-h-full w-auto max-w-full rounded-[18px] object-contain" />
        </div>
      )}
    </div>
  );
}

function PlatformSwitch({ platform, onChange }: { platform: Platform; onChange: (p: Platform) => void }) {
  const options: { id: Platform; label: string; icon: keyof typeof ICONS }[] = [
    { id: "android", label: "Android", icon: "phone" },
    { id: "pc", label: "Windows", icon: "monitor" },
  ];
  return (
    <div role="tablist" aria-label="Elige tu equipo" className="mx-auto mt-9 inline-flex rounded-full bg-[#1d1d1f] p-1">
      {options.map((o) => (
        <button
          key={o.id}
          type="button"
          role="tab"
          aria-selected={platform === o.id}
          onClick={() => onChange(o.id)}
          className={`${styles.press} inline-flex items-center gap-2 rounded-full px-5 py-2 text-[15px] font-medium ${platform === o.id ? "bg-[#f5f5f7] text-[#1d1d1f]" : "text-[#a1a1a6] hover:text-[#f5f5f7]"}`}
        >
          <Icon name={o.icon} className="h-[18px] w-[18px]" /> {o.label}
        </button>
      ))}
    </div>
  );
}

function DownloadArea({ platform, release, mobile, ios, allReleases }: { platform: Platform; release: CaritoDownload | null; mobile: boolean; ios: boolean; allReleases: string }) {
  const isAndroid = platform === "android";
  const meta = release ? [`Versión ${release.version}`, release.size, isAndroid ? "Android 8 o más nuevo" : "Windows 10 y 11"].filter(Boolean).join(" · ") : null;
  return (
    <div className="mt-7 flex flex-col items-center">
      {release ? (
        <>
          <div className="flex flex-wrap items-center justify-center gap-x-7 gap-y-4">
            <a href={release.url} className={`${styles.press} inline-flex items-center gap-2 whitespace-nowrap rounded-full bg-[#7c3aed] px-6 py-3 text-[17px] font-medium text-white hover:bg-[#6d28d9]`}>
              <Icon name="download" className="h-[18px] w-[18px]" /> Descargar para {isAndroid ? "Android" : "Windows"}
            </a>
            <a href="#instalar" className="inline-flex items-center gap-0.5 text-[17px] text-[#a78bfa] hover:underline">
              Cómo instalarla <Icon name="chevron" className="h-4 w-4" />
            </a>
          </div>
          <p className="mt-4 text-[14px] text-[#86868b]">{meta}</p>
        </>
      ) : (
        <div className="max-w-[44ch]">
          <p className="text-[19px] font-semibold text-[#f5f5f7]">{isAndroid ? "La descarga vuelve en un momento." : "Muy pronto para Windows."}</p>
          <p className="mt-1.5 text-[15px] leading-[1.5] text-[#a1a1a6]">
            {isAndroid ? "No pudimos leer la última versión; puedes bajarla desde la lista de versiones." : "La versión para PC está en sus últimas pruebas. El botón de descarga aparecerá aquí en cuanto esté lista."}
          </p>
          {isAndroid && (
            <a href={allReleases} target="_blank" rel="noopener noreferrer" className="mt-2 inline-flex items-center gap-0.5 text-[15px] text-[#a78bfa] hover:underline">
              Ver las versiones <Icon name="chevron" className="h-4 w-4" />
            </a>
          )}
        </div>
      )}
      {isAndroid && release && !mobile && (
        <div className="mt-8 inline-flex items-center gap-4 rounded-[18px] bg-[#1d1d1f] p-2.5 pr-5 text-left">
          <Image src="/carito/qr.webp" alt="Código QR para abrir esta página en tu teléfono" width={720} height={720} className="h-[84px] w-[84px] rounded-[12px]" />
          <p className="max-w-[24ch] text-[14px] leading-[1.4] text-[#a1a1a6]">
            ¿Estás en la computadora? <span className="text-[#f5f5f7]">Escanéalo con la cámara de tu teléfono.</span>
          </p>
        </div>
      )}
      {ios && <p className="mt-6 max-w-[44ch] text-[14px] leading-[1.45] text-[#a1a1a6]">Carito Music es para Android y para PC con Windows; en iPhone y iPad no se puede instalar.</p>}
    </div>
  );
}

function PhoneFrame({ shot, dark = false, priority = false }: { shot: Shot; dark?: boolean; priority?: boolean }) {
  return (
    <div
      className={`rounded-[13%/6%] p-[3.2%] transition-transform duration-300 ease-out group-hover:-translate-y-1 ${dark ? "bg-[#2c2c2e] ring-1 ring-white/10" : "bg-[#1d1d1f]"} shadow-[0_24px_48px_-20px_rgba(0,0,0,0.55)]`}
    >
      <Image src={shot.src} alt={`${shot.title}, ${shot.theme}`} width={shot.width} height={shot.height} priority={priority} sizes="(max-width: 640px) 46vw, 260px" className="h-auto w-full rounded-[11%/5%]" />
    </div>
  );
}

function WindowFrame({ shot, priority = false }: { shot: Shot; priority?: boolean }) {
  return (
    <div className="overflow-hidden rounded-[14px] shadow-[0_28px_56px_-24px_rgba(0,0,0,0.6)] ring-1 ring-black/10 transition-transform duration-300 ease-out group-hover:-translate-y-1">
      <Image src={shot.src} alt={`${shot.title}, ${shot.theme}`} width={shot.width} height={shot.height} priority={priority} sizes="(max-width: 768px) 100vw, 1024px" className="block h-auto w-full" />
    </div>
  );
}

function steps(platform: Platform, release: CaritoDownload | null): { title: string; text: string }[] {
  const file = release ? `${release.fileName}${release.size ? ` (${release.size})` : ""}` : null;
  if (platform === "android") {
    return [
      { title: "Descárgala", text: `Toca «Descargar para Android»${file ? `: se baja ${file}` : ""}.` },
      { title: "Ábrela", text: "Ábrela desde la notificación o desde Descargas. Si Android lo pide, permite «Instalar apps desconocidas» para tu navegador; es una sola vez." },
      { title: "Entra con tu licencia", text: "Toca Instalar, abre Carito y escribe tu licencia. Desde ahí se actualiza sola." },
    ];
  }
  return [
    { title: "Descarga el instalador", text: `Toca «Descargar para Windows»${file ? `: se baja ${file}` : ""}.` },
    { title: "Ábrelo", text: "Si Windows muestra «Windows protegió tu PC», elige «Más información» y después «Ejecutar de todas formas». Es normal con apps nuevas que no vienen de la Microsoft Store." },
    { title: "Entra con tu licencia", text: "Queda en el menú Inicio y en el escritorio. Escribe la misma licencia de tu teléfono; también se actualiza sola." },
  ];
}

function requirements(platform: Platform, release: CaritoDownload | null): string[] {
  const size = release?.size ? `${release.size} libres para instalarla` : null;
  const list =
    platform === "android"
      ? ["Un teléfono con Android 8.0 o más nuevo", size, "Internet para la música en línea", "Tu licencia, o una prueba gratis de 3 días"]
      : ["Una PC con Windows 10 u 11 de 64 bits", size, "Internet para la música en línea", "La licencia de tu teléfono, o una prueba de 3 días"];
  return list.filter((x): x is string => Boolean(x));
}
