"use client";

import { useCallback, useEffect, useRef, useState, type CSSProperties } from "react";
import { dragStyle, useWindowDrag, type Offset } from "./use-window-drag";
import { createPortal } from "react-dom";
import { CloseGlyph, MaxGlyph, MinGlyph } from "@/components/icons";
import { allowMedia, useConsent } from "@/lib/consent";

export interface MediaItem {
  id: string;
  title: string;
  type: "video" | "image" | "web";
  url: string;
}

interface WMPProps {
  items: MediaItem[];
  initialIndex?: number;
  open: boolean;
  onClose: () => void;
}

/** Detecta y prepara URLs de YouTube o Vimeo para inserción con API de control activada */
function parseMediaUrl(rawUrl: string): {
  isEmbed: boolean;
  isYouTube: boolean;
  isVimeo: boolean;
  url: string;
} {
  if (!rawUrl) return { isEmbed: false, isYouTube: false, isVimeo: false, url: "" };

  const ytMatch = rawUrl.match(
    /(?:youtube\.com\/(?:watch\?v=|embed\/|shorts\/)|youtu\.be\/)([a-zA-Z0-9_-]{11})/
  );
  if (ytMatch && ytMatch[1]) {
    return {
      isEmbed: true,
      isYouTube: true,
      isVimeo: false,
      url: `https://www.youtube-nocookie.com/embed/${ytMatch[1]}?autoplay=1&enablejsapi=1&controls=0&disablekb=1&fs=0&iv_load_policy=3&cc_load_policy=0&rel=0&playsinline=1&modestbranding=1`,
    };
  }

  const vimeoMatch = rawUrl.match(/vimeo\.com\/(?:video\/)?([0-9]+)/);
  if (vimeoMatch && vimeoMatch[1]) {
    return {
      isEmbed: true,
      isYouTube: false,
      isVimeo: true,
      url: `https://player.vimeo.com/video/${vimeoMatch[1]}?autoplay=1&title=0&byline=0&portrait=0`,
    };
  }

  return { isEmbed: false, isYouTube: false, isVimeo: false, url: rawUrl };
}

/** YouTube quality codes → labels (the player only offers what the video really has). */
const QUALITY_LABEL: Record<string, string> = {
  hd2160: "2160p (4K)",
  hd1440: "1440p",
  hd1080: "1080p",
  hd720: "720p",
  large: "480p",
  medium: "360p",
  small: "240p",
  tiny: "144p",
};
const QUALITY_ORDER = Object.keys(QUALITY_LABEL);

function formatTime(seconds: number): string {
  if (isNaN(seconds) || seconds < 0) return "00:00";
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
}

