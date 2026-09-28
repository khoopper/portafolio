"use client";

import { useCallback, useEffect, useRef, useState, type PointerEvent, type WheelEvent } from "react";
import { createPortal } from "react-dom";
import { CloseGlyph, MaxGlyph, MinGlyph, Win7Icon } from "@/components/icons";
import { dragStyle, useWindowDrag, type Offset } from "./use-window-drag";

export interface Photo {
  url: string;
  title: string;
}

interface PhotoViewerProps {
  photos: Photo[];
  initialIndex?: number;
  open: boolean;
  onClose: () => void;
}

const ZOOM_STEPS = [1, 1.5, 2, 3, 4];
const ZOOM_MAX = ZOOM_STEPS[ZOOM_STEPS.length - 1];
const SLIDE_MS = 3500;
const HUD_MS = 2200;

/** Windows 7 "Visualizador de fotos de Windows" for project screenshots. */
export function PhotoViewer({ photos, initialIndex = 0, open, onClose }: PhotoViewerProps) {
  if (!open || photos.length === 0) return null;
  // Portal: the Aero frame's backdrop-filter would otherwise trap this fixed overlay.
  return createPortal(<Viewer key={initialIndex} photos={photos} initialIndex={initialIndex} onClose={onClose} />, document.body);
}

