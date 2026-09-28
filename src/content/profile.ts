import type { Profile } from "@/lib/types";

export const profile: Profile = {
  name: "Brandon Ramírez",
  headline: "Ingeniero en Sistemas y Computación",
  specialty: "Full Stack (Next.js / Supabase)",
  shortBio:
    "Apasionado por escribir código y transformar la lógica en experiencias interactivas modernas. Desarrollo soluciones web y móviles escalables dentro del ecosistema de JavaScript, con curiosidad constante por seguir aprendiendo.",
  bio: [
    "Ingeniero en Sistemas con enfoque Full Stack; experiencia en Next.js, React, TypeScript y Supabase. He creado SaaS con RLS y control de roles, buscando siempre soluciones escalables y centradas en la experiencia de usuario.",
    "Curioso por naturaleza. Resuelvo problemas. Construyo en la web. Tomo café.",
    "Mi enfoque se centra en crear interfaces limpias, funcionales y accesibles, utilizando tecnologías modernas pero inspirándome en la solidez y el encanto de los sistemas clásicos.",
  ],
  location: "El Salvador",
  avatar: null,
  cvUrl: "/documents/Brandon-Ramirez-CV.pdf",
  experience: [
    {
      title: "SaaS Gestión Clínica",
      role: "Desarrollador Full Stack",
      period: "2026 - Presente",
      summary: "Builder Pro: editor visual de landing pages con persistencia en tiempo real y RBAC para Super Admin y Médico.",
    },
    {
      title: "Flixxer",
      role: "Desarrollador Full Stack",
      period: "2025 - Presente",
      summary: "Panel de suscripciones de streaming con React 19, recordatorios automáticos vía WhatsApp y JWT.",
    },
    {
      title: "Invitación Digital",
      role: "Frontend / Full Stack",
      period: "2025",
      summary: "App de invitaciones con validación por código único, RLS y panel de asistentes.",
    },
  ],
  education: [
    {
      institution: "Universidad Tecnológica de El Salvador",
      degree: "Ingeniería en Sistemas y Computación",
      period: "Estudiante de 5.º año",
      detail: "GPA: 8.7",
    },
  ],
  certifications: [
    { name: "Programming with JavaScript", issuer: "Meta (Coursera)", date: "Jul 2025" },
    { name: "Formación Java Orientado a Objetos", issuer: "Oracle Next Education (Alura Latam)", date: "Jul 2023" },
    { name: "Formación Principiante en Programación G5", issuer: "Oracle Next Education (Alura Latam)", date: "May 2023" },
    { name: "Formación Business Agility G5", issuer: "Oracle Next Education (Alura Latam)", date: "Jul 2023" },
  ],
  languages: [
    { name: "Español", level: "Nativo", percent: 100 },
    { name: "Inglés", level: "Básico / En aprendizaje", percent: 30 },
  ],
};