function WMPInner({
  items,
  initialIndex,
  onClose,
}: {
  items: MediaItem[];
  initialIndex: number;
  onClose: () => void;
}) {
  const [currentIndex, setCurrentIndex] = useState(initialIndex);
  const [isPlaying, setIsPlaying] = useState(true);
  const [isMuted, setIsMuted] = useState(false);
  const [volume, setVolume] = useState(85);
  const [isMaximized, setIsMaximized] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [customDuration, setCustomDuration] = useState<number | null>(null);
  const [isShuffle, setIsShuffle] = useState(false);
  const [isRepeat, setIsRepeat] = useState(false);
  const [quality, setQuality] = useState("default");
  const [qualities, setQualities] = useState<string[]>([]);

  const videoRef = useRef<HTMLVideoElement>(null);
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const windowRef = useRef<HTMLDivElement>(null);
  const [offset, setOffset] = useState<Offset>({ x: 0, y: 0 });
  const dragHandlers = useWindowDrag(windowRef, offset, setOffset, !isMaximized);

  const currentItem = items[currentIndex] || items[0];
  const { isEmbed, isYouTube, isVimeo, url: parsedUrl } = parseMediaUrl(currentItem?.url || "");
  // Third-party players load only with the visitor's consent (privacy center) or a one-off click.
  const consent = useConsent();
  const [loadOnce, setLoadOnce] = useState(false);
  const needsConsent = isEmbed && consent?.media !== true && !loadOnce;
  const isDirectVideo = Boolean(currentItem?.url?.match(/\.(mp4|webm|ogg)$/i));
  const isImage = currentItem?.type === "image";

  // Duración calculada según medio o reportada por el video
  const duration = isImage ? 5 : (customDuration || 210);

  // Envía comandos a la API de YouTube por postMessage
  const postYouTubeCommand = useCallback(
    (func: string, args: (string | number | boolean)[] = []) => {
      if (!isYouTube || !iframeRef.current?.contentWindow) return;
      try {
        iframeRef.current.contentWindow.postMessage(
          JSON.stringify({
            event: "command",
            func,
            args,
          }),
          "*"
        );
      } catch {
        // En caso de bloqueo por política de navegador
      }
    },
    [isYouTube]
  );

  // Qualities the video really offers, reported by the YouTube player after it starts listening.
  useEffect(() => {
    if (!isYouTube) return;
    const onMessage = (e: MessageEvent) => {
      if (e.source !== iframeRef.current?.contentWindow) return;
      try {
        const data = typeof e.data === "string" ? JSON.parse(e.data) : e.data;
        const levels: unknown = data?.info?.availableQualityLevels;
        if (data?.event === "infoDelivery" && Array.isArray(levels)) {
          setQualities(QUALITY_ORDER.filter((q) => levels.includes(q)));
        }
      } catch {
        // Not a player message.
      }
    };
    window.addEventListener("message", onMessage);
    return () => window.removeEventListener("message", onMessage);
  }, [isYouTube]);

  // Best effort: YouTube treats this as a request and may keep adapting to the connection.
  const handleQualityChange = useCallback(
    (q: string) => {
      setQuality(q);
      postYouTubeCommand("setPlaybackQuality", [q]);
      if (q !== "default") postYouTubeCommand("setPlaybackQualityRange", [q, q]);
    },
    [postYouTubeCommand],
  );

  // Botón Anterior
  const prev = useCallback(() => {
    setCurrentIndex((i) => (i > 0 ? i - 1 : items.length - 1));
    setCurrentTime(0);
    setCustomDuration(null);
    setIsPlaying(true);
  }, [items.length]);

  // Botón Siguiente
  const next = useCallback(() => {
    if (isShuffle && items.length > 1) {
      setCurrentIndex((prevIdx) => {
        let nextIdx = Math.floor(Math.random() * items.length);
        if (nextIdx === prevIdx) nextIdx = (prevIdx + 1) % items.length;
        return nextIdx;
      });
    } else {
      setCurrentIndex((i) => (i < items.length - 1 ? i + 1 : 0));
    }
    setCurrentTime(0);
    setCustomDuration(null);
    setIsPlaying(true);
  }, [isShuffle, items.length]);

  // Botón Reproducir / Reanudar
  const handlePlay = useCallback(() => {
    setIsPlaying(true);
    if (isYouTube) {
      postYouTubeCommand("playVideo");
    } else if (videoRef.current) {
      videoRef.current.play().catch(() => {});
    }
  }, [isYouTube, postYouTubeCommand]);

  // Botón Pausar
  const handlePause = useCallback(() => {
    setIsPlaying(false);
    if (isYouTube) {
      postYouTubeCommand("pauseVideo");
    } else if (videoRef.current) {
      videoRef.current.pause();
    }
  }, [isYouTube, postYouTubeCommand]);

  // Alternar Reproducir / Pausar
  const togglePlay = useCallback(() => {
    if (isPlaying) {
      handlePause();
    } else {
      handlePlay();
    }
  }, [handlePause, handlePlay, isPlaying]);

  // Botón Detener (Stop)
  const handleStop = useCallback(() => {
    setIsPlaying(false);
    setCurrentTime(0);
    if (isYouTube) {
      postYouTubeCommand("pauseVideo");
      postYouTubeCommand("seekTo", [0, true]);
    } else if (videoRef.current) {
      videoRef.current.pause();
      videoRef.current.currentTime = 0;
    } else if (isImage) {
      setCurrentIndex(0);
    }
  }, [isImage, isYouTube, postYouTubeCommand]);

  // Control de Barra de Progreso (Seek)
  const handleSeek = useCallback(
    (newTime: number) => {
      setCurrentTime(newTime);
      if (isYouTube) {
        postYouTubeCommand("seekTo", [newTime, true]);
      } else if (videoRef.current) {
        videoRef.current.currentTime = newTime;
      }
    },
    [isYouTube, postYouTubeCommand]
  );

  // Control de Volumen
  const handleVolumeChange = useCallback(
    (newVol: number) => {
      setVolume(newVol);
      if (isMuted) setIsMuted(false);
      if (isYouTube) {
        postYouTubeCommand("unMute");
        postYouTubeCommand("setVolume", [newVol]);
      } else if (videoRef.current) {
        videoRef.current.muted = false;
        videoRef.current.volume = newVol / 100;
      }
    },
    [isMuted, isYouTube, postYouTubeCommand]
  );

  // Botón Silenciar (Mute)
  const toggleMute = useCallback(() => {
    setIsMuted((prevMuted) => {
      const nextMuted = !prevMuted;
      if (isYouTube) {
        postYouTubeCommand(nextMuted ? "mute" : "unMute");
      } else if (videoRef.current) {
        videoRef.current.muted = nextMuted;
      }
      return nextMuted;
    });
  }, [isYouTube, postYouTubeCommand]);

  // Escucha eventos emitidos por el reproductor de YouTube
  useEffect(() => {
    if (!isYouTube) return;

    const handleMessage = (e: MessageEvent) => {
      if (!e.data) return;
      try {
        const data = typeof e.data === "string" ? JSON.parse(e.data) : e.data;
        if (data.event === "infoDelivery" && data.info) {
          if (typeof data.info.currentTime === "number") {
            setCurrentTime(Math.floor(data.info.currentTime));
          }
          if (typeof data.info.duration === "number" && data.info.duration > 0) {
            setCustomDuration(Math.floor(data.info.duration));
          }
          if (typeof data.info.playerState === "number") {
            // 1 = playing, 2 = paused, 0 = ended
            if (data.info.playerState === 1) setIsPlaying(true);
            if (data.info.playerState === 2) setIsPlaying(false);
            if (data.info.playerState === 0) {
              if (isRepeat) {
                postYouTubeCommand("seekTo", [0, true]);
                postYouTubeCommand("playVideo");
              } else if (items.length > 1) {
                next();
              } else {
                setIsPlaying(false);
              }
            }
          }
        }
      } catch {
        // No es JSON válido o no proviene de YouTube
      }
    };

    window.addEventListener("message", handleMessage);
    return () => window.removeEventListener("message", handleMessage);
  }, [isRepeat, isYouTube, items.length, next, postYouTubeCommand]);

  // Atajos de teclado oficiales de Windows Media Player 12
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
      if (e.key === "ArrowRight") next();
      if (e.key === "ArrowLeft") prev();
      if (e.key === " " || (e.ctrlKey && e.key.toLowerCase() === "p")) {
        e.preventDefault();
        togglePlay();
      }
      if (e.ctrlKey && e.key.toLowerCase() === "s") {
        e.preventDefault();
        handleStop();
      }
      if (e.ctrlKey && e.key.toLowerCase() === "b") {
        e.preventDefault();
        prev();
      }
      if (e.ctrlKey && e.key.toLowerCase() === "f") {
        e.preventDefault();
        next();
      }
      if (e.key === "F7") {
        e.preventDefault();
        toggleMute();
      }
      if (e.altKey && e.key === "Enter") {
        e.preventDefault();
        setIsMaximized((m) => !m);
      }
    };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [handleStop, next, onClose, prev, toggleMute, togglePlay]);

  // Motor de tiempo de reproducción / diapositivas automáticas
  useEffect(() => {
    if (!isPlaying) return;
    const interval = setInterval(() => {
      setCurrentTime((t) => {
        const nextTime = t + 1;
        if (nextTime >= duration) {
          if (isRepeat) return 0;
          if (items.length > 1) {
            next();
            return 0;
          }
          setIsPlaying(false);
          return duration;
        }
        return nextTime;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [duration, isPlaying, isRepeat, items.length, next]);

  // Sincronización con video HTML5 cuando aplica
  useEffect(() => {
    if (!videoRef.current) return;
    if (isPlaying) {
      videoRef.current.play().catch(() => {});
    } else {
      videoRef.current.pause();
    }
  }, [isPlaying]);

  useEffect(() => {
    if (!videoRef.current) return;
    videoRef.current.volume = isMuted ? 0 : volume / 100;
  }, [isMuted, volume]);

  const progress = `${(Math.min(currentTime, duration) / (duration || 1)) * 100}%`;
  const vol = isMuted ? 0 : volume;

  return (
    <div role="dialog" aria-modal="true" aria-label="Reproductor de Windows Media" className="wmp-overlay">
      {/* Same Aero glass frame as every other window; the player chrome sits on the glass. */}
      <div ref={windowRef} className={`aero-frame wmp-window ${isMaximized ? "wmp-window--max" : ""}`} style={dragStyle(offset, isMaximized)}>
        <header className="aero-titlebar" onDoubleClick={() => setIsMaximized((m) => !m)} {...dragHandlers}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/images/win7/wmp/wmp-icon.png" alt="" width={16} height={16} className="aero-title-icon wmp-title-icon" draggable={false} />
          <h2 className="aero-title">Reproductor de Windows Media</h2>
          <div className="caption-btns" onDoubleClick={(e) => e.stopPropagation()}>
            <button type="button" className="caption-btn" aria-label="Minimizar" onClick={onClose}>
              <MinGlyph />
            </button>
            <button type="button" className="caption-btn" aria-label={isMaximized ? "Restaurar" : "Maximizar"} onClick={() => setIsMaximized((m) => !m)}>
              <MaxGlyph />
            </button>
            <button type="button" className="caption-btn caption-btn--close" aria-label="Cerrar reproductor" onClick={onClose}>
              <CloseGlyph />
            </button>
          </div>
        </header>

        {/* Now Playing */}
        <div className="wmp-screen">
          {isImage ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img key={currentItem.url} src={currentItem.url} alt={currentItem.title} className="wmp-media object-contain p-3" />
          ) : isEmbed && needsConsent ? (
            <div className="wmp-media grid place-items-center overflow-y-auto p-5 text-center text-white">
              <div className="max-w-sm space-y-3">
                <p className="text-base font-semibold">Este video se aloja en {isVimeo ? "Vimeo" : "YouTube"}</p>
                <p className="text-sm opacity-85">
                  Al reproducirlo, {isVimeo ? "Vimeo" : "YouTube"} recibirá tu dirección IP y podrá guardar datos en tu navegador.{" "}
                  <a href="/legal/privacidad" target="_blank" rel="noopener noreferrer" className="underline">
                    Política de privacidad
                  </a>
                  .
                </p>
                <div className="flex flex-wrap justify-center gap-2">
                  <button type="button" className="win-button" onClick={() => setLoadOnce(true)}>
                    Cargar este video
                  </button>
                  <button type="button" className="win-button win-button--primary" onClick={allowMedia}>
                    Permitir siempre
                  </button>
                </div>
              </div>
            </div>
          ) : isEmbed ? (
            <iframe
              ref={iframeRef}
              src={parsedUrl}
              title={currentItem.title}
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
              allowFullScreen
              onLoad={() => {
                if (isYouTube) {
                  // Start receiving player info (available qualities) and keep captions off, even when the
                  // viewer's YouTube account turns them on: the module can load a moment after the page.
                  try {
                    iframeRef.current?.contentWindow?.postMessage(JSON.stringify({ event: "listening", id: 1, channel: "widget" }), "*");
                  } catch {
                    // Blocked by the browser: the quality list simply stays generic.
                  }
                  for (const delay of [0, 600, 1800, 4000]) {
                    setTimeout(() => {
                      postYouTubeCommand("unloadModule", ["captions"]);
                      postYouTubeCommand("unloadModule", ["cc"]);
                    }, delay);
                  }
                  postYouTubeCommand("setVolume", [volume]);
                  if (isMuted) postYouTubeCommand("mute");
                  if (isPlaying) postYouTubeCommand("playVideo");
                }
              }}
              className={`wmp-media border-0 ${isYouTube ? "wmp-yt" : ""}`}
            />
          ) : isDirectVideo ? (
            <video
              ref={videoRef}
              src={currentItem.url}
              controls={false}
              autoPlay={isPlaying}
              muted={isMuted}
              onLoadedMetadata={() => {
                if (videoRef.current?.duration) setCustomDuration(Math.floor(videoRef.current.duration));
              }}
              onTimeUpdate={() => {
                if (videoRef.current) setCurrentTime(Math.floor(videoRef.current.currentTime));
              }}
              className="wmp-media object-contain"
            />
          ) : (
            <div className="flex flex-col items-center gap-3 p-6 text-center">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src="/images/win7/wmp/wmp-icon.png" alt="" width={96} height={96} className="opacity-90" draggable={false} />
              <p className="text-base text-white">{currentItem?.title || "Demostración"}</p>
              <p className="max-w-md truncate text-xs text-sky-200/80">{currentItem?.url}</p>
              <a href={currentItem?.url} target="_blank" rel="noopener noreferrer" className="win-button win-button--primary">
                Abrir demo en una pestaña nueva
              </a>
            </div>
          )}
          {isYouTube && !needsConsent && !isImage && (
            <button
              type="button"
              className={`wmp-shield ${isPlaying ? "" : "is-paused"}`}
              onClick={togglePlay}
              aria-label={isPlaying ? "Pausar" : "Reproducir"}
            >
              {!isPlaying && (
                // eslint-disable-next-line @next/next/no-img-element
                <img src="/images/win7/wmp/wmp-icon.png" alt="" width={96} height={96} draggable={false} />
              )}
            </button>
          )}
        </div>

        <footer className="wmp-controls">
          {/* Seek bar spans the whole bar, like WMP 12 */}
          <div className="flex items-center gap-2 px-3">
            <span className="wmp-time">{formatTime(currentTime)}</span>
            <input
              type="range"
              min="0"
              max={duration || 1}
              value={Math.min(currentTime, duration)}
              onChange={(e) => handleSeek(Number(e.target.value))}
              aria-label="Posición"
              className="wmp-seek"
              style={{ "--p": progress } as CSSProperties}
            />
            <span className="wmp-time">{formatTime(duration)}</span>
          </div>

          <div className="wmp-controls-row">
            <p className="wmp-now" title={currentItem?.title}>
              {currentItem?.title}
              {items.length > 1 && (
                <span className="text-sky-300/80">
                  {" "}
                  · {currentIndex + 1} de {items.length}
                </span>
              )}
            </p>

            <div className="flex items-center gap-1">
              <button type="button" className={`wmp-tool ${isShuffle ? "is-on" : ""}`} onClick={() => setIsShuffle((s) => !s)} aria-pressed={isShuffle} title="Orden aleatorio">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={isShuffle ? "/images/win7/wmp/wmp-shuffle-active.png" : "/images/win7/wmp/wmp-shuffle.png"} alt="" width={25} height={25} draggable={false} />
                <span className="sr-only">Orden aleatorio</span>
              </button>
              <button type="button" className={`wmp-tool ${isRepeat ? "is-on" : ""}`} onClick={() => setIsRepeat((r) => !r)} aria-pressed={isRepeat} title="Repetir">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={isRepeat ? "/images/win7/wmp/wmp-repeat-active.png" : "/images/win7/wmp/wmp-repeat.png"} alt="" width={25} height={25} draggable={false} />
                <span className="sr-only">Repetir</span>
              </button>

              {/* Original WMP 12 transport pod: one bitmap, each segment lights up on its own. */}
              <div className="wmp-pod">
                <button type="button" className="wmp-pod-btn wmp-pod-stop" onClick={handleStop} aria-label="Detener" title="Detener (Ctrl+S)">
                  <span className="wmp-stop-glyph" />
                </button>
                <button type="button" className="wmp-pod-btn wmp-pod-prev" onClick={prev} aria-label="Anterior" title="Anterior (Ctrl+B)">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src="/images/win7/wmp/wmp-prev.png" alt="" width={53} height={25} draggable={false} />
                </button>
                <button type="button" className="wmp-pod-btn wmp-pod-next" onClick={next} aria-label="Siguiente" title="Siguiente (Ctrl+F)">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src="/images/win7/wmp/wmp-next.png" alt="" width={53} height={25} draggable={false} />
                </button>
                <button
                  type="button"
                  className="wmp-pod-btn wmp-pod-orb"
                  onClick={togglePlay}
                  aria-label={isPlaying ? "Pausar" : "Reproducir"}
                  title={isPlaying ? "Pausar (Espacio)" : "Reproducir (Espacio)"}
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={isPlaying ? "/images/win7/wmp/wmp-pause.png" : "/images/win7/wmp/wmp-play.png"} alt="" width={42} height={43} draggable={false} />
                </button>
              </div>

              <button type="button" className="wmp-tool" onClick={toggleMute} aria-pressed={isMuted} title={isMuted ? "Activar sonido (F7)" : "Silenciar (F7)"}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={isMuted || volume === 0 ? "/images/win7/wmp/wmp-volume-mute.png" : "/images/win7/wmp/wmp-volume.png"}
                  alt=""
                  width={22}
                  height={22}
                  className="size-[22px]"
                  draggable={false}
                />
                <span className="sr-only">{isMuted ? "Activar sonido" : "Silenciar"}</span>
              </button>
              <input
                type="range"
                min="0"
                max="100"
                value={vol}
                onChange={(e) => handleVolumeChange(Number(e.target.value))}
                aria-label="Volumen"
                className="wmp-volume hidden sm:block"
                style={{ "--p": `${vol}%` } as CSSProperties}
              />
              {isYouTube && (
                <select
                  className="wmp-quality"
                  aria-label="Calidad del video"
                  title="Calidad del video"
                  value={quality}
                  onChange={(e) => handleQualityChange(e.target.value)}
                >
                  <option value="default">Calidad: Auto</option>
                  {(qualities.length ? qualities : QUALITY_ORDER.slice(0, 5)).map((q) => (
                    <option key={q} value={q}>
                      {QUALITY_LABEL[q]}
                    </option>
                  ))}
                </select>
              )}
            </div>

            <div className="flex justify-end">
              <button
                type="button"
                className="wmp-tool"
                onClick={() => setIsMaximized((m) => !m)}
                title={isMaximized ? "Salir de pantalla completa (Alt+Enter)" : "Pantalla completa (Alt+Enter)"}
              >
                <svg viewBox="0 0 16 16" className="size-4" aria-hidden="true">
                  <path d="M1.5 5.5v-4h4M10.5 1.5h4v4M14.5 10.5v4h-4M5.5 14.5h-4v-4" fill="none" stroke="#dff3ff" strokeWidth="1.6" />
                </svg>
                <span className="sr-only">Pantalla completa</span>
              </button>
            </div>
          </div>
        </footer>
      </div>
    </div>
  );
}

export function WindowsMediaPlayer({
  items,
  initialIndex = 0,
  open,
  onClose,
}: WMPProps) {
  if (!open || items.length === 0) return null;
  // Portal to <body>: the Aero frame's backdrop-filter would otherwise become the containing
  // block of this fixed overlay (trapping it inside the window, under the taskbar).
  return createPortal(
    <WMPInner
      key={`${initialIndex}-${items.length}-${items[initialIndex]?.url || ""}`}
      items={items}
      initialIndex={initialIndex}
      onClose={onClose}
    />,
    document.body,
  );
}
