import type { ReactNode } from "react";
import { redirect } from "next/navigation";
import { AdminTaskbar } from "@/components/admin/AdminTaskbar";
import { WindowStateProvider } from "@/components/win7/window-state";
import { hasAdminSession } from "@/lib/admin-auth";

export default async function AdminDashboardLayout({ children }: { children: ReactNode }) {
  const isAuthenticated = await hasAdminSession();

  if (!isAuthenticated) {
    redirect("/admin/login");
  }

  return (
    <WindowStateProvider>
      <a href="#contenido-admin" className="skip-link">
        Saltar al contenido administrativo
      </a>
      <div className="wallpaper" aria-hidden="true" />
      <AdminTaskbar />
      <main id="contenido-admin" className="desktop-main">
        {children}
      </main>
    </WindowStateProvider>
  );
}
