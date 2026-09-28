/**
 * Vercel Cron sends `Authorization: Bearer $CRON_SECRET` when that variable exists in the project.
 * With no secret configured the job still runs (it only does a tiny read), so the keep-alive works
 * out of the box; once CRON_SECRET is set, anything without it is refused.
 */
export function isCronAuthorized(authorization: string | null, secret: string | undefined): boolean {
  if (!secret) return true;
  return authorization === `Bearer ${secret}`;
}
