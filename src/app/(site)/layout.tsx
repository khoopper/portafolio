import type { ReactNode } from "react";
import { DesktopGadgets } from "@/components/win7/DesktopGadgets";
import { DesktopShortcut } from "@/components/win7/DesktopShortcut";
import { SITE_NAV } from "@/components/win7/site-nav";
import { Taskbar } from "@/components/win7/Taskbar";
import { WindowStateProvider } from "@/components/win7/window-state";
import { getLogoSrc } from "@/lib/brand";
import { getProfile, getProjects, getSearchIndex, getSettings } from "@/lib/data";

export default async function SiteLayout({ children }: { children: ReactNode }) {
  const [profile, settings, featured, searchIndex, logoSrc] = await Promise.all([
    getProfile(),
    getSettings(),
    getProjects({ featured: true }),
    getSearchIndex(),
    getLogoSrc(),
  ]);

  return (
    <WindowStateProvider desktopHref="/escritorio">
      <a href="#contenido" className="skip-link">
        Saltar al contenido
      </a>
      <div className="wallpaper" aria-hidden="true" />
      <DesktopShortcut logoSrc={logoSrc} />
      <DesktopGadgets index={searchIndex} />
      {/* Taskbar first in DOM (it is fixed to the bottom): Tab goes skip link → orb → taskbar → window. */}
      <Taskbar
        items={SITE_NAV}
        available={settings.availableForWork}
        menu={{
          name: profile.name,
          avatar: profile.avatar,
          featured: featured.map((p) => ({ slug: p.slug, title: p.title })),
          cvUrl: profile.cvUrl,
          githubUrl: settings.githubUrl,
          linkedinUrl: settings.linkedinUrl,
          email: settings.contactEmail,
        }}
      />
      <main id="contenido" className="desktop-main">
        {children}
      </main>
    </WindowStateProvider>
  );
}
