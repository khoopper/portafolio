import type { Metadata } from "next";
import { Win7Icon } from "@/components/icons";
import { RecommendationsBrowser } from "@/components/recommendations/RecommendationsBrowser";
import { AeroWindow } from "@/components/win7/AeroWindow";
import { count } from "@/lib/count";
import { getProjects } from "@/lib/data";
import { getApprovedRecommendations } from "@/lib/recommendations/queries";

export const metadata: Metadata = { title: "Recomendaciones", alternates: { canonical: "/recomendaciones" } };

export default async function RecomendacionesPage() {
  const [recommendations, projects] = await Promise.all([getApprovedRecommendations(), getProjects()]);
  const projectTitles = Object.fromEntries(projects.map((p) => [p.slug, p.title]));
  // Recommendations of drafts or deleted projects stay hidden.
  const items = recommendations.filter((rec) => projectTitles[rec.projectSlug]);

  return (
    <AeroWindow
      title="Recomendaciones"
      icon={<Win7Icon name="shield-ok" className="size-full" />}
      address={["Equipo", "Portafolio", "Recomendaciones"]}
      scroll={false}
      statusBar={count(items.length, "recomendación verificada", "recomendaciones verificadas")}
    >
      <RecommendationsBrowser items={items} projectTitles={projectTitles} />
    </AeroWindow>
  );
}
