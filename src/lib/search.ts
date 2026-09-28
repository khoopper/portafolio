export type SearchKind = "section" | "project" | "tech" | "document" | "contact";

export interface SearchItem {
  kind: SearchKind;
  label: string;
  hint?: string;
  href: string;
  /** Extra words that should find this item (aliases, tech names…). */
  keywords?: string;
  download?: boolean;
  external?: boolean;
}

/** Lowercase, no accents: "Currículum" → "curriculum". */
export const normalize = (s: string) =>
  s
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "");

/**
 * Win7 Start-search style: every typed word must start some word of the item.
 * Items whose label matches come first; order within a rank follows the index.
 */
export function searchPortfolio(items: SearchItem[], query: string, limit = 8): SearchItem[] {
  const terms = normalize(query).split(/\s+/).filter(Boolean);
  if (!terms.length) return [];
  const words = (s: string) => normalize(s).split(/[^a-z0-9#+.]+/).filter(Boolean);
  const hits = (ws: string[]) => terms.every((t) => ws.some((w) => w.startsWith(t)));

  const ranked: { item: SearchItem; rank: number }[] = [];
  for (const item of items) {
    const label = words(item.label);
    if (hits(label)) ranked.push({ item, rank: 0 });
    else if (hits([...label, ...words(`${item.hint ?? ""} ${item.keywords ?? ""}`)])) ranked.push({ item, rank: 1 });
  }
  return ranked
    .sort((a, b) => a.rank - b.rank)
    .slice(0, limit)
    .map((r) => r.item);
}
