import type { Metadata } from "next";
import Link from "next/link";
import { Avatar } from "@/components/Avatar";
import { IconFolder, IconUser } from "@/components/icons";
import { AeroWindow } from "@/components/win7/AeroWindow";
import { ProgressBar } from "@/components/win7/ProgressBar";
import { Tabs } from "@/components/win7/Tabs";
import { count } from "@/lib/count";
import { getProfile, getSettings } from "@/lib/data";

export const metadata: Metadata = { title: "Sobre mí", alternates: { canonical: "/sobre-mi" } };

export default async function SobreMiPage() {
  const [profile, settings] = await Promise.all([getProfile(), getSettings()]);

  const general = (
    <div className="flex flex-col gap-5 sm:flex-row">
      <Avatar src={profile.avatar} name={profile.name} size={140} className="shrink-0" />
      <div className="min-w-0 flex-1 space-y-4">
        <div>
          <h2 className="text-xl">{profile.name}</h2>
          <p className="text-win-muted">
            {profile.headline} · {profile.location}
          </p>
        </div>
        <fieldset className="win-groupbox">
          <legend>Descripción</legend>
          <div className="space-y-3">
            {profile.bio.map((paragraph) => (
              <p key={paragraph}>{paragraph}</p>
            ))}
          </div>
        </fieldset>
        <fieldset className="win-groupbox">
          <legend>Sistema</legend>
          <dl className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-1 text-sm">
            <dt className="text-win-muted">Especialidad:</dt>
            <dd>{profile.specialty}</dd>
            <dt className="text-win-muted">Estado:</dt>
            <dd>{settings.availableForWork ? "Disponible" : "No disponible por ahora"}</dd>
            <dt className="text-win-muted">Contacto:</dt>
            <dd>
              {settings.contactEmail}
            </dd>
          </dl>
        </fieldset>
      </div>
    </div>
  );

  const experience = (
    <ul className="space-y-4">
      {profile.experience.map((e) => (
        <li key={e.title} className="flex gap-3">
          <IconFolder className="size-8 shrink-0" />
          <div>
            <p className="font-semibold">{e.title}</p>
            <p className="text-sm text-win-muted">
              {e.role} · {e.period}
            </p>
            <p className="mt-1">{e.summary}</p>
          </div>
        </li>
      ))}
    </ul>
  );

  const education = (
    <div className="space-y-4">
      {profile.education.map((ed) => (
        <fieldset key={ed.institution} className="win-groupbox">
          <legend>Educación</legend>
          <p className="font-semibold">{ed.institution}</p>
          <p>{ed.degree}</p>
          <p className="text-sm text-win-muted">
            {ed.period} · {ed.detail}
          </p>
        </fieldset>
      ))}
      <fieldset className="win-groupbox">
        <legend>Certificaciones</legend>
        <ul className="space-y-2">
          {profile.certifications.map((c) => (
            <li key={c.name}>
              <p>{c.name}</p>
              <p className="text-sm text-win-muted">
                {c.issuer} · {c.date}
              </p>
            </li>
          ))}
        </ul>
      </fieldset>
    </div>
  );

  const languages = (
    <ul className="max-w-md space-y-4">
      {profile.languages.map((l) => (
        <li key={l.name}>
          <div className="mb-1 flex justify-between text-sm">
            <span className="font-semibold">{l.name}</span>
            <span className="text-win-muted">{l.level}</span>
          </div>
          <ProgressBar value={l.percent} label={`Nivel de ${l.name}`} />
        </li>
      ))}
    </ul>
  );

  return (
    <AeroWindow
      title="Propiedades del sistema"
      icon={<IconUser className="size-full" />}
      address={["Panel de control", "Sistema", "Sobre mí"]}
      statusBar={`${count(profile.experience.length, "experiencia", "experiencias")} · ${count(profile.certifications.length, "certificación", "certificaciones")}`}
    >
      <div className="p-5">
        <Tabs
          label="Secciones de Sobre mí"
          tabs={[
            { id: "general", label: "General", content: general },
            { id: "experiencia", label: "Experiencia", content: experience },
            { id: "educacion", label: "Educación y certificaciones", content: education },
            { id: "idiomas", label: "Idiomas", content: languages },
          ]}
        />
        <div className="mt-4 flex justify-end gap-2">
          <Link href="/proyectos" className="win-button win-button--primary">
            Ver proyectos
          </Link>
          <Link href="/contacto" className="win-button">
            Contacto
          </Link>
        </div>
      </div>
    </AeroWindow>
  );
}
