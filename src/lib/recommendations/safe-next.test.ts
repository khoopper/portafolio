import { describe, expect, it } from "vitest";
import { adminReturnPath, safeNext } from "./safe-next";

describe("adminReturnPath", () => {
  it.each(["/admin", "/admin/proyectos", "/admin/recomendaciones?x=1"])("conserva %s", (path) => expect(adminReturnPath(path)).toBe(path));

  it.each([null, "https://evil.com/admin", "//evil.com/admin", "/\\evil.com", "/inicio", "/administrador", "javascript:alert(1)"])(
    "envía %s a /admin",
    (path) => expect(adminReturnPath(path)).toBe("/admin"),
  );
});

describe("safeNext", () => {
  it.each(["/r/abc", "/", "/proyectos/x?y=1"])("acepta %s", (path) => expect(safeNext(path)).toBe(path));

  it.each([null, undefined, "", "https://evil.com", "//evil.com", "/\\evil.com", "/\t/evil.com", "evil.com", "javascript:alert(1)"])(
    "rechaza %s",
    (path) => expect(safeNext(path)).toBe("/"),
  );
});