function Viewer({ photos, initialIndex, onClose }: { photos: Photo[]; initialIndex: number; onClose: () => void }) {
  const [index, setIndex] = useState(Math.min(initialIndex, photos.length - 1));
  const [zoom, setZoom] = useState(1);
  const [rotation, setRotation] = useState(0);
  const [turnFit, setTurnFit] = useState(1); // extra scale so a 90°-rotated photo still fits
  const [pan, setPan] = useState<Offset>({ x: 0, y: 0 });
  const [slideshow, setSlideshow] = useState(false);
  const [paused, setPaused] = useState(false);
  const [hud, setHud] = useState(true); // slideshow controls, shown while the mouse moves
  const [zoomOpen, setZoomOpen] = useState(false);
  const hudTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [maximized, setMaximized] = useState(false);
  const [offset, setOffset] = useState<Offset>({ x: 0, y: 0 });

  const windowRef = useRef<HTMLDivElement>(null);
  const stageRef = useRef<HTMLDivElement>(null);
  const imgRef = useRef<HTMLImageElement>(null);
  const panStart = useRef<{ x: number; y: number; px: number; py: number } | null>(null);
  const dragHandlers = useWindowDrag(windowRef, offset, setOffset, !maximized);

  const photo = photos[index];
  const many = photos.length > 1;

  const show = useCallback(
    (i: number) => {
      setIndex((i + photos.length) % photos.length);
      setZoom(1);
      setRotation(0);
      setTurnFit(1);
      setPan({ x: 0, y: 0 });
    },
    [photos.length],
  );
  const prev = useCallback(() => show(index - 1), [show, index]);
  const next = useCallback(() => show(index + 1), [show, index]);

  const zoomBy = useCallback(
    (dir: 1 | -1) => {
      const i = ZOOM_STEPS.findIndex((s) => s >= zoom - 0.001);
      const nz = ZOOM_STEPS[Math.min(Math.max((i < 0 ? ZOOM_STEPS.length - 1 : i) + dir, 0), ZOOM_STEPS.length - 1)];
      setZoom(nz);
      if (nz === 1) setPan({ x: 0, y: 0 });
    },
    [zoom],
  );

  const zoomTo = (z: number) => {
    setZoom(z);
    if (z <= 1) setPan({ x: 0, y: 0 });
  };

  // 1:1 — the photo at its real pixel size (relative to how it is fitted now).
  const actualSize = () => {
    const img = imgRef.current;
    if (!img?.clientWidth) return;
    const real = img.naturalWidth / img.clientWidth;
    setZoom((z) => (Math.abs(z - real) < 0.01 ? 1 : real));
    setPan({ x: 0, y: 0 });
  };

  const rotate = (dir: 1 | -1) => {
    const nextRotation = rotation + dir * 90;
    const img = imgRef.current;
    const stage = stageRef.current;
    const quarter = Math.abs(nextRotation / 90) % 2 === 1;
    setRotation(nextRotation);
    setTurnFit(
      quarter && img && stage && img.clientWidth
        ? Math.min(1, stage.clientWidth / img.clientHeight, stage.clientHeight / img.clientWidth)
        : 1,
    );
  };

  // Keyboard, as in the real viewer: arrows, +/-, F11 slideshow, Esc.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") return slideshow ? setSlideshow(false) : onClose();
      if (e.key === "ArrowRight") next();
      if (e.key === "ArrowLeft") prev();
      if (e.key === "+" || e.key === "=") zoomBy(1);
      if (e.key === "-") zoomBy(-1);
      if (e.key === "F11") {
        e.preventDefault();
        setSlideshow((s) => !s);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [next, prev, zoomBy, onClose, slideshow]);

  useEffect(() => {
    if (!slideshow || paused || !many) return;
    const id = setInterval(() => setIndex((i) => (i + 1) % photos.length), SLIDE_MS);
    return () => clearInterval(id);
  }, [slideshow, paused, many, photos.length]);

  // Slideshow controls fade away when the mouse rests, like Windows 7.
  const wakeHud = useCallback(() => {
    setHud(true);
    if (hudTimer.current) clearTimeout(hudTimer.current);
    hudTimer.current = setTimeout(() => setHud(false), HUD_MS);
  }, []);
  useEffect(() => {
    if (!slideshow) return;
    hudTimer.current = setTimeout(() => setHud(false), HUD_MS);
    return () => {
      if (hudTimer.current) clearTimeout(hudTimer.current);
    };
  }, [slideshow]);

  const onWheel = (e: WheelEvent) => zoomBy(e.deltaY < 0 ? 1 : -1);

  // Pan a zoomed photo by dragging it.
  const onStageDown = (e: PointerEvent<HTMLDivElement>) => {
    if (zoom <= 1 || e.button !== 0) return;
    panStart.current = { x: e.clientX, y: e.clientY, px: pan.x, py: pan.y };
    e.currentTarget.setPointerCapture(e.pointerId);
  };
  const onStageMove = (e: PointerEvent<HTMLDivElement>) => {
    const p = panStart.current;
    if (p) setPan({ x: p.px + e.clientX - p.x, y: p.py + e.clientY - p.y });
  };
  const onStageUp = () => {
    panStart.current = null;
  };

  if (slideshow) {
    return (
      <div className={`pv-slideshow ${hud ? "" : "hud-off"}`} role="dialog" aria-label="Presentación" onMouseMove={wakeHud}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img key={photo.url} src={photo.url} alt={photo.title} className="pv-slide" onClick={() => setSlideshow(false)} />
        {/* Original Win7 slideshow controls */}
        <div className="pv-hud" onFocus={wakeHud}>
          <button type="button" className="pvb pvb-show-prev" onClick={prev} disabled={!many} aria-label="Anterior" />
          <button
            type="button"
            className={`pvb ${paused ? "pvb-show-play" : "pvb-show-pause"}`}
            onClick={() => setPaused((p) => !p)}
            disabled={!many}
            aria-label={paused ? "Reanudar presentación" : "Pausar presentación"}
          />
          <button type="button" className="pvb pvb-show-next" onClick={next} disabled={!many} aria-label="Siguiente" />
          <button type="button" className="pv-hud-exit" onClick={() => setSlideshow(false)}>
            Salir
          </button>
        </div>
      </div>
    );
  }

  return (
    <div role="dialog" aria-modal="true" aria-label="Visualizador de fotos de Windows" className="wmp-overlay">
      <div ref={windowRef} className={`aero-frame pv-window ${maximized ? "wmp-window--max" : ""}`} style={dragStyle(offset, maximized)}>
        <header className="aero-titlebar" onDoubleClick={() => setMaximized((m) => !m)} {...dragHandlers}>
          <Win7Icon name="photo-viewer" className="aero-title-icon wmp-title-icon" />
          <h2 className="aero-title">
            {photo.title} - Visualizador de fotos de Windows
          </h2>
          <div className="caption-btns" onDoubleClick={(e) => e.stopPropagation()}>
            <button type="button" className="caption-btn" aria-label="Minimizar" onClick={onClose}>
              <MinGlyph />
            </button>
            <button type="button" className="caption-btn" aria-label={maximized ? "Restaurar" : "Maximizar"} onClick={() => setMaximized((m) => !m)}>
              <MaxGlyph />
            </button>
            <button type="button" className="caption-btn caption-btn--close" aria-label="Cerrar" onClick={onClose}>
              <CloseGlyph />
            </button>
          </div>
        </header>

        <div className="pv-client">
          <nav className="pv-menubar" aria-label="Menú del visualizador">
            <a href={photo.url} target="_blank" rel="noopener noreferrer" className="pv-menu-item">
              Abrir
            </a>
            <a href={photo.url} download className="pv-menu-item">
              Guardar una copia
            </a>
            {many && (
              <span className="ml-auto pr-2 text-xs text-win-muted">
                {index + 1} de {photos.length}
              </span>
            )}
          </nav>
          <div
            ref={stageRef}
            className={`pv-stage ${zoom > 1 ? "is-zoomed" : ""}`}
            onWheel={onWheel}
            onPointerDown={onStageDown}
            onPointerMove={onStageMove}
            onPointerUp={onStageUp}
            onPointerCancel={onStageUp}
            onDoubleClick={actualSize}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              ref={imgRef}
              key={photo.url}
              src={photo.url}
              alt={photo.title}
              draggable={false}
              className="pv-photo"
              style={{ transform: `translate(${pan.x}px, ${pan.y}px) rotate(${rotation}deg) scale(${zoom * turnFit})` }}
            />
          </div>
        </div>

        {/* Bottom bar on the glass: the original Photo Viewer button bitmaps
            (each sprite = disabled · normal · hover · pressed). */}
        <div className="pv-controls">
          <div className="relative">
            <button
              type="button"
              className="pvb pvb-zoom"
              onClick={() => setZoomOpen((o) => !o)}
              aria-expanded={zoomOpen}
              aria-label="Cambiar el tamaño de la presentación"
              title="Cambiar el tamaño de la presentación"
            />
            {zoomOpen && (
              <div className="pv-zoom-pop">
                <input
                  type="range"
                  min={1}
                  max={ZOOM_MAX}
                  step={0.1}
                  value={Math.min(zoom, ZOOM_MAX)}
                  onChange={(e) => zoomTo(Number(e.target.value))}
                  onBlur={() => setZoomOpen(false)}
                  aria-label="Zoom"
                  autoFocus
                />
              </div>
            )}
          </div>
          <button
            type="button"
            className={`pvb ${zoom === 1 ? "pvb-actual" : "pvb-fit"}`}
            onClick={() => (zoom === 1 ? actualSize() : zoomTo(1))}
            aria-label={zoom === 1 ? "Tamaño real" : "Ajustar a la ventana"}
            title={zoom === 1 ? "Tamaño real" : "Ajustar a la ventana"}
          />
          <span className="pv-sep" aria-hidden="true" />
          <div className="flex items-center">
            <button type="button" className="pvb pvb-prev" onClick={prev} disabled={!many} aria-label="Anterior" title="Anterior (Flecha izquierda)" />
            <button type="button" className="pvb pvb-slideshow" onClick={() => setSlideshow(true)} aria-label="Reproducir presentación" title="Reproducir presentación (F11)" />
            <button type="button" className="pvb pvb-next" onClick={next} disabled={!many} aria-label="Siguiente" title="Siguiente (Flecha derecha)" />
          </div>
          <span className="pv-sep" aria-hidden="true" />
          <button type="button" className="pvb pvb-rotate-ccw" onClick={() => rotate(-1)} aria-label="Girar a la izquierda" title="Girar en sentido contrario a las agujas del reloj" />
          <button type="button" className="pvb pvb-rotate-cw" onClick={() => rotate(1)} aria-label="Girar a la derecha" title="Girar en el sentido de las agujas del reloj" />
        </div>
      </div>
    </div>
  );
}

