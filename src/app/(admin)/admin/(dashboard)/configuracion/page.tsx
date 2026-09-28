import { CVUploader } from "@/components/admin/CVUploader";
import { LogoUploader } from "@/components/admin/LogoUploader";
import { SettingsForm } from "@/components/admin/SettingsForm";
import { IconSave } from "@/components/icons";
import { IconAdminShield } from "@/components/icons/admin-icons";
import { AeroWindow } from "@/components/win7/AeroWindow";
import { getLogoSrc } from "@/lib/brand";
import { getProfile, getSettings } from "@/lib/data";

export default async function AdminSettingsPage() {
  const [settings, logoSrc, profile] = await Promise.all([getSettings(), getLogoSrc(), getProfile()]);

  const statusBar = (
    <div className="flex w-full items-center justify-between text-xs text-win-muted">
      <span>Configuración general del sistema y enlaces de contacto</span>
      <span>Estado: {settings.availableForWork ? "Disponible para contratación" : "No disponible"}</span>
    </div>
  );

  return (
    <AeroWindow
      title="Configuración del Sistema · Panel Administrativo"
      icon={<IconAdminShield className="size-full" />}
      address={["Equipo", "Administración", "Configuración"]}
      statusBar={statusBar}
      homeHref="/admin"
    >
      <div className="p-5">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3 border-b border-gray-200 pb-3">
          <div>
            <h2 className="win-h1">Ajustes generales del portafolio</h2>
            <p className="mt-0.5 text-xs text-win-muted">Disponibilidad, contacto, redes, SEO y conexión con Google.</p>
          </div>
          <button type="submit" form="settings-form" className="win-button win-button--primary inline-flex items-center gap-1.5">
            <IconSave className="size-4" />
            <span>Guardar ajustes</span>
          </button>
        </div>

        <div className="grid grid-cols-1 gap-6 text-xs md:grid-cols-2">
          <LogoUploader initialSrc={logoSrc} />
          <CVUploader initialCvUrl={profile.cvUrl} />
          <SettingsForm settings={settings} />
        </div>
      </div>
    </AeroWindow>
  );
}
