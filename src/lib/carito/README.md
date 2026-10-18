# Carito Music en khoopper.com

Carito Music (la app Android de música del dueño) usa este Supabase para las cuentas de sus amigos, y este panel para administrarlas.

## Qué hay

| Parte | Archivo |
| --- | --- |
| Tablas y funciones | `supabase/migrations/20261018000000_carito_music.sql` |
| Comprobación SQL (se revierte sola) | `supabase/tests/carito_music.sql` |
| Reglas de la licencia (iguales a las del SQL) | `src/lib/carito/licence.ts` (+ `licence.test.ts`) |
| Lectura para el panel | `src/lib/carito/queries.ts` |
| Acciones del panel | `src/app/(admin)/admin/carito-actions.ts` |
| Pantalla | `src/app/(admin)/admin/(dashboard)/carito/page.tsx` + `src/components/admin/CaritoAdmin.tsx` |

- La app entra con la cuenta de Google del amigo (Supabase Auth, `id_token`) y solo puede llamar a `carito_check_in`,
  `carito_take_over`, `carito_save_library` y `carito_load_library`, siempre sobre su propia fila. `carito_members`, `carito_trials` y
  `carito_libraries` tienen RLS sin políticas y sin permisos para `anon`/`authenticated`.
- El panel usa la clave secreta en el servidor, después de `hasAdminSession()` (correo + MFA) en el proxy, el layout y cada acción.
- **Prueba**: 3 días al registrar una cuenta en un teléfono que nunca tuvo una (`carito_trials`, por código de teléfono).
- **Licencia**: último día en fecha de El Salvador (`licence_until`) o sin límite; renovar suma desde el final de la vigente.
- **Revocar**: `revoked_at`; la app se bloquea en su siguiente comprobación (al abrir y cada hora; sin conexión, a más tardar 30 días).
- **Un teléfono por cuenta**: `device_code`; "Liberar teléfono" lo deja libre para el siguiente que entre.
- **Biblioteca**: el respaldo de la app (playlists, favoritas, reproducciones) en `carito_libraries.snapshot`, hasta 5 MB.

## Puesta en marcha

1. SQL Editor de Supabase (producción): ejecutar la migración y después la comprobación.
2. Google Cloud, mismo proyecto que el inicio de sesión con Google del sitio: crear un cliente OAuth **Android** para
   `com.audiocore.hifi` con la SHA-1 de la llave de la app. En Supabase → Authentication → Providers → Google, el cliente Web debe
   estar en "Client IDs".
3. La app necesita la URL de Supabase, la clave publicable y el ID del cliente Web (los pasos de la app están en su repositorio,
   `docs/REGISTRO_GOOGLE.md`).
