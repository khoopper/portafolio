import type { Metadata, Viewport } from "next";
import { CaritoLanding, type CaritoDownload } from "@/components/carito/CaritoLanding";
import { ALL_RELEASES, formatSize, getCaritoReleases, type CaritoRelease } from "@/lib/carito/releases";

// The download buttons follow the published versions: read again at most once an hour.
export const revalidate = 3600;

const title = "Carito Music · Descárgala para Android y PC";
const description =
  "Tu música en línea con el sonido de Carito: cinco temas completos, laboratorio de audio, Automix DJ y letras sincronizadas. Descárgala para Android y para Windows.";

export const metadata: Metadata = {
  title: { absolute: title },
  description,
  alternates: { canonical: "/carito" },
  icons: { icon: "/carito/icono-192.webp", apple: "/carito/icono-512.png" },
  openGraph: {
    type: "website",
    url: "/carito",
    title,
    description,
    images: [{ url: "/carito/compartir.png", width: 1200, height: 630, alt: "Carito Music en un teléfono y en una PC" }],
  },
  twitter: { card: "summary_large_image", title, description, images: ["/carito/compartir.png"] },
};

export const viewport: Viewport = { themeColor: "#170734" };

function forPage(release: CaritoRelease | null): CaritoDownload | null {
  return release && { version: release.version, url: release.url, fileName: release.fileName, size: formatSize(release.sizeBytes), notes: release.notes };
}

/** khoopper.com/carito: where the QR code leads. Carito Music for Android and for Windows, its screenshots, and how to install it. */
export default async function CaritoPage() {
  const { android, pc } = await getCaritoReleases();
  return <CaritoLanding android={forPage(android)} pc={forPage(pc)} allReleases={ALL_RELEASES} />;
}
