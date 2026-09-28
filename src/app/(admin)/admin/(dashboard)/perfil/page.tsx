import { AvatarUploader } from "@/components/admin/AvatarUploader";
import { CVUploader } from "@/components/admin/CVUploader";
import { ProfileForm } from "@/components/admin/ProfileForm";
import { IconSave, IconUser } from "@/components/icons";
import { AeroWindow } from "@/components/win7/AeroWindow";
import { getProfile } from "@/lib/data";

export default async function AdminProfilePage() {
  const profile = await getProfile();

  const statusBar = (
    <div className="flex w-full items-center justify-between text-xs text-win-muted">
      <span>Perfil del sistema · Información profesional</span>
      <span>CV: {profile.cvUrl ? "Disponible en PDF" : "Sin asignar"}</span>
    </div>
  );

  return (
    <AeroWindow
      title="Propiedades del Perfil y CV · Panel Administrativo"
      icon={<IconUser className="size-full" />}
      address={["Equipo", "Administración", "Perfil"]}
      statusBar={statusBar}
      homeHref="/admin"
    >
      <div className="p-5">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3 border-b border-gray-200 pb-3">
          <div>
            <h2 className="win-h1">Datos de perfil y currículum</h2>
            <p className="mt-0.5 text-xs text-win-muted">Biografía, fotografía y el PDF que descargan los reclutadores.</p>
          </div>
          <button type="submit" form="profile-form" className="win-button win-button--primary inline-flex items-center gap-1.5">
            <IconSave className="size-4" />
            <span>Guardar cambios</span>
          </button>
        </div>

        <div className="grid grid-cols-1 gap-6 md:grid-cols-[320px_1fr]">
          <div className="flex flex-col items-center rounded border border-[#c4d5e7] bg-white p-4 text-center shadow-sm">
            <AvatarUploader name={profile.name} initialSrc={profile.avatar} />
            <h3 className="mt-3 text-base font-semibold text-win-heading">{profile.name}</h3>
            <p className="text-xs text-win-muted">{profile.headline}</p>
            <div className="mt-4 w-full border-t border-gray-100 pt-4">
              <CVUploader initialCvUrl={profile.cvUrl} variant="compact" />
            </div>
          </div>

          <div className="min-w-0 rounded border border-[#c4d5e7] bg-white p-4 shadow-sm">
            <ProfileForm profile={profile} />
          </div>
        </div>
      </div>
    </AeroWindow>
  );
}
