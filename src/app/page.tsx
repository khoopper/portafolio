import type { Metadata } from "next";
import { LoginScreen } from "@/components/win7/LoginScreen";
import { getProfile } from "@/lib/data";

// The login screen has no content of its own: search engines should index the real home.
export const metadata: Metadata = { alternates: { canonical: "/inicio" } };

export default async function LoginPage() {
  const profile = await getProfile();
  return <LoginScreen name={profile.name} headline={profile.headline} avatar={profile.avatar} />;
}
