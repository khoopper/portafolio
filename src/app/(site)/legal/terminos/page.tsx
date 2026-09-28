import type { Metadata } from "next";
import Link from "next/link";
import { LegalWindow } from "@/components/legal/LegalWindow";
import { getProfile, getSettings } from "@/lib/data";

export const metadata: Metadata = {
  alternates: { canonical: "/legal/terminos" },
  title: "Términos de uso",
  description: "Condiciones de uso de khoopper.com: propiedad intelectual, proyectos de demostración, recomendaciones y limitación de responsabilidad.",
};

export default async function TerminosPage() {
  const [profile, settings] = await Promise.all([getProfile(), getSettings()]);
  const mail = <a href={`mailto:${settings.contactEmail}`}>{settings.contactEmail}</a>;

  return (
    <LegalWindow current="terminos" title="Términos de uso">
      <p className="mt-4">
        Al usar <strong>khoopper.com</strong> aceptas estas condiciones. Si no estás de acuerdo, por favor no uses el sitio.
      </p>

      <h2>1. Qué es este sitio</h2>
      <p>
        Es el portafolio profesional de {profile.name}. Sirve para mostrar proyectos, tecnologías y experiencia. No vende productos ni servicios en
        línea, y nada en él es una oferta contractual: cualquier trabajo se acuerda por separado y por escrito.
      </p>

      <h2>2. Propiedad intelectual</h2>
      <ul>
        <li>El código, el diseño, los textos y las imágenes propias del sitio son de {profile.name}, salvo que se indique otra cosa. Todos los derechos reservados.</li>
        <li>
          La estética del sitio es un homenaje visual a Windows 7. <strong>No está afiliado, patrocinado ni respaldado por Microsoft.</strong> Windows y los
          nombres de productos de terceros son marcas de sus respectivos dueños.
        </li>
        <li>Las tecnologías, logotipos y marcas de terceros que aparecen (Next.js, Supabase, Vercel, etc.) pertenecen a sus titulares y se mencionan solo para identificarlos.</li>
        <li>Puedes compartir enlaces al sitio. No puedes copiar, redistribuir o hacer pasar como propio el contenido sin mi permiso por escrito.</li>
      </ul>

      <h2>3. Proyectos, demostraciones y clientes</h2>
      <p>
        Algunos proyectos son de clientes reales. Cuando el cliente pide confidencialidad, la versión mostrada usa una marca ficticia, datos inventados e
        ilustraciones propias, y así se indica. Las capturas y videos son ilustrativos y pueden no reflejar el estado actual de un proyecto. Los sitios
        de demostración enlazados son de terceros o míos y se ofrecen «tal cual».
      </p>

      <h2>4. Recomendaciones de terceros</h2>
      <p>
        Las recomendaciones expresan la opinión de quien las firma. Que su identidad esté verificada mediante Google o LinkedIn solo confirma que la
        cuenta es suya; no implica que yo comparta o garantice su contenido. Reviso cada recomendación antes de publicarla y puedo ocultar las que sean
        ofensivas, falsas o ajenas al proyecto. Quien recomendó puede pedirme en cualquier momento que retire la suya (ver la{" "}
        <Link href="/legal/privacidad">Política de privacidad</Link>).
      </p>

      <h2>5. Uso aceptable</h2>
      <p>Al usar el sitio te comprometes a no:</p>
      <ul>
        <li>intentar acceder a áreas privadas, evadir controles de seguridad o sobrecargar el servicio (por ejemplo, con ataques o extracción automática masiva);</li>
        <li>usar el sitio para enviar spam, malware o contenido ilícito, o suplantar a otra persona al recomendar;</li>
        <li>usar mis datos de contacto para fines comerciales no solicitados.</li>
      </ul>
      <p>
        Si encuentras una vulnerabilidad, escríbeme a {mail} antes de divulgarla. La investigo y respondo lo antes posible, y no emprenderé acciones
        contra quien actúe de buena fe y sin dañar datos ni interrumpir el servicio.
      </p>

      <h2>6. Enlaces y contenido de terceros</h2>
      <p>
        El sitio enlaza a páginas y videos de terceros (GitHub, YouTube, sitios de demostración). No controlo su contenido ni sus políticas, y no soy
        responsable de ellos.
      </p>

      <h2>7. Sin garantías y limitación de responsabilidad</h2>
      <p>
        Hago lo posible por que la información sea correcta y el sitio esté disponible, pero se ofrece «tal cual», sin garantía de disponibilidad continua
        ni de que esté libre de errores. En la medida que la ley lo permita, no respondo por daños indirectos derivados del uso del sitio o de la
        imposibilidad de usarlo. Esto no limita derechos irrenunciables que la ley te reconozca como consumidor ni la responsabilidad que no pueda
        excluirse legalmente.
      </p>

      <h2>8. Privacidad y cookies</h2>
      <p>
        El tratamiento de datos se explica en la <Link href="/legal/privacidad">Política de privacidad</Link> y el almacenamiento en el navegador en la{" "}
        <Link href="/legal/cookies">Política de cookies</Link>.
      </p>

      <h2>9. Ley aplicable</h2>
      <p>
        Estas condiciones se rigen por las leyes de {profile.location}. Cualquier disputa se someterá a sus tribunales, sin perjuicio de los derechos
        que la ley de tu país de residencia te otorgue como consumidor.
      </p>

      <h2>10. Cambios y contacto</h2>
      <p>
        Puedo modificar estas condiciones; la fecha de arriba indica la última versión, y seguir usando el sitio después significa que las aceptas. Para
        cualquier duda: {mail}.
      </p>
    </LegalWindow>
  );
}
