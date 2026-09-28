/**
 * Where to go after the OAuth round trip. Only same-site paths survive: "//host", "/\host" and
 * control characters (browsers strip tabs/newlines, turning "/\t/host" into "//host") fall back to "/".
 */
export function safeNext(next: string | null | undefined): string {
  if (!next || !next.startsWith("/") || next.startsWith("//") || next.includes("\\") || /[\u0000-\u001f\u007f]/.test(next)) {
    return "/";
  }
  return next;
}

/** Where the admin login returns to: a same-site path inside /admin, otherwise /admin. */
export function adminReturnPath(from: string | null | undefined): string {
  const path = safeNext(from);
  return /^\/admin(?:[/?#]|$)/.test(path) ? path : "/admin";
}
