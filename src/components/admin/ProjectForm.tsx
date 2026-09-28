"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useActionState, useEffect, useRef, useState } from "react";
import { IconAdd, IconCancel, IconOk, IconWarning, Win7Icon } from "@/components/icons";
import { IconWindowsMediaPlayer } from "@/components/icons/admin-icons";
import { useConfirm } from "@/components/win7/MessageBox";
import { Tabs } from "@/components/win7/Tabs";
import { PhotoViewer } from "@/components/win7/PhotoViewer";
import { WindowsMediaPlayer, type MediaItem } from "@/components/win7/WindowsMediaPlayer";
import { cn } from "@/lib/cn";
import { compressImage } from "@/lib/compress-image";
import type { Project } from "@/lib/types";
import { uploadProjectImageAction } from "@/app/(admin)/admin/media-actions";
import { saveProjectAction, type ProjectActionResult } from "@/app/(admin)/admin/project-actions";

interface Props {
  project?: Project | null;
  isNew?: boolean;
}

export function ProjectForm({ project, isNew = false }: Props) {
  const router = useRouter();
  const [confirm, messageBox] = useConfirm();
  const [state, formAction, isPending] = useActionState<ProjectActionResult | null, FormData>(
    saveProjectAction,
    null
  );

  const [status, setStatus] = useState<"published" | "draft">(
    project ? project.status : "published"
  );

  const [demoUrl, setDemoUrl] = useState<string>(project?.demoUrl || "");

  // Lista de imágenes agregadas
  const [images, setImages] = useState<string[]>(
    project?.images && project.images.length > 0
      ? project.images
      : project?.cover
      ? [project.cover]
      : []
  );
  const [newImageUrl, setNewImageUrl] = useState("");
  const [uploading, setUploading] = useState(false);
  const [uploadNote, setUploadNote] = useState<{ ok: boolean; text: string } | null>(null);
  const fileInput = useRef<HTMLInputElement>(null);

  // Estado del Reproductor de Windows Media
  const [wmpState, setWmpState] = useState<{
    open: boolean;
    items: MediaItem[];
    initialIndex: number;
  }>({
    open: false,
    items: [],
    initialIndex: 0,
  });

  const toggleStatus = () => {
    setStatus((prev) => (prev === "published" ? "draft" : "published"));
  };

  const handleAddImage = () => {
    const trimmed = newImageUrl.trim();
    if (!trimmed) return;
    setImages((prev) => [...prev, trimmed]);
    setNewImageUrl("");
  };

  // Images go to Supabase Storage (shrunk in the browser first); the project keeps only their URLs.
  const uploadFiles = async (files: FileList | null) => {
    if (!files?.length) return;
    setUploading(true);
    setUploadNote(null);
    const urls: string[] = [];
    let failure: string | null = null;
    for (const file of Array.from(files)) {
      const data = new FormData();
      data.set("image", await compressImage(file, { maxSide: 1600 }));
      data.set("folder", "projects");
      const result = await uploadProjectImageAction(data);
      if (result.ok && result.url) urls.push(result.url);
      else failure = result.message;
    }
    if (urls.length) setImages((prev) => [...prev, ...urls]);
    setUploadNote(failure ? { ok: false, text: failure } : { ok: true, text: urls.length === 1 ? "Imagen subida." : `${urls.length} imágenes subidas.` });
    setUploading(false);
    if (fileInput.current) fileInput.current.value = "";
  };

  const handleRemoveImage = (index: number) => {
    setImages((prev) => prev.filter((_, i) => i !== index));
  };

  const buildMediaPlaylist = (): MediaItem[] => {
    const list: MediaItem[] = [];
    const pTitle = project?.title || "Proyecto";

    if (demoUrl.trim()) {
      const isVideo =
        demoUrl.includes("youtube") ||
        demoUrl.includes("youtu.be") ||
        demoUrl.includes("vimeo") ||
        demoUrl.match(/\.(mp4|webm)$/i);
      list.push({
        id: "demo",
        title: `${pTitle} · Demo en Vivo`,
        type: isVideo ? "video" : "web",
        url: demoUrl.trim(),
      });
    }

    return list;
  };

  const openDemoInWMP = () => {
    const playlist = buildMediaPlaylist();
    if (playlist.length === 0) return;
    setWmpState({
      open: true,
      items: playlist,
      initialIndex: 0,
    });
  };

  // Screenshots open in the Windows Photo Viewer, not in the media player.
  const [photoAt, setPhotoAt] = useState<number | null>(null);
  const openImageInWMP = (imageIndex: number) => setPhotoAt(imageIndex);

  useEffect(() => {
    if (state?.success) {
      router.push("/admin/proyectos");
      router.refresh();
    }
  }, [state, router]);

  const tabs = [
    {
      id: "general",
      label: "General",
      content: (
        <div className="space-y-3.5 text-xs">
          {/* Ambos rectángulos alineados perfectamente a la misma altura */}
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div>
              <label htmlFor="title" className="block font-semibold text-win-heading mb-1">
                Nombre del Proyecto:
              </label>
              <input
                id="title"
                name="title"
                type="text"
                required
                defaultValue={project?.title || ""}
                placeholder="Ej. SaaS Gestión Clínica"
                className="w-full rounded border border-[#a4b3c7] p-2 text-xs focus:border-[#2f88ca] focus:outline-none"
              />
            </div>

            <div>
              <label htmlFor="slug" className="block font-semibold text-win-heading mb-1">
                Identificador del Sistema (Slug):
              </label>
              <input
                id="slug"
                name="slug"
                type="text"
                defaultValue={project?.slug || ""}
                placeholder="mi-proyecto (autogenerado si vacío)"
                className="w-full rounded border border-[#a4b3c7] p-2 text-xs focus:border-[#2f88ca] focus:outline-none"
              />
            </div>
          </div>

          <div>
            <label htmlFor="tagline" className="block font-semibold text-win-heading mb-1">
              Descripción Corta (Subtítulo):
            </label>
            <input
              id="tagline"
              name="tagline"
              type="text"
              defaultValue={project?.tagline || ""}
              placeholder="Breve resumen de una línea que aparece en tarjetas..."
              className="w-full rounded border border-[#a4b3c7] p-2 text-xs focus:border-[#2f88ca] focus:outline-none"
            />
          </div>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div>
              <label htmlFor="role" className="block font-semibold text-win-heading mb-1">
                Rol Desempeñado:
              </label>
              <input
                id="role"
                name="role"
                type="text"
                defaultValue={project?.role || "Desarrollador Full Stack"}
                className="w-full rounded border border-[#a4b3c7] p-2 text-xs focus:border-[#2f88ca] focus:outline-none"
              />
            </div>

            <div>
              <label htmlFor="year" className="block font-semibold text-win-heading mb-1">
                Año de Desarrollo:
              </label>
              <input
                id="year"
                name="year"
                type="number"
                defaultValue={project?.year || new Date().getFullYear()}
                className="w-full rounded border border-[#a4b3c7] p-2 text-xs focus:border-[#2f88ca] focus:outline-none"
              />
            </div>
          </div>

          <div>
            <label htmlFor="description" className="block font-semibold text-win-heading mb-1">
              Descripción Completa:
            </label>
            <textarea
              id="description"
              name="description"
              rows={4}
              defaultValue={project?.description || ""}
              placeholder="Detalles sobre arquitectura, soluciones implementadas y retos..."
              className="w-full rounded border border-[#a4b3c7] p-2 text-xs focus:border-[#2f88ca] focus:outline-none"
            />
          </div>
        </div>
      ),
    },
    {
      id: "enlaces",
      label: "Enlaces y Multimedia",
      content: (
        <div className="space-y-4 text-xs">
          {/* Campo URL de demo */}
          <fieldset className="win-groupbox space-y-2">
            <legend className="font-semibold text-win-heading">URL de demo</legend>
            <div className="space-y-1.5 pt-1">
              <label htmlFor="demoUrl" className="block text-win-muted text-[11px]">
                Pega aquí un enlace de YouTube, Vimeo, video o cualquier enlace web para que funcione la demostración:
              </label>
              <div className="flex gap-2">
                <input
                  id="demoUrl"
                  name="demoUrl"
                  type="text"
                  value={demoUrl}
                  onChange={(e) => setDemoUrl(e.target.value)}
                  placeholder="https://www.youtube.com/watch?v=... o https://midemo.vercel.app/"
                  className="flex-1 rounded border border-[#a4b3c7] p-2 text-xs focus:border-[#2f88ca] focus:outline-none"
                />
                <button
                  type="button"
                  onClick={openDemoInWMP}
                  disabled={!demoUrl.trim()}
                  className="win-button text-xs flex items-center gap-1.5 shrink-0 disabled:opacity-50"
                  title="Reproducir demo en el Reproductor de Windows Media"
                >
                  <span className="size-4 shrink-0">
                    <IconWindowsMediaPlayer className="size-full" />
                  </span>
                  <span>Reproducir Demo</span>
                </button>
              </div>
            </div>
          </fieldset>

          {/* Repositorio GitHub */}
          <div>
            <label htmlFor="repoUrl" className="block font-semibold text-win-heading mb-1">
              Repositorio de Código (GitHub):
            </label>
            <input
              id="repoUrl"
              name="repoUrl"
              type="url"
              defaultValue={project?.repoUrl || ""}
              placeholder="https://github.com/usuario/repositorio"
              className="w-full rounded border border-[#a4b3c7] p-2 text-xs focus:border-[#2f88ca] focus:outline-none"
            />
          </div>

          {/* Apartado para pegar URLs de Imágenes y ver como Imagen 1, 2, 3... */}
          <fieldset className="win-groupbox space-y-3">
            <legend className="font-semibold text-win-heading">Galería de Imágenes del Proyecto</legend>
            <p className="text-[11px] text-win-muted pt-1">
              Sube las capturas del proyecto (se guardan en Storage y el proyecto solo conserva el enlace) o pega una URL. Al hacer clic en una imagen de la lista se abre en el Visualizador de fotos de Windows.
            </p>

            <div className="flex flex-wrap items-center gap-2">
              <input ref={fileInput} type="file" accept="image/png,image/jpeg,image/webp" multiple className="sr-only" tabIndex={-1} aria-label="Subir imágenes" onChange={(e) => uploadFiles(e.target.files)} />
              <button type="button" className="win-button win-button--primary inline-flex items-center gap-1.5" disabled={uploading} onClick={() => fileInput.current?.click()}>
                <IconAdd className="size-4" />
                <span>{uploading ? "Subiendo…" : "Subir imágenes…"}</span>
              </button>
              {uploadNote && (
                <span role="status" className={cn("inline-flex items-center gap-1.5 text-[11px]", uploadNote.ok ? "text-green-800" : "text-amber-800")}>
                  {uploadNote.ok ? <IconOk className="size-4" /> : <IconWarning className="size-4" />}
                  {uploadNote.text}
                </span>
              )}
            </div>

            {/* Input para agregar nueva URL */}
            <div className="flex gap-2">
              <input
                type="text"
                value={newImageUrl}
                onChange={(e) => setNewImageUrl(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    handleAddImage();
                  }
                }}
                placeholder="Pega la URL de la imagen (ej. /images/projects/... o https://...)"
                className="flex-1 rounded border border-[#a4b3c7] p-2 text-xs focus:border-[#2f88ca] focus:outline-none"
              />
              <button
                type="button"
                onClick={handleAddImage}
                disabled={!newImageUrl.trim()}
                className="win-button text-xs shrink-0 inline-flex items-center gap-1.5 disabled:opacity-50"
              >
                <IconAdd className="size-4" />
                <span>Agregar imagen</span>
              </button>
            </div>

            {/* Lista de imágenes: solo se muestra como Imagen 1, Imagen 2... y al dar clic se extiende */}
            <div className="space-y-1.5 pt-2">
              {images.length === 0 ? (
                <p className="text-center py-4 text-win-muted italic text-[11px] border border-dashed border-gray-200 rounded">
                  No hay imágenes agregadas aún. Pega una URL arriba para comenzar.
                </p>
              ) : (
                images.map((imgUrl, idx) => (
                  <div
                    key={`${imgUrl}-${idx}`}
                    className="flex items-center justify-between p-2 rounded border border-[#c4d5e7] bg-[#fbfcfd] hover:bg-[#edf5fd] transition-colors"
                  >
                    <button
                      type="button"
                      onClick={() => openImageInWMP(idx)}
                      className="flex items-center gap-2.5 text-xs font-semibold text-[#1e3287] hover:underline text-left truncate mr-2"
                      title="Haz clic para verla en el Visualizador de fotos de Windows"
                    >
                      <span className="size-4 shrink-0" aria-hidden="true">
                        <Win7Icon name="photo" className="size-full" />
                      </span>
                      <span>Imagen {idx + 1}</span>
                      <span className="text-[11px] font-normal text-win-muted truncate max-w-md">
                        ({imgUrl})
                      </span>
                    </button>

                    <button
                      type="button"
                      onClick={() => handleRemoveImage(idx)}
                      className="win-button text-[11px] py-0.5 px-2 text-red-700 hover:text-red-900 shrink-0"
                      title="Eliminar de la lista"
                    >
                      Quitar
                    </button>
                  </div>
                ))
              )}
            </div>

            {/* Campos ocultos para enviar en el formulario */}
            <input type="hidden" name="images" value={JSON.stringify(images)} />
            <input type="hidden" name="cover" value={images[0] || project?.cover || ""} />
          </fieldset>
        </div>
      ),
    },
    {
      id: "configuracion",
      label: "Estado y Atributos",
      content: (
        <div className="space-y-4 text-xs">
          {/* Botón interactivo de Habilitado / Deshabilitado */}
          <fieldset className="win-groupbox space-y-2">
            <legend className="font-semibold text-win-heading">Estado de Publicación en el Portafolio</legend>
            <div className="flex flex-wrap items-center gap-3 pt-1">
              <input type="hidden" name="status" value={status} />
              <button
                type="button"
                onClick={toggleStatus}
                className={cn(
                  "win-button text-xs flex items-center gap-2 font-medium px-3.5 py-1.5 transition-colors cursor-pointer",
                  status === "published"
                    ? "win-button--primary text-emerald-900 border-emerald-600 bg-emerald-50"
                    : "text-slate-700 border-gray-400 bg-gray-100"
                )}
                title="Haz clic para alternar entre Habilitado y Deshabilitado"
              >
                {status === "published" ? (
                  <>
                    <IconOk className="size-4" />
                    <span>Habilitado (Visible al público)</span>
                  </>
                ) : (
                  <>
                    <IconCancel className="size-4" />
                    <span>Deshabilitado (Oculto / Borrador)</span>
                  </>
                )}
              </button>
              <span className="text-win-muted text-[11px]">
                {status === "published"
                  ? "El proyecto está activo y visible en el portafolio público."
                  : "El proyecto está deshabilitado y solo se ve en el panel administrativo."}
              </span>
            </div>
          </fieldset>

          <fieldset className="win-groupbox space-y-2">
            <legend className="font-semibold text-win-heading">Ubicación y Prioridad</legend>
            <label className="flex items-center gap-2 cursor-pointer pt-1">
              <input
                type="checkbox"
                name="featured"
                defaultChecked={project?.featured ?? false}
                className="size-4 rounded border-gray-300"
              />
              <span className="font-medium">
                Destacar en la cuadrícula principal de Inicio
              </span>
            </label>
            <p className="text-[11px] text-win-muted pl-6">
              Los proyectos destacados se muestran en las tarjetas principales del Centro de bienvenida.
            </p>
          </fieldset>

          {/* Cuadro de texto amplio para logros sin scroll */}
          <div>
            <label htmlFor="highlights" className="block font-semibold text-win-heading mb-1">
              Logros o Características Clave (separados por coma o renglón):
            </label>
            <textarea
              id="highlights"
              name="highlights"
              rows={6}
              defaultValue={project?.highlights?.join("\n") || ""}
              placeholder="Portales públicos por clínica&#10;Editor visual&#10;Acceso multirol"
              className="w-full rounded border border-[#a4b3c7] p-2.5 text-xs focus:border-[#2f88ca] focus:outline-none min-h-[125px] leading-relaxed"
            />
            <span className="text-[10px] text-win-muted">
              Cada renglón o valor separado por coma se presentará como una característica en el visor.
            </span>
          </div>

          <div>
            <label htmlFor="tech" className="block font-semibold text-win-heading mb-1">
              Tecnologías Asociadas (slugs separados por coma o espacio):
            </label>
            <input
              id="tech"
              name="tech"
              type="text"
              defaultValue={project?.tech?.join(", ") || ""}
              placeholder="nextjs, react, typescript, tailwindcss, supabase, postgresql"
              className="w-full rounded border border-[#a4b3c7] p-2 text-xs focus:border-[#2f88ca] focus:outline-none"
            />
            <span className="text-[10px] text-win-muted">
              Usa los identificadores técnicos para vincular iconos automáticos.
            </span>
          </div>
        </div>
      ),
    },
  ];

  return (
    <>
      <form action={formAction} className="space-y-4">
        {/* Campo oculto para identificar el proyecto original */}
        {project && <input type="hidden" name="originalSlug" value={project.slug} />}

        {/* Notificación de error si falla la validación */}
        {state?.error && (
          <div
            role="alert"
            className="rounded border border-[#e2a82b] bg-[#fffbe6] p-2.5 text-xs text-[#523b00] shadow-sm flex items-center gap-2"
          >
            <IconWarning className="size-4 shrink-0" />
            <span>{state.error}</span>
          </div>
        )}

        {/* Pestañas estilo Propiedades de Windows 7 */}
        <Tabs label="Propiedades del Proyecto" tabs={tabs} fixedHeight />

        {/* Barra de botones de diálogo Win7: [ Aceptar / Guardar ] [ Cancelar ] [ Eliminar ] */}
        <div className="flex items-center justify-between border-t border-[#d5dfe5] pt-3 mt-4">
          {project && !isNew ? (
            <button
              type="button"
              className="win-button text-xs text-red-800 hover:text-red-900"
              onClick={async () => {
                const ok = await confirm({
                  title: "Eliminar proyecto",
                  message: `¿Seguro que quieres eliminar permanentemente el proyecto "${project.title}"? Esta acción no se puede deshacer.`,
                });
                if (ok) (document.getElementById("delete-form") as HTMLFormElement | null)?.requestSubmit();
              }}
            >
              Eliminar proyecto
            </button>
          ) : (
            <div />
          )}

          <div className="flex items-center gap-2">
            <button
              type="submit"
              disabled={isPending}
              className="win-button win-button--primary text-xs min-w-20"
            >
              {isPending ? "Guardando..." : isNew ? "Crear Proyecto" : "Aceptar"}
            </button>
            <Link
              href="/admin/proyectos"
              className="win-button text-xs min-w-20 text-center"
            >
              Cancelar
            </Link>
          </div>
        </div>
      </form>

      {messageBox}

      {/* Visualizador de fotos (capturas) y Reproductor de Windows Media (demo) */}
      <PhotoViewer
        open={photoAt !== null}
        photos={images.map((url, i) => ({ url, title: `${project?.title || "Proyecto"} · Imagen ${i + 1}` }))}
        initialIndex={photoAt ?? 0}
        onClose={() => setPhotoAt(null)}
      />
      <WindowsMediaPlayer
        open={wmpState.open}
        items={wmpState.items}
        initialIndex={wmpState.initialIndex}
        onClose={() => setWmpState((prev) => ({ ...prev, open: false }))}
      />
    </>
  );
}
