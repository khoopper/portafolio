import type { Metadata } from "next";
import Link from "next/link";
import { CaritoLegal } from "@/components/carito/CaritoLegal";
import { getProfile, getSettings } from "@/lib/data";

export const metadata: Metadata = {
  title: { absolute: "Privacidad · Carito Music" },
  description: "Qué datos usa Carito Music, para qué, con quién se comparten y cómo pedir que se borren.",
};

export default async function CaritoPrivacidad() {
  const [profile, settings] = await Promise.all([getProfile(), getSettings()]);
  const email = settings.contactEmail;
  const mail = <a href={`mailto:${email}`}>{email}</a>;

  return (
    <CaritoLegal title="Política de privacidad" lead="Carito Music guarda lo mínimo para que tu licencia funcione y tus playlists no se pierdan. Tu música, tu historial y tus búsquedas se quedan en tu equipo.">
      <h2>1. En pocas palabras</h2>
      <ul>
        <li>Carito no tiene publicidad, no usa analítica ni rastreadores, no pide tu ubicación y no vende ni comparte tus datos con fines comerciales.</li>
        <li>El servidor de licencias guarda tu licencia, los equipos donde la usas y una copia de tus playlists y favoritas.</li>
        <li>Para buscar y reproducir música, tu equipo se conecta directamente con servicios de terceros (sección 4).</li>
        <li>Puedes pedir una copia de tus datos o que se borren escribiendo a {mail}.</li>
      </ul>

      <h2>2. Quién es responsable</h2>
      <p>
        {profile.name} (KHOOPPER), persona natural con domicilio en {profile.location}, creador de Carito Music y titular de khoopper.com. Para todo lo
        relacionado con tus datos: {mail}.
      </p>

      <h2>3. Qué datos usa Carito y para qué</h2>
      <table>
        <thead>
          <tr>
            <th>Datos</th>
            <th>Para qué</th>
            <th>Base</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>Tu licencia: su código, el nombre a quien se emitió, sus fechas (inicio, prueba, vencimiento) y si está activa</td>
            <td>Abrir Carito y comprobar la licencia (al abrirla y cada cierto tiempo)</td>
            <td>Cumplir la licencia que contrataste</td>
          </tr>
          <tr>
            <td>Tu equipo: un código calculado a partir del identificador de tu teléfono o tu PC, su modelo, la versión de Carito y la fecha de cada comprobación</td>
            <td>Que una licencia abra un teléfono y una PC, y evitar que se use en más equipos de los contratados</td>
            <td>Cumplir la licencia e interés legítimo en evitar abusos</td>
          </tr>
          <tr>
            <td>La copia de tu biblioteca: tus playlists, favoritas y algunos ajustes</td>
            <td>Que vuelvan si cambias de teléfono, y que lleguen a tu PC</td>
            <td>Cumplir la licencia</td>
          </tr>
          <tr>
            <td>Plan familiar: el nombre y la foto de perfil (pequeña, 160 px) de cada persona</td>
            <td>Mostrar quién está en la familia a quien paga y a sus miembros</td>
            <td>Tu consentimiento al unirte; se borran cuando sales de la familia</td>
          </tr>
          <tr>
            <td>Si escribes para pedir una licencia o soporte: tu nombre, tu forma de contacto y tu mensaje</td>
            <td>Responderte y emitir tu licencia</td>
            <td>Tu solicitud</td>
          </tr>
        </tbody>
      </table>
      <p className="!mt-5">
        Se quedan solo en tu equipo: tu música, lo que descargas, tu historial, tus búsquedas, tus estadísticas y tus ajustes de sonido. Carito no los envía
        a ningún servidor, salvo lo que entra en la copia de tu biblioteca.
      </p>

      <h2>4. Servicios de terceros</h2>
      <p>
        Para buscar, reproducir y mostrar música, tu equipo se conecta directamente con estos servicios. Cada uno recibe tu dirección IP y lo que pides
        (por ejemplo, el nombre de una canción) y lo trata según su propia política de privacidad:
      </p>
      <ul>
        <li><strong>YouTube y YouTube Music</strong> (Google): búsquedas, radio y reproducción en línea.</li>
        <li><strong>LRCLIB</strong> y <strong>lyrics.ovh</strong>: letras de canciones. <strong>Google Translate</strong>: solo cuando pides traducir una letra.</li>
        <li><strong>Apple (iTunes y Apple Music)</strong>, <strong>Deezer</strong>, <strong>MusicBrainz</strong> y <strong>Cover Art Archive</strong>: carátulas, carátulas animadas, datos de las canciones y listas de éxitos.</li>
        <li><strong>Spotify</strong>: solo si decides importar tus playlists; inicias sesión en la página de Spotify y Carito nunca ve tu contraseña.</li>
        <li><strong>GitHub</strong>: de ahí se bajan Carito y sus actualizaciones.</li>
        <li><strong>Supabase</strong>: aloja el servidor de licencias y las copias de tu biblioteca. Sus servidores pueden estar fuera de tu país.</li>
      </ul>

      <h2>5. Permisos en Android</h2>
      <ul>
        <li><strong>Internet</strong>: música en línea, licencia y actualizaciones.</li>
        <li><strong>Música y audio</strong>: leer las canciones de tu teléfono y guardar tus descargas en la carpeta que elijas.</li>
        <li><strong>Notificaciones y servicio en primer plano</strong>: el reproductor y las descargas siguen funcionando con la pantalla apagada.</li>
        <li><strong>Ajustes de audio</strong>: el ecualizador y el laboratorio de audio.</li>
        <li><strong>Mostrar sobre otras apps</strong>: el reproductor de la pantalla de bloqueo y algunos avisos.</li>
        <li><strong>Instalar apps</strong>: instalar las actualizaciones de Carito cuando tú lo aceptas.</li>
      </ul>
      <p>Carito no pide acceso a tus contactos, tu cámara, tu micrófono ni tu ubicación. El Top 50 de tu país usa la región configurada en tu equipo.</p>

      <h2>6. Cuánto tiempo se guardan</h2>
      <p>
        Mientras tu licencia exista. Si pides que se borre, se eliminan tu licencia, tus equipos y tus copias, salvo lo que una ley obligue a conservar.
        Los equipos que dejas de usar se pueden soltar desde Carito, y la foto de un miembro de la familia se borra en cuanto sale de ella.
      </p>

      <h2>7. Seguridad</h2>
      <p>
        Las conexiones van cifradas (HTTPS). Los accesos de cada equipo se guardan como resumen criptográfico (hash), no en claro, y la base de datos solo
        responde a funciones que comprueban la licencia de quien llama. Ningún sistema es infalible: si detecto un problema que afecte tus datos, te lo
        diré.
      </p>

      <h2>8. Tus derechos</h2>
      <p>
        Puedes pedir acceso a tus datos, corregirlos, borrarlos, oponerte a un uso o recibir una copia (Carito también exporta tu biblioteca en un archivo
        desde la app). Escribe a {mail}; respondo en un máximo de 30 días. Si vives en la Unión Europea, también puedes reclamar ante tu autoridad de
        protección de datos.
      </p>

      <h2>9. Menores</h2>
      <p>
        Las licencias las contrata una persona adulta. Si un menor usa Carito, lo hace con el permiso y bajo la responsabilidad de su madre, padre o tutor,
        y no se le piden datos más allá del nombre y la foto opcionales del plan familiar.
      </p>

      <h2>10. Esta página web</h2>
      <p>
        khoopper.com/carito no usa cookies propias. El resto de lo que hace el sitio está en su <Link href="/legal/privacidad">política de privacidad</Link> y
        su <Link href="/legal/cookies">política de cookies</Link>.
      </p>

      <h2>11. Cambios</h2>
      <p>Si esta política cambia, la fecha de arriba se actualiza. Los cambios importantes se avisarán en las novedades de la app.</p>
    </CaritoLegal>
  );
}
