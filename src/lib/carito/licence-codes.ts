import { createHash, randomBytes } from "node:crypto";
import { cleanCode, CROCKFORD, LICENCE_CHARS, PAIRING_CHARS } from "./licence";

/**
 * Lo que solo hace el servidor: códigos nuevos y su hash, hechos igual que en
 * `supabase/migrations/20261018010000_carito_licences.sql` (`carito_new_code` y `carito_sha256`).
 * Lo que también usa el navegador (formato y mensajes) vive en `licence.ts`.
 */

export function newLicenceCode(): string {
  return crockford(randomBytes(LICENCE_CHARS), LICENCE_CHARS);
}

/** El código de un solo uso que vincula el teléfono del dueño (15 minutos). */
export function newPairingCode(): string {
  return crockford(randomBytes(PAIRING_CHARS), PAIRING_CHARS);
}

/** Un byte por carácter, módulo 32: lo mismo que hace `carito_new_code` con `gen_random_bytes`. */
function crockford(bytes: Buffer, size: number): string {
  return Array.from(bytes, (byte) => CROCKFORD[byte % 32])
    .join("")
    .slice(0, size);
}

/** sha256 del código, como lo guarda `carito_sha256` (para los códigos de vinculación). */
export function codeHash(text: string): string {
  return createHash("sha256").update(cleanCode(text)).digest("hex");
}
