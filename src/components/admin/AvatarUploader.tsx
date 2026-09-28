"use client";

import { startTransition, useActionState, useRef } from "react";
import { uploadAvatarAction, type MediaActionResult } from "@/app/(admin)/admin/media-actions";
import { Avatar } from "@/components/Avatar";
import { InfoBar } from "@/components/win7/InfoBar";
import { compressImage } from "@/lib/compress-image";

/**
 * Profile photo: click (or double-click) the picture to choose a new one. It is shrunk to a 512 px square
 * in the browser and stored in Supabase Storage; only its URL is saved.
 */
export function AvatarUploader({ name, initialSrc }: { name: string; initialSrc: string | null }) {
  const [state, action, pending] = useActionState<MediaActionResult | null, FormData>(uploadAvatarAction, null);
  const input = useRef<HTMLInputElement>(null);

  const onFile = async (file: File | undefined) => {
    if (!file) return;
    const small = await compressImage(file, { maxSide: 512, square: true, quality: 0.88 });
    const data = new FormData();
    data.set("image", small);
    startTransition(() => action(data));
    if (input.current) input.current.value = "";
  };

  return (
    <div className="w-full space-y-2 text-center">
      <input ref={input} type="file" accept="image/png,image/jpeg,image/webp" className="sr-only" tabIndex={-1} aria-label="Elegir fotografía de perfil" onChange={(e) => onFile(e.target.files?.[0])} />
      <button type="button" className="avatar-pick" disabled={pending} title="Haz clic para cambiar la fotografía" aria-label="Cambiar la fotografía de perfil" onClick={() => input.current?.click()}>
        <span className="user-tile mx-auto block size-32 p-2">
          <Avatar src={state?.url ?? initialSrc} name={name} size={110} priority className="size-full rounded-md" />
        </span>
        <span className="avatar-pick-hint" aria-hidden="true">
          {pending ? "Subiendo…" : "Cambiar foto"}
        </span>
      </button>
      <p className="text-[12px] text-win-muted">Haz clic en la foto para cambiarla (PNG, JPG o WebP; se recorta y optimiza sola).</p>
      {state && <InfoBar ok={state.ok}>{state.message}</InfoBar>}
    </div>
  );
}
