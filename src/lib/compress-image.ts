/**
 * Browser-side: shrinks an image to WebP before upload so Storage stays small and uploads fast.
 * `square` crops the centre (profile photos). Returns the original file when it cannot be improved.
 */
export async function compressImage(file: File, opts: { maxSide: number; square?: boolean; quality?: number }): Promise<File> {
  try {
    const bitmap = await createImageBitmap(file);
    const side = opts.square ? Math.min(bitmap.width, bitmap.height) : Math.max(bitmap.width, bitmap.height);
    const scale = Math.min(1, opts.maxSide / side);
    const sw = opts.square ? side : bitmap.width;
    const sh = opts.square ? side : bitmap.height;
    const sx = opts.square ? (bitmap.width - side) / 2 : 0;
    const sy = opts.square ? (bitmap.height - side) / 2 : 0;
    const canvas = document.createElement("canvas");
    canvas.width = Math.max(1, Math.round(sw * scale));
    canvas.height = Math.max(1, Math.round(sh * scale));
    canvas.getContext("2d")?.drawImage(bitmap, sx, sy, sw, sh, 0, 0, canvas.width, canvas.height);
    bitmap.close();
    const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, "image/webp", opts.quality ?? 0.85));
    if (!blob || blob.type !== "image/webp" || (!opts.square && scale === 1 && blob.size >= file.size)) return file;
    return new File([blob], file.name.replace(/\.\w+$/, "") + ".webp", { type: "image/webp" });
  } catch {
    return file;
  }
}
