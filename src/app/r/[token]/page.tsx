import type { Metadata } from "next";
import { RecommendationWizard, type WizardNotice } from "@/components/recommendations/RecommendationWizard";
import { getProfile, getProject } from "@/lib/data";
import { isRecommendationProvider, readVerifiedIdentity } from "@/lib/recommendations/identity";
import { PROVIDER_LABEL } from "@/lib/recommendations/public";
import { findInvite, type InviteLookup } from "@/lib/recommendations/queries";
import { createSessionClient, isSupabaseConfigured } from "@/lib/supabase";
import { submitRecommendationAction } from "./actions";

export const metadata: Metadata = { title: "Escribir una recomendación", robots: { index: false, follow: false } };

interface PageProps {
  params: Promise<{ token: string }>;
  searchParams: Promise<{ aviso?: string }>;
}

const NOTICES: WizardNotice[] = ["cancelado", "error", "sin-verificar"];

export default async function RecomendarPage({ params, searchParams }: PageProps) {
  const [{ token }, { aviso }] = await Promise.all([params, searchParams]);
  if (!isSupabaseConfigured()) return <RecommendationWizard step="error" reason="unavailable" />;

  let invite: InviteLookup | null;
  try {
    invite = await findInvite(token);
  } catch {
    return <RecommendationWizard step="error" reason="unavailable" />;
  }
  if (!invite) return <RecommendationWizard step="error" reason="invalid" />;
  if (invite.status !== "unused") return <RecommendationWizard step="error" reason={invite.status} />;

  const [profile, project] = await Promise.all([getProfile(), getProject(invite.projectSlug)]);
  if (!project) return <RecommendationWizard step="error" reason="invalid" />;
  const common = { token, ownerName: profile.name.split(" ")[0], projectTitle: project.title };

  const {
    data: { user },
  } = await (await createSessionClient()).auth.getUser();
  const identity = user ? readVerifiedIdentity(user) : null;

  if (!identity) {
    const hasRecommendationIdentity = Boolean(user?.identities?.some((i) => isRecommendationProvider(i.provider)));
    const notice = hasRecommendationIdentity ? "sin-verificar" : (NOTICES.find((n) => n === aviso) ?? null);
    return <RecommendationWizard step="signin" {...common} notice={notice} />;
  }
  return (
    <RecommendationWizard
      step="form"
      {...common}
      identity={{ name: identity.name, pictureUrl: identity.pictureUrl, provider: PROVIDER_LABEL[identity.provider] }}
      submit={submitRecommendationAction.bind(null, token)}
    />
  );
}
