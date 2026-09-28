import type { Metadata } from "next";
import { Avatar } from "@/components/Avatar";
import { IconMail } from "@/components/icons";
import { TechIcon } from "@/components/TechIcon";
import { AeroWindow } from "@/components/win7/AeroWindow";
import { CopyButton } from "@/components/win7/CopyButton";
import { count } from "@/lib/count";
import { getProfile, getSettings } from "@/lib/data";

export const metadata: Metadata = { title: "Contacto", alternates: { canonical: "/contacto" } };

export default async function ContactoPage() {
  const [profile, settings] = await Promise.all([getProfile(), getSettings()]);
  const mailto = `mailto:${settings.contactEmail}`;
  const external = { target: "_blank", rel: "noopener noreferrer" } as const;
  const channels = 1 + [settings.whatsappUrl, settings.githubUrl, settings.linkedinUrl].filter(Boolean).length;

  return (
    <AeroWindow
      title="Contacto"
      icon={<IconMail className="size-full" />}
      address={["Correo", "Contactos", profile.name]}
      statusBar={count(channels, "medio de contacto", "medios de contacto")}
      toolbar={
        <a href={mailto} className="win-button hidden sm:inline-flex">
          Nuevo mensaje
        </a>
      }
    >
      <div className="contact-stage">
        <div className="contact-card">
          <div className="contact-card-head flex flex-wrap items-center gap-4 p-5">
            <Avatar src={profile.avatar} name={profile.name} size={96} className="shrink-0" />
            <div className="min-w-[12rem] flex-1">
              <h2 className="text-2xl text-win-heading">{profile.name}</h2>
              <p className="text-win-muted">{profile.headline}</p>
            </div>
          </div>
          <dl>
            <div className="contact-row">
              <dt className="text-win-muted">Correo</dt>
              <dd className="flex flex-wrap items-center gap-2">
                <span className="mr-auto break-all">{settings.contactEmail}</span>
                <CopyButton value={settings.contactEmail} object="correo" />
                <a href={mailto} className="win-button win-button--primary">
                  Escribir
                </a>
              </dd>
            </div>
            {settings.whatsappUrl && (
              <div className="contact-row">
                <dt className="text-win-muted">WhatsApp</dt>
                <dd>
                  <a href={settings.whatsappUrl} className="win-link inline-flex items-center gap-2" {...external}>
                    <TechIcon slug="whatsapp" name="WhatsApp" className="size-4" />
                    Abrir chat de WhatsApp
                  </a>
                </dd>
              </div>
            )}
            {settings.githubUrl && (
              <div className="contact-row">
                <dt className="text-win-muted">GitHub</dt>
                <dd>
                  <a href={settings.githubUrl} className="win-link inline-flex items-center gap-2" {...external}>
                    <TechIcon slug="github" name="GitHub" className="size-4" />
                    {settings.githubUrl.replace("https://", "")}
                  </a>
                </dd>
              </div>
            )}
            {settings.linkedinUrl && (
              <div className="contact-row">
                <dt className="text-win-muted">LinkedIn</dt>
                <dd>
                  <a href={settings.linkedinUrl} className="win-link" {...external}>
                    {settings.linkedinUrl.replace("https://", "")}
                  </a>
                </dd>
              </div>
            )}
          </dl>
        </div>
      </div>
    </AeroWindow>
  );
}
