import type { Metadata } from "next";
import Link from "next/link";
import { CaritoLegal } from "@/components/carito/CaritoLegal";
import { getProfile, getSettings } from "@/lib/data";

export const metadata: Metadata = {
  title: { absolute: "Términos de uso · Carito Music" },
  description: "Las condiciones de la licencia de Carito Music y de su uso.",
};

export default async function CaritoTerminos() {
  const [profile, settings] = await Promise.all([getProfile(), getSettings()]);
  const email = settings.contactEmail;
  const mail = <a href={`mailto:${email}`}>{email}</a>;

  return (
    <CaritoLegal title="Términos de uso" lead="Estas son las condiciones para usar Carito Music. Al instalarla o activar una licencia, las aceptas.">
      <h2>1. Qué es Carito Music</h2>
      <p>
        Carito Music es un reproductor de música para Android y Windows creado por {profile.name} (KHOOPPER). Reproduce la música de tu equipo y contenido
        que ya está disponible públicamente en línea. <strong>Carito no aloja, vende ni distribuye música</strong>, y no tiene relación con los artistas, sellos ni
        servicios cuyo contenido reproduces.
      </p>

      <h2>2. Tu licencia</h2>
      <ul>
        <li>Es personal, no exclusiva e intransferible, y te permite usar Carito en un teléfono y una PC mientras esté vigente.</li>
        <li>El plan familiar permite a quien paga invitar hasta a 2 personas, cada una con su propio perfil y sus propios equipos.</li>
        <li>La prueba gratis dura 3 días. Después, Carito pide una licencia.</li>
        <li>El precio y la forma de pago se acuerdan directamente con KHOOPPER antes de activar la licencia.</li>
        <li>No compartas ni publiques tu código de licencia: quien lo tenga podría usar tu lugar.</li>
      </ul>

      <h2>3. Uso permitido</h2>
      <p>Puedes usar Carito para escuchar música para ti y tu familia, sin fines comerciales. No está permitido:</p>
      <ul>
        <li>Revender, alquilar o sublicenciar Carito o una licencia.</li>
        <li>Modificar, descompilar o alterar la app para evitar la licencia o sus controles.</li>
        <li>Usar Carito para copiar, redistribuir, vender o difundir públicamente música u otro contenido protegido.</li>
        <li>Usar Carito en lugares públicos o comerciales (tiendas, eventos, transmisiones) sin las licencias de música que la ley exija.</li>
      </ul>

      <h2>4. Música sin conexión y servicios de terceros</h2>
      <p>
        Guarda solo música que tengas derecho a guardar: la tuya, la que tenga una licencia libre o la que su titular permita copiar. Cuando Carito se conecta
        con servicios de terceros (por ejemplo YouTube, Spotify o Apple), eres responsable de que tu uso respete sus términos y las leyes de tu país. Esos
        servicios pueden cambiar o dejar de estar disponibles en cualquier momento, y Carito no garantiza que una canción concreta pueda encontrarse o
        reproducirse.
      </p>

      <h2>5. Actualizaciones</h2>
      <p>
        Carito te avisa de cada versión nueva y se instala cuando tú lo aceptas. Las actualizaciones pueden agregar, cambiar o quitar funciones. Algunas
        versiones antiguas pueden dejar de abrir cuando una actualización sea necesaria para que la licencia siga funcionando.
      </p>

      <h2>6. Propiedad intelectual</h2>
      <p>
        La app, su nombre, su logo, sus temas y su diseño son de KHOOPPER. Las marcas de terceros pertenecen a sus dueños y se mencionan solo para describir
        compatibilidad o estilo (ver <Link href="/carito/derechos-de-autor">Derechos de autor y marcas</Link>).
      </p>

      <h2>7. Suspensión</h2>
      <p>
        KHOOPPER puede suspender o revocar una licencia si se incumplen estos términos, si se usa para infringir derechos de autor o si recibe un aviso
        fundado de infracción. Puedes dejar de usar Carito cuando quieras.
      </p>

      <h2>8. Garantía y responsabilidad</h2>
      <p>
        Carito se ofrece tal como está, con el cuidado razonable de mantenerla funcionando, pero sin garantizar que esté libre de errores o que funcione
        sin interrupciones. En la medida que la ley lo permita, la responsabilidad de KHOOPPER se limita a lo que pagaste por tu licencia en los últimos 12
        meses. Nada de esto limita los derechos que te da la ley de protección al consumidor de tu país.
      </p>

      <h2>9. Ley aplicable</h2>
      <p>
        Estos términos se rigen por las leyes de El Salvador. Antes de cualquier reclamo, escríbeme: la mayoría de los problemas se resuelven en una
        conversación.
      </p>

      <h2>10. Contacto</h2>
      <p>Dudas sobre estos términos o tu licencia: {mail}.</p>
    </CaritoLegal>
  );
}
