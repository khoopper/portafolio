import type { Metadata } from "next";
import Link from "next/link";
import { LegalWindow } from "@/components/legal/LegalWindow";
import { getProfile, getSettings } from "@/lib/data";

export const metadata: Metadata = {
  alternates: { canonical: "/legal/privacidad" },
  title: "Política de privacidad",
  description: "Qué datos trata khoopper.com, para qué, con quién se comparten y cómo ejercer tus derechos (GDPR, CCPA/CPRA y ley salvadoreña).",
};

export default async function PrivacidadPage() {
  const [profile, settings] = await Promise.all([getProfile(), getSettings()]);
  const email = settings.contactEmail;
  const mail = <a href={`mailto:${email}`}>{email}</a>;

  return (
    <LegalWindow current="privacidad" title="Política de privacidad">
      <p className="mt-4">
        Esta política explica qué datos personales trata <strong>khoopper.com</strong>, para qué, con quién se comparten y qué derechos tienes. Está
        escrita para cumplir el Reglamento General de Protección de Datos de la Unión Europea (RGPD/GDPR), la ley de California (CCPA/CPRA), la ley de
        protección de datos personales de El Salvador y la ley estadounidense de protección de menores en línea (COPPA).
      </p>

      <h2>1. Resumen en cinco líneas</h2>
      <ul>
        <li>No hay publicidad ni perfiles de comportamiento. Cuento visitas de forma anónima, sin cookies y sin guardar tu IP. Google Analytics solo se activa si tú lo aceptas.</li>
        <li>No vendo tus datos ni los comparto con fines publicitarios.</li>
        <li>Solo se guardan datos personales si me escribes o si dejas una recomendación por invitación.</li>
        <li>Los videos de YouTube o Vimeo y Google Analytics solo se cargan si tú lo permites.</li>
        <li>Puedes pedirme acceso, corrección o borrado de tus datos en {mail}.</li>
      </ul>

      <h2>2. Responsable del tratamiento</h2>
      <p>
        {profile.name}, persona natural con domicilio en {profile.location}, titular del sitio <strong>khoopper.com</strong>. Correo de contacto para todo
        lo relacionado con privacidad: {mail}.
      </p>

      <h2>3. Qué datos trato, para qué y con qué base legal</h2>
      <table className="legal-table">
        <thead>
          <tr>
            <th>Situación</th>
            <th>Datos</th>
            <th>Finalidad</th>
            <th>Base legal</th>
            <th>Conservación</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>Visitas al sitio</td>
            <td>Dirección IP, navegador, página solicitada, fecha y hora (registros técnicos del servidor de alojamiento)</td>
            <td>Entregar el sitio, detectar abusos y mantener su seguridad</td>
            <td>Interés legítimo (RGPD art. 6.1.f)</td>
            <td>El plazo breve de los registros operativos del proveedor de alojamiento</td>
          </tr>
          <tr>
            <td>Estadísticas de visitas</td>
            <td>Página visitada, país aproximado (lo informa el alojamiento), tipo de dispositivo y un identificador anónimo que cambia cada día y no permite volver a tu IP</td>
            <td>Saber cuántas personas visitan el sitio y qué secciones interesan; contar descargas del CV y clics a demos, repositorios y contacto</td>
            <td>Interés legítimo (art. 6.1.f); puedes oponerte activando «No rastrear» o el Control Global de Privacidad en tu navegador</td>
            <td>180 días, después se borran</td>
          </tr>
          <tr>
            <td>Google Analytics (opcional)</td>
            <td>Páginas vistas, tiempo en el sitio, origen de la visita, tipo de dispositivo y navegador, ubicación aproximada y un identificador en una cookie de Google. Google no registra tu IP completa</td>
            <td>Entender cómo se usa el portafolio y en qué momento los visitantes lo abandonan, para mejorarlo</td>
            <td>Tu consentimiento en la configuración de privacidad (art. 6.1.a)</td>
            <td>Según la configuración de Google Analytics del titular (hasta 14 meses)</td>
          </tr>
          <tr>
            <td>Preferencias en tu navegador</td>
            <td>Tu elección de privacidad y que ya entraste al sitio (no incluyen datos que te identifiquen)</td>
            <td>Recordar tus ajustes</td>
            <td>Necesario para el servicio que pides (ver <Link href="/legal/cookies">Cookies</Link>)</td>
            <td>Hasta 12 meses o hasta que borres los datos del navegador</td>
          </tr>
          <tr>
            <td>Contacto por correo o WhatsApp</td>
            <td>Tu nombre, correo o teléfono y lo que escribas</td>
            <td>Responder tu mensaje</td>
            <td>Tu solicitud / consentimiento (art. 6.1.a y 6.1.b)</td>
            <td>Lo necesario para atenderte y, como máximo, 2 años tras el último mensaje</td>
          </tr>
          <tr>
            <td>Recomendación por invitación</td>
            <td>Nombre, foto y correo de tu cuenta de Google o LinkedIn; identificador de esa cuenta; cargo, empresa y texto de la recomendación</td>
            <td>Verificar que eres quien firma y publicar tu recomendación en el proyecto</td>
            <td>Tu consentimiento, que das marcando la casilla antes de iniciar sesión (art. 6.1.a)</td>
            <td>Hasta que pidas retirarla. Los datos de la invitación caducan si no se usa</td>
          </tr>
          <tr>
            <td>Videos incrustados</td>
            <td>Tu IP y datos de navegador, que recibe YouTube (Google) o Vimeo</td>
            <td>Reproducir la demostración de un proyecto</td>
            <td>Tu consentimiento en la configuración de privacidad (art. 6.1.a)</td>
            <td>Lo define cada proveedor (ver sus políticas)</td>
          </tr>
        </tbody>
      </table>
      <p>
        En la recomendación se publican tu nombre, tu foto, tu cargo, tu empresa, el <em>dominio</em> de tu correo (por ejemplo, «empresa.com») y el
        texto. Tu dirección de correo completa <strong>nunca</strong> se publica. Antes de aparecer, {profile.name} revisa cada recomendación.
      </p>
      <p>
        No estás obligado a darme ningún dato. Si no lo haces, solo dejaré de poder responderte o de publicar tu recomendación. No tomo decisiones
        automatizadas ni elaboro perfiles sobre ti.
      </p>

      <h2>4. Con quién se comparten los datos</h2>
      <p>Uso proveedores que tratan datos por mi cuenta (encargados del tratamiento) y otros que actúan por su cuenta cuando tú interactúas con ellos:</p>
      <ul>
        <li>
          <strong>Vercel Inc.</strong> (EE. UU.): alojamiento del sitio y sus registros técnicos.
        </li>
        <li>
          <strong>Supabase Inc.</strong>: base de datos, autenticación y almacenamiento de archivos (recomendaciones y contenido del sitio).
        </li>
        <li>
          <strong>Google LLC</strong> y <strong>LinkedIn Corp.</strong>: solo si eliges iniciar sesión con ellos para recomendar. Google es además dueño de
          YouTube y de <strong>Google Analytics</strong>, que solo se activa si aceptas las estadísticas; en ese caso Google actúa como proveedor de
          medición y puede tratar los datos para sus propios fines según su política.
        </li>
        <li>
          <strong>Vimeo Inc.</strong>: solo si abres un video alojado allí y lo permites.
        </li>
        <li>
          <strong>Cloudflare Inc.</strong>: su verificación anti-bot (Turnstile) solo aparece en el acceso del administrador, no a los visitantes.
        </li>
        <li>
          <strong>GitHub Inc.</strong>: el servidor consulta los README de repositorios públicos. No se envía ningún dato tuyo.
        </li>
        <li>
          <strong>Meta (WhatsApp)</strong>: solo si me escribes por ese medio; aplican sus propias condiciones.
        </li>
      </ul>
      <p>No vendo datos personales ni los «comparto» con terceros para publicidad dirigida, en el sentido de la ley de California.</p>

      <h2>5. Transferencias internacionales</h2>
      <p>
        Los proveedores anteriores operan total o parcialmente en Estados Unidos y otros países fuera del Espacio Económico Europeo y de El Salvador.
        Estas transferencias se apoyan en las garantías que ofrece cada proveedor (por ejemplo, cláusulas contractuales tipo de la Comisión Europea o
        certificación en el Marco de Privacidad de Datos UE-EE. UU.). Puedes pedirme más información escribiendo a {mail}.
      </p>

      <h2>6. Tus derechos</h2>
      <p>Puedes ejercer estos derechos gratis, en cualquier momento, escribiendo a {mail}. Respondo en un máximo de 30 días.</p>
      <ul>
        <li>
          <strong>Acceso, rectificación y supresión</strong>: saber qué datos tengo de ti, corregirlos o borrarlos.
        </li>
        <li>
          <strong>Oposición, limitación y portabilidad</strong>: oponerte a un tratamiento, pedir que lo pause o recibir tus datos en un formato común.
        </li>
        <li>
          <strong>Retirar el consentimiento</strong>: cuando quieras, sin efecto retroactivo. Los videos se desactivan desde la{" "}
          <em>Configuración de privacidad</em> (icono del escudo, junto al reloj).
        </li>
        <li>
          <strong>Reclamar ante una autoridad</strong>: si resides en la UE, ante la autoridad de protección de datos de tu país; si estás en El Salvador,
          ante la autoridad competente que designe la ley salvadoreña.
        </li>
      </ul>
      <h3>Residentes de California (CCPA/CPRA)</h3>
      <p>
        Tienes derecho a saber qué datos personales recopilo, a pedir que los corrija o elimine y a no ser discriminado por ejercer tus derechos. No
        vendo ni comparto tus datos personales, por lo que no hay nada que excluir. Al no rastrearte, el sitio respeta por diseño las señales de «No
        rastrear» y de Control Global de Privacidad (GPC).
      </p>

      <h2>7. Menores de edad</h2>
      <p>
        Este sitio es profesional y no está dirigido a menores de 16 años (ni a menores de 13, según COPPA). No recopilo datos de menores a sabiendas. Si
        crees que un menor me envió datos, escríbeme a {mail} y los eliminaré.
      </p>

      <h2>8. Seguridad</h2>
      <p>
        Aplico medidas técnicas razonables: conexión cifrada (HTTPS con HSTS), cabeceras de seguridad, control de acceso por fila en la base de datos,
        validación de datos en el servidor y verificación en dos pasos para administrar el sitio. Ningún sistema es infalible: si ocurriera una brecha
        que te afecte, te lo notificaré y avisaré a la autoridad cuando la ley lo exija.
      </p>

      <h2>9. Estadísticas de visitas</h2>
      <p>
        <strong>Sistema propio (siempre activo).</strong> Mido las visitas con un sistema propio. No usa cookies ni guarda nada en tu navegador, y <strong>no almacena tu
        dirección IP</strong>: solo se conserva un identificador anónimo calculado con tu IP y tu navegador junto con una clave secreta que cambia cada
        día, por lo que sirve para contar visitantes distintos en un mismo día pero no para seguirte entre días ni para averiguar quién eres. Si tu
        navegador envía «No rastrear» (DNT) o el Control Global de Privacidad (GPC), no se registra nada. Los datos se ven solo en el panel de
        administración y se borran a los 180 días.
      </p>
      <p>
        <strong>Google Analytics (solo con tu permiso).</strong> Si aceptas «Estadísticas» en la configuración de privacidad, se carga Google Analytics 4,
        que guarda cookies (<code>_ga</code>, <code>_ga_…</code>) para medir el uso del sitio. Si lo rechazas o retiras el permiso, no se descarga nada de
        Google y sus cookies se eliminan. Tampoco se activa si tu navegador envía «No rastrear». Los datos se ven en el panel de Google Analytics del titular.
      </p>

      <h2>10. Cambios en esta política</h2>
      <p>
        Puedo actualizar este texto. La fecha de arriba indica la última versión. Si el cambio afecta a lo que consientes, volverás a ver la configuración
        de privacidad para decidir de nuevo.
      </p>
    </LegalWindow>
  );
}
