import type { Metadata } from "next";
import { WelcomeCenter } from "@/components/win7/WelcomeCenter";
import { getProfile } from "@/lib/data";

export const metadata: Metadata = { title: "Escritorio", robots: { index: false, follow: false } };

/** Where visitors land after the login: an empty desktop with the welcome window on top. */
export default async function EscritorioPage() {
  const profile = await getProfile();
  return <WelcomeCenter name={profile.name} headline={profile.headline} avatar={profile.avatar} cvUrl={profile.cvUrl} />;
}
