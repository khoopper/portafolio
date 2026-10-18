# Carito Music en khoopper.com

Carito Music (la app Android de música del dueño) usa este Supabase para las cuentas de sus amigos, y este panel para administrarlas.

## Qué hay

| Parte | Archivo |
| --- | --- |
| Tablas y funciones de las cuentas | `supabase/migrations/20261018000000_carito_music.sql` |
| Licencias sin Google y teléfono del dueño | `supabase/migrations/20261018010000_carito_licences.sql` |
| Comprobación SQL de las cuentas (se revierte sola) | `supabase/tests/carito_music.sql` |
| Comprobación SQL de las licencias (se revierte sola) | `supabase/tests/carito_licences.sql` |
| Reglas de la licencia (iguales a las del SQL) | `src/lib/carito/licence.ts` (+ `licence.test.ts`) |
| Códigos nuevos y su hash (solo servidor) | `src/lib/carito/licence-codes.ts` (+ `licence-codes.test.ts`) |
| Lectura de personas | `src/lib/carito/queries.ts` |
| Lectura de licencias | `src/lib/carito/licences.ts` |
| Acciones del panel | `src/app/(admin)/admin/carito-actions.ts` |
| Pantalla | `src/app/(admin)/admin/(dashboard)/carito/page.tsx` + `src/components/admin/CaritoAdmin.tsx` |

- **Cuentas con Google**: la app entra con la cuenta del amigo (Supabase Auth, `id_token`) y solo puede llamar a
  `carito_check_in`, `carito_take_over`, `carito_save_library` y `carito_load_library`, siempre sobre su propia fila. `carito_members`,
  `carito_trials` y `carito_libraries` tienen RLS sin políticas y sin permisos para `anon`/`authenticated`.
- **Prueba**: 3 días al registrar una cuenta en un teléfono que nunca tuvo una (`carito_trials`, por código de teléfono).
- **Licencia de cuenta**: último día en fecha de El Salvador (`licence_until`) o sin límite; renovar suma desde el final de la vigente.
- **Licencias sin Google** (`carito_licences`): el dueño crea el código (panel o app) y el amigo lo escribe una vez en la app: el teléfono
  queda ligado (`device_code`) y recibe un token propio (solo se guarda su hash) con el que comprueba su licencia y guarda su biblioteca
  (`carito_licence_check`, `carito_licence_save_library`, `carito_licence_load_library`). En otro teléfono responde `other_device`, y con
  `p_take_over` la licencia pasa a este. Las licencias de la 2.6 se importan ligadas al código de cada teléfono (`claimable`), y esos
  teléfonos se activan solos (`carito_licence_claim`).
- **Teléfono del dueño** (`carito_owner_devices`): se vincula con un código de un solo uso de 15 minutos que da el panel
  (pestaña Licencias → «Vincular mi teléfono», `carito_owner_pairings`); con su token llama a `carito_owner_licences/create/update/import`.
  Al vincularse sube solo las licencias que hizo en la 2.6.
- **Revocar**: `revoked_at`; la app se bloquea en su siguiente comprobación (al abrir y cada hora; sin conexión, a más tardar 30 días).
- **Un teléfono por cuenta**: `device_code`; «Liberar teléfono» lo deja libre para el siguiente que entre.
- **Biblioteca**: el respaldo de la app (playlists, favoritas, reproducciones) en `carito_libraries` (cuentas) o `carito_licence_libraries`
  (licencias), hasta 5 MB.
- El panel usa la clave secreta en el servidor, después de `hasAdminSession()` (correo + MFA) en el proxy, el layout y cada acción.

## Puesta en marcha

1. SQL Editor de Supabase (producción): ejecutar las dos migraciones en orden y después sus comprobaciones.
2. Google Cloud, mismo proyecto que el inicio de sesión con Google del sitio: crear un cliente OAuth **Android** para
   `com.audiocore.hifi` con la SHA-1 de la llave de la app. En Supabase → Authentication → Providers → Google, el cliente Web debe
   estar en "Client IDs".
3. La app necesita la URL de Supabase, la clave publicable y el ID del cliente Web (los pasos de la app están en su repositorio,
   `docs/REGISTRO_GOOGLE.md`).
4. Para que el dueño maneje las licencias desde su teléfono: pestaña Licencias → «Vincular mi teléfono» y escribir el código en la app
   (Ajustes > Cuenta y licencia > Soy el dueño).
