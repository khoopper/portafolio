import type { Project } from "@/lib/types";

export const projects: Project[] = [
  {
    "slug": "plataforma-turismo-aventura",
    "title": "Plataforma Web para Agencia de Turismo de Aventura",
    "tagline": "Sitio público con reservas en línea y panel administrativo a medida para una agencia de turismo de aventura.",
    "description": "Plataforma web completa para una agencia de turismo de aventura (senderismo, camping y viajes guiados), en producción para un cliente real. Esta versión de portafolio usa una marca ficticia, datos inventados e ilustraciones propias para proteger la identidad del cliente.\n\nEl sitio público muestra el catálogo de salidas con filtros por categoría y botones animados en Canvas, fichas detalladas con itinerario y datos técnicos, calendario de fechas, lista de salidas guardadas y un formulario de reserva con método de pago, validación en el servidor y protección anti-spam. Incluye SEO técnico completo: metadatos por página, datos estructurados JSON-LD, sitemap dinámico e iconos que cambian con la paleta de colores.\n\nEl panel administrativo permite al equipo gestionar todo sin tocar código: tablero de estadísticas propio (visitas por día y hora, clics por salida, países y dispositivos), reservas con cambio de estado y mensaje de WhatsApp prellenado con las cuentas bancarias, edición de salidas con hasta 5 fotos, fechas y ficha técnica, portada, galería, reseñas, menú, usuarios con roles y cambio de identidad visual con un clic. Un generador en el navegador crea logos, favicons e imagen para redes a partir de un solo PNG.\n\nArquitectura: Next.js 16 (App Router, Server Components y Server Actions) con React 19 y TypeScript, Supabase (PostgreSQL, Auth y Storage) con seguridad a nivel de fila, validación con Zod, correos con Resend y despliegue en Vercel.\n\nRetos resueltos: autorización verificada en el servidor en cada acción (no solo en la interfaz), límite de solicitudes por IP y por correo directamente en PostgreSQL, cierre de sesión por inactividad que funciona incluso con la pestaña suspendida, subida de imágenes comprimidas en el navegador con URLs firmadas y un diseño pensado primero para celular, porque la mayoría del tráfico llega desde el teléfono.",
    "role": "Desarrollador Full Stack",
    "year": 2026,
    "status": "published",
    "featured": true,
    "demoUrl": null,
    "repoUrl": null,
    "videoUrl": null,
    "cover": "/images/projects/plataforma-turismo-aventura/01-portada-escritorio.webp",
    "images": [
      "/images/projects/plataforma-turismo-aventura/01-portada-escritorio.webp",
      "/images/projects/plataforma-turismo-aventura/02-catalogo-salidas.webp",
      "/images/projects/plataforma-turismo-aventura/03-ficha-de-salida.webp",
      "/images/projects/plataforma-turismo-aventura/04-formulario-de-reserva.webp",
      "/images/projects/plataforma-turismo-aventura/05-calendario.webp",
      "/images/projects/plataforma-turismo-aventura/06-panel-estadisticas.webp",
      "/images/projects/plataforma-turismo-aventura/07-panel-reservas.webp",
      "/images/projects/plataforma-turismo-aventura/08-panel-editar-salida.webp",
      "/images/projects/plataforma-turismo-aventura/09-panel-ajustes-paleta.webp",
      "/images/projects/plataforma-turismo-aventura/10-movil-portada.webp",
      "/images/projects/plataforma-turismo-aventura/11-movil-ficha.webp",
      "/images/projects/plataforma-turismo-aventura/12-movil-panel.webp"
    ],
    "highlights": [
      "Sitio público y panel administrativo a medida, en producción para un cliente real",
      "Reservas en línea con método de pago, validación y protección anti-spam",
      "Tablero de estadísticas propio sin herramientas de terceros",
      "Mensajes de WhatsApp prellenados con los datos de la reserva y las cuentas bancarias",
      "Gestión completa de salidas: fotos, fechas, precios, categorías y ficha técnica",
      "Acceso multirol: administrador y equipo de reservas",
      "Cambio de paleta de colores e identidad visual con un clic",
      "Generador de logos, favicons e imagen para redes desde un solo PNG",
      "SEO técnico: JSON-LD, sitemap dinámico y metadatos por página",
      "Seguridad: RLS en PostgreSQL, rate limiting y cierre de sesión por inactividad",
      "Diseño responsive pensado primero para celular"
    ],
    "tech": [
      "nextjs",
      "react",
      "typescript",
      "tailwindcss",
      "supabase",
      "postgresql",
      "zod",
      "vercel",
      "nodejs",
      "shadcnui"
    ]
  },
];
