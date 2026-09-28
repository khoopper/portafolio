import type { Metadata } from "next";
import Link from "next/link";
import { LegalWindow } from "@/components/legal/LegalWindow";
import { OpenPrivacyButton } from "@/components/privacy/OpenPrivacyButton";

export const metadata: Metadata = {
  alternates: { canonical: "/legal/cookies" },
  title: "Cookies y almacenamiento",
  description: "Qué guarda khoopper.com en tu navegador, para qué y cuánto tiempo. No hay cookies de publicidad ni de seguimiento.",
};

export default function CookiesPage() {
  return (
    <LegalWindow current="cookies" title="Cookies y almacenamiento">
      <p className="mt-4">
        Las cookies y el almacenamiento local son pequeños datos que un sitio guarda en tu navegador. Este sitio <strong>no usa cookies de publicidad ni
        de seguimiento</strong>. Solo guarda lo imprescindible para funcionar y, únicamente si tú lo permites, deja que YouTube o Vimeo carguen sus
        videos y activa las estadísticas de Google Analytics.
      </p>

      <h2>Lo que se guarda</h2>
      <table className="legal-table">
        <thead>
          <tr>
            <th>Nombre</th>
            <th>Tipo</th>
            <th>Para qué sirve</th>
            <th>Duración</th>
            <th>Categoría</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>
              <code>portfolio:consent</code>
            </td>
            <td>Almacenamiento local (propio)</td>
            <td>Recordar tu elección de privacidad</td>
            <td>12 meses</td>
            <td>Necesaria</td>
          </tr>
          <tr>
            <td>
              <code>portfolio:entered</code>
            </td>
            <td>Almacenamiento local (propio)</td>
            <td>Recordar que ya pasaste la pantalla de inicio, para llevarte directo al escritorio</td>
            <td>Hasta que pulses «Apagar» o borres los datos del navegador</td>
            <td>Necesaria</td>
          </tr>
          <tr>
            <td>
              <code>portfolio:desktop-empty</code>
            </td>
            <td>Almacenamiento de sesión (propio)</td>
            <td>Recordar que cerraste las ventanas mientras navegas</td>
            <td>Hasta cerrar la pestaña</td>
            <td>Necesaria</td>
          </tr>
          <tr>
            <td>
              <code>sb-…-auth-token</code> y <code>sb-…-code-verifier</code>
            </td>
            <td>Cookie (Supabase, HttpOnly)</td>
            <td>Mantener tu sesión al iniciar sesión con Google o LinkedIn para dejar una recomendación, o al administrar el sitio</td>
            <td>Sesión, máximo 12 horas</td>
            <td>Necesaria</td>
          </tr>
          <tr>
            <td>
              <code>cf_*</code> (Turnstile)
            </td>
            <td>Cookie de tercero (Cloudflare)</td>
            <td>Verificación anti-bot. Solo aparece en el acceso del administrador, nunca a los visitantes</td>
            <td>Según Cloudflare</td>
            <td>Necesaria</td>
          </tr>
          <tr>
            <td>
              <code>_ga</code> y <code>_ga_…</code>
            </td>
            <td>Cookie de tercero (Google Analytics)</td>
            <td>Medir cómo se usa el sitio: páginas, tiempo y origen de la visita. No se usan para publicidad</td>
            <td>Hasta 2 años (renovable)</td>
            <td>Estadísticas (solo con tu permiso)</td>
          </tr>
          <tr>
            <td>YouTube (youtube-nocookie.com) y Vimeo</td>
            <td>Tercero: cookies y almacenamiento propios</td>
            <td>Reproducir un video de demostración incrustado</td>
            <td>Según cada proveedor</td>
            <td>Contenido externo (solo con tu permiso)</td>
          </tr>
        </tbody>
      </table>
      <p>
        Las categorías «necesarias» no requieren consentimiento porque sin ellas no podría ofrecerte lo que pides (entrar al sitio o iniciar sesión).
        No hay ninguna otra cookie. Las estadísticas de visitas tampoco guardan nada en tu navegador (ver la{" "}
        <Link href="/legal/privacidad">Política de privacidad</Link>).
      </p>

      <h2>Contenido externo (YouTube y Vimeo)</h2>
      <p>
        Los videos de demostración se alojan en YouTube y, a veces, en Vimeo. Hasta que los permitas, el sitio <strong>no se conecta</strong> a esos
        servicios. Puedes cargar un video una sola vez, o permitir siempre el contenido externo. Usamos la modalidad de privacidad mejorada de YouTube
        (<code>youtube-nocookie.com</code>), aunque YouTube puede seguir guardando datos en tu navegador cuando reproduces un video. Consulta la{" "}
        <a href="https://policies.google.com/privacy" target="_blank" rel="noopener noreferrer">
          política de privacidad de Google
        </a>{" "}
        y la{" "}
        <a href="https://vimeo.com/privacy" target="_blank" rel="noopener noreferrer">
          de Vimeo
        </a>
        .
      </p>

      <h2>Cambiar o retirar tu elección</h2>
      <p>
        Puedes cambiarla cuando quieras: es tan fácil retirar el permiso como darlo. Usa el botón de abajo, el icono del escudo junto al reloj o el menú
        Inicio.
      </p>
      <p>
        <OpenPrivacyButton className="win-button win-button--primary" />
      </p>
      <p>
        También puedes borrar el almacenamiento desde los ajustes de tu navegador. Si lo haces, volveré a preguntarte tu elección. Más detalles sobre el
        tratamiento de datos en la <Link href="/legal/privacidad">Política de privacidad</Link>.
      </p>
    </LegalWindow>
  );
}
