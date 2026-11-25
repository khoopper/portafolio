import type { Metadata } from "next";
import Link from "next/link";
import { CaritoLegal } from "@/components/carito/CaritoLegal";
import { getSettings } from "@/lib/data";

export const metadata: Metadata = {
  title: { absolute: "Derechos de autor y marcas · Carito Music" },
  description: "Cómo avisar de una posible infracción de derechos de autor y qué marcas se mencionan en Carito Music.",
};

export default async function CaritoDerechos() {
  const settings = await getSettings();
  const email = settings.contactEmail;
  const mail = <a href={`mailto:${email}`}>{email}</a>;

  return (
    <CaritoLegal
      title="Derechos de autor y marcas"
      lead="Carito Music respeta los derechos de autor y las marcas de otros. Si crees que algo en Carito o en esta página los afecta, avísame y lo reviso de inmediato."
    >
      <h2>1. Carito no aloja música</h2>
      <p>
        Carito es un reproductor: no guarda, vende ni distribuye canciones, videos ni letras en sus servidores. La música en línea viene de servicios de
        terceros y la música sin conexión la guarda cada persona en su propio equipo, bajo su responsabilidad (ver los{" "}
        <Link href="/carito/terminos">términos de uso</Link>).
      </p>

      <h2>2. Cómo avisar de una infracción</h2>
      <p>Si eres titular de derechos (o actúas en su nombre), escribe a {mail} con:</p>
      <ul>
        <li>La obra protegida que crees afectada.</li>
        <li>Dónde está el material (la dirección exacta o una descripción de dónde aparece en Carito o en esta página).</li>
        <li>Tu nombre, tu forma de contacto y, si actúas por otra persona, en nombre de quién.</li>
        <li>Una declaración de buena fe de que ese uso no está autorizado por el titular ni por la ley.</li>
        <li>Una declaración de que la información es exacta y de que eres el titular o estás autorizado a actuar por él, con tu firma (puede ser electrónica).</li>
      </ul>
      <p>
        Respondo en un plazo de 5 días hábiles. Si el aviso es fundado, retiro o desactivo el material, y puedo revocar la licencia de quien infrinja derechos
        de forma reiterada. Quien crea que su material se retiró por error puede responder con su explicación al mismo correo.
      </p>

      <h2>3. Capturas de pantalla</h2>
      <p>
        Las capturas de esta página muestran la app en uso. Las carátulas, los nombres de canciones y de artistas que aparecen en ellas pertenecen a sus
        dueños y se muestran solo para enseñar cómo se ve Carito. Si eres titular de alguno y prefieres que no aparezca, lo reemplazo.
      </p>

      <h2>4. Marcas</h2>
      <p>
        YouTube y YouTube Music son marcas de Google LLC. Spotify es una marca de Spotify AB. Apple Music e iTunes son marcas de Apple Inc. Android es una
        marca de Google LLC. Windows y Microsoft Store son marcas de Microsoft Corporation. Deezer es una marca de Deezer S.A.
      </p>
      <p>
        Carito Music <strong>no está afiliada, patrocinada ni respaldada</strong> por ninguna de esas empresas. Se nombran solo para describir con qué
        funciona Carito. Los temas «estilo Apple Music» y «estilo Spotify» son diseños propios de Carito inspirados en la estética de esas apps; no usan
        sus logotipos.
      </p>
      <p>Carito Music, KHOOPPER, su logo y sus temas son de KHOOPPER.</p>
    </CaritoLegal>
  );
}
