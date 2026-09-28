export type TechCategory = "lenguajes" | "frontend" | "backend" | "bases-datos" | "herramientas";

export const TECH_CATEGORIES: { key: TechCategory; label: string }[] = [
  { key: "lenguajes", label: "Lenguajes" },
  { key: "frontend", label: "Frontend" },
  { key: "backend", label: "Backend" },
  { key: "bases-datos", label: "Bases de datos" },
  { key: "herramientas", label: "Herramientas" },
];

export interface Technology {
  slug: string;
  name: string;
  category: TechCategory;
  /** Key in TECH_ICONS (src/lib/tech-icons.ts); null renders a generic icon. */
  iconSlug: string | null;
}

export interface Project {
  slug: string;
  title: string;
  tagline: string;
  description: string;
  role: string;
  year: number;
  status: "draft" | "published";
  featured: boolean;
  demoUrl: string | null;
  repoUrl: string | null;
  videoUrl: string | null;
  /** Path under /public or https URL; null renders a generated cover. */
  cover: string | null;
  /** URLs o rutas de imágenes de galería del proyecto */
  images?: string[];
  highlights: string[];
  /** Technology slugs. */
  tech: string[];
}

export interface ExperienceEntry {
  title: string;
  role: string;
  period: string;
  summary: string;
}

export interface EducationEntry {
  institution: string;
  degree: string;
  period: string;
  detail: string;
}

export interface Certification {
  name: string;
  issuer: string;
  date: string;
}

export interface Language {
  name: string;
  level: string;
  percent: number;
}

export interface Profile {
  name: string;
  headline: string;
  specialty: string;
  shortBio: string;
  bio: string[];
  location: string;
  /** Path under /public or https URL; null renders the monogram avatar. */
  avatar: string | null;
  /** Path under /public or https URL. */
  cvUrl: string | null;
  experience: ExperienceEntry[];
  education: EducationEntry[];
  certifications: Certification[];
  languages: Language[];
}

export interface SiteSettings {
  availableForWork: boolean;
  contactEmail: string;
  phone: string | null;
  whatsappUrl: string | null;
  linkedinUrl: string | null;
  githubUrl: string | null;
  seoTitle: string;
  seoDescription: string;
  /** Google Analytics 4 measurement ID ("G-XXXXXXXXXX"); analytics loads only with the visitor's consent. */
  gaMeasurementId: string | null;
  /** Token of the Google Search Console HTML-tag verification. */
  googleSiteVerification: string | null;
}
