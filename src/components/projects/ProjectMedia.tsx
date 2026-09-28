"use client";

import { useState, type ReactNode } from "react";
import { IconFolder } from "@/components/icons";
import { IconWindowsMediaPlayer } from "@/components/icons/admin-icons";
import { ScreenshotCarousel } from "@/components/projects/ScreenshotCarousel";
import { PhotoViewer } from "@/components/win7/PhotoViewer";
import { WindowsMediaPlayer, type MediaItem } from "@/components/win7/WindowsMediaPlayer";

interface ProjectMediaProps {
  title: string;
  demoUrl: string | null;
  videoUrl: string | null;
  repoUrl: string | null;
  images: string[];
  cover: string | null;
  /** Title, tagline and tech chips, rendered next to the cover. */
  heading: ReactNode;
  /** Shown between the header and the screenshots (the recommendations). */
  children?: ReactNode;
}

const isVideoUrl = (url: string) => /youtube\.com|youtu\.be|vimeo\.com|\.(mp4|webm)$/i.test(url);
const external = { target: "_blank", rel: "noopener noreferrer" } as const;

/** Project header (cover = play), action buttons and screenshot gallery; demo/video in WMP, screenshots in the Photo Viewer. */
export function ProjectMedia({ title, demoUrl, videoUrl, repoUrl, images, cover, heading, children }: ProjectMediaProps) {
  const [openAt, setOpenAt] = useState<number | null>(null);
  const [photoAt, setPhotoAt] = useState<number | null>(null);

  const playlist: MediaItem[] = [
    ...(videoUrl ? [{ id: "video", title: `${title} · Video`, type: "video" as const, url: videoUrl }] : []),
    ...(demoUrl
      ? [{ id: "demo", title: `${title} · Demo`, type: isVideoUrl(demoUrl) ? ("video" as const) : ("web" as const), url: demoUrl }]
      : []),
  ];
  const photos = images.map((url, i) => ({ url, title: `${title} · Imagen ${i + 1}` }));
  const liveSite = demoUrl && !isVideoUrl(demoUrl) ? demoUrl : null;
  const playable = playlist.length > 0;
  const openCover = playable ? () => setOpenAt(0) : images.length ? () => setPhotoAt(0) : undefined;

  return (
    <>
      <div className="project-hero">
        <button
          type="button"
          className="project-hero-cover"
          data-track={playable ? "demo" : undefined}
          onClick={openCover}
          disabled={!openCover}
          aria-label={playable ? `Reproducir la demo de ${title}` : `Ver las imágenes de ${title}`}
        >
          {cover ? (
            // Plain img: covers can be any https host added from the admin panel.
            // eslint-disable-next-line @next/next/no-img-element
            <img src={cover} alt="" decoding="async" className="size-full object-cover" />
          ) : (
            <IconFolder className="size-20 drop-shadow-lg" />
          )}
          {playable && (
            <span className="project-hero-play" aria-hidden="true">
              <IconWindowsMediaPlayer className="size-9" />
            </span>
          )}
        </button>
        <div className="min-w-0 space-y-3">
          {heading}
          <div className="flex flex-wrap gap-2">
            {playable && (
              <button type="button" className="win-button win-button--primary inline-flex items-center gap-2" data-track="demo" onClick={() => setOpenAt(0)}>
                <span aria-hidden="true">
                  <IconWindowsMediaPlayer className="size-4" />
                </span>
                Reproducir demo
              </button>
            )}
            {liveSite && (
              <a href={liveSite} className="win-button" {...external}>
                Abrir sitio en vivo
              </a>
            )}
            {repoUrl && (
              <a href={repoUrl} className="win-button" {...external}>
                Ver código en GitHub
              </a>
            )}
          </div>
        </div>
      </div>

      {children}

      {images.length > 0 && (
        <section aria-labelledby="gallery-title">
          <h3 id="gallery-title" className="cp-group-title">
            Capturas de pantalla
          </h3>
          <div className="mt-3">
            <ScreenshotCarousel images={images} title={title} onOpen={setPhotoAt} />
          </div>
        </section>
      )}

      <WindowsMediaPlayer open={openAt !== null} items={playlist} initialIndex={openAt ?? 0} onClose={() => setOpenAt(null)} />
      <PhotoViewer open={photoAt !== null} photos={photos} initialIndex={photoAt ?? 0} onClose={() => setPhotoAt(null)} />
    </>
  );
}
