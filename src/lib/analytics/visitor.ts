import { createHmac } from "node:crypto";

export type Device = "mobile" | "tablet" | "desktop";

const BOT = /bot|crawl|spider|slurp|headless|lighthouse|pagespeed|preview|monitor|uptime|curl|wget|python-requests|node-fetch|axios|go-http/i;

export const isBot = (ua: string | null): boolean => !ua || BOT.test(ua);

export function deviceOf(ua: string): Device {
  if (/ipad|tablet|kindle|silk|playbook/i.test(ua) || (/android/i.test(ua) && !/mobile/i.test(ua))) return "tablet";
  return /mobile|iphone|ipod|android|windows phone/i.test(ua) ? "mobile" : "desktop";
}

/**
 * Unique-visitor id for ONE day: HMAC(secret + day, ip + user agent), cut to 32 hex chars.
 * The IP is never stored, and tomorrow's id differs, so it cannot follow anyone across days.
 */
export function visitorId(secret: string, day: string, ip: string, ua: string): string {
  const daily = createHmac("sha256", secret).update(`visitor-salt:${day}`).digest();
  return createHmac("sha256", daily).update(`${ip}|${ua}`).digest("hex").slice(0, 32);
}
