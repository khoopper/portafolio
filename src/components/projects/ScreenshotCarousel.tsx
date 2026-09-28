"use client";

import { useEffect, useRef, useState } from "react";

interface ScreenshotCarouselProps {
  images: string[];
  title: string;
  /** Opens the Windows Photo Viewer at this image. */
  onOpen: (index: number) => void;
}

/** One screenshot at a time: swipe, drag the bar, use the arrows, the dots or the keyboard (← →). */
export function ScreenshotCarousel({ images, title, onOpen }: ScreenshotCarouselProps) {
  const track = useRef<HTMLUListElement>(null);
  const [index, setIndex] = useState(0);
  const frame = useRef(0);

  // Follows the swipe: the slide whose centre is nearest the viewport centre is the current one.
  useEffect(() => {
    const el = track.current;
    if (!el) return;
    const onScroll = () => {
      cancelAnimationFrame(frame.current);
      frame.current = requestAnimationFrame(() => setIndex(Math.round(el.scrollLeft / Math.max(1, el.clientWidth))));
    };
    el.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      el.removeEventListener("scroll", onScroll);
      cancelAnimationFrame(frame.current);
    };
  }, []);

  const goTo = (i: number) => {
    const el = track.current;
    if (!el) return;
    const next = Math.min(images.length - 1, Math.max(0, i));
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    el.scrollTo({ left: next * el.clientWidth, behavior: reduce ? "auto" : "smooth" });
  };

  return (
    <div
      className="shots"
      role="group"
      aria-roledescription="carrusel"
      aria-label={`Capturas de pantalla de ${title}`}
      onKeyDown={(e) => {
        if (e.key === "ArrowRight") goTo(index + 1);
        else if (e.key === "ArrowLeft") goTo(index - 1);
        else return;
        e.preventDefault();
      }}
    >
      <div className="shots-stage">
        <ul ref={track} className="shots-track" tabIndex={0} aria-label="Capturas">
          {images.map((src, i) => (
            <li key={`${src}-${i}`} className="shots-slide" aria-roledescription="diapositiva" aria-label={`${i + 1} de ${images.length}`}>
              <button type="button" className="shots-open" onClick={() => onOpen(i)} aria-label={`Ver imagen ${i + 1} en el Visualizador de fotos`}>
                {/* Plain img: gallery URLs can be any https host added from the admin panel. */}
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={src} alt="" loading={i === 0 ? "eager" : "lazy"} decoding="async" draggable={false} />
              </button>
            </li>
          ))}
        </ul>
        {images.length > 1 && (
          <>
            <button type="button" className="shots-arrow shots-arrow--prev" onClick={() => goTo(index - 1)} disabled={index === 0} aria-label="Imagen anterior">
              <svg viewBox="0 0 16 16" aria-hidden="true">
                <path d="M10 2 4 8l6 6" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </button>
            <button type="button" className="shots-arrow shots-arrow--next" onClick={() => goTo(index + 1)} disabled={index === images.length - 1} aria-label="Imagen siguiente">
              <svg viewBox="0 0 16 16" aria-hidden="true">
                <path d="m6 2 6 6-6 6" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </button>
          </>
        )}
      </div>
      {images.length > 1 && (
        <div className="shots-bar">
          <span className="shots-count" aria-live="polite">
            {index + 1} de {images.length}
          </span>
          <div className="shots-dots">
            {images.map((_, i) => (
              <button key={i} type="button" className="shots-dot" aria-label={`Ir a la imagen ${i + 1}`} aria-current={i === index ? "true" : undefined} onClick={() => goTo(i)} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
