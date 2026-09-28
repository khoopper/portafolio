"use client";

import { useState } from "react";
import { Win7Icon } from "@/components/icons";
import { ExplorerLayout } from "@/components/win7/ExplorerLayout";
import type { PublicRecommendation } from "@/lib/recommendations/public";
import { RecommendationCard } from "./RecommendationCard";

interface Props {
  items: PublicRecommendation[];
  projectTitles: Record<string, string>;
}

/** Client-side filter so the page stays static (no ?proyecto= search param). */
export function RecommendationsBrowser({ items, projectTitles }: Props) {
  const [filter, setFilter] = useState<string | null>(null);
  const counts = new Map<string, number>();
  for (const rec of items) counts.set(rec.projectSlug, (counts.get(rec.projectSlug) ?? 0) + 1);
  const shown = filter ? items.filter((rec) => rec.projectSlug === filter) : items;

  const navItem = (slug: string | null, label: string, n: number) => (
    <li key={slug ?? "todas"}>
      <button type="button" className="navpane-item w-full text-left" aria-pressed={filter === slug} onClick={() => setFilter(slug)}>
        {label} ({n})
      </button>
    </li>
  );

  return (
    <ExplorerLayout
      nav={
        <>
          <p className="navpane-heading">Recomendaciones</p>
          <ul>
            {navItem(null, "Todas", items.length)}
            {[...counts].map(([slug, n]) => navItem(slug, projectTitles[slug], n))}
          </ul>
        </>
      }
    >
      {shown.length === 0 ? (
        <div className="grid place-items-center gap-3 py-16 text-center text-win-muted">
          <Win7Icon name="info" className="size-12" />
          <p>Aún no hay recomendaciones publicadas.</p>
        </div>
      ) : (
        <ul className="grid gap-3 lg:grid-cols-2">
          {shown.map((rec) => (
            <li key={rec.id}>
              <RecommendationCard rec={rec} projectTitle={projectTitles[rec.projectSlug]} />
            </li>
          ))}
        </ul>
      )}
    </ExplorerLayout>
  );
}
