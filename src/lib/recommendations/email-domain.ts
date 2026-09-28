// Fixed list of consumer mail providers; add domains as real submissions show them.
const PUBLIC_EMAIL_DOMAINS = new Set([
  "gmail.com", "googlemail.com", "hotmail.com", "hotmail.es", "outlook.com", "outlook.es", "live.com", "live.com.mx",
  "msn.com", "yahoo.com", "yahoo.es", "yahoo.com.mx", "icloud.com", "me.com", "mac.com", "aol.com", "proton.me",
  "protonmail.com", "gmx.com", "zoho.com", "yandex.com", "mail.com",
]);

/** The email's domain when it looks like a company address; null for personal providers. */
export function corporateDomain(email: string): string | null {
  const at = email.lastIndexOf("@");
  if (at < 1) return null;
  const domain = email.slice(at + 1).trim().toLowerCase();
  if (!domain.includes(".") || PUBLIC_EMAIL_DOMAINS.has(domain)) return null;
  return domain;
}
