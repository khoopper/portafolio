/** "https://github.com/owner/repo(.git)(/...)" → "owner/repo"; null for anything else. */
export function repoPath(repoUrl: string | null): string | null {
  const m = repoUrl?.match(/^https:\/\/github\.com\/([\w.-]+)\/([\w.-]+?)(?:\.git)?(?:\/|$)/);
  return m ? `${m[1]}/${m[2]}` : null;
}

/**
 * README rendered to HTML by GitHub (sanitized on their side). Cached for an hour so the
 * unauthenticated API limit (60 req/h) is never a concern. null when missing or offline.
 */
export async function getReadmeHtml(repoUrl: string | null): Promise<string | null> {
  const path = repoPath(repoUrl);
  if (!path) return null;
  try {
    const res = await fetch(`https://api.github.com/repos/${path}/readme`, {
      headers: { Accept: "application/vnd.github.html+json", "User-Agent": "portfolio-exe" },
      next: { revalidate: 3600 },
    });
    return res.ok ? await res.text() : null;
  } catch {
    return null;
  }
}
