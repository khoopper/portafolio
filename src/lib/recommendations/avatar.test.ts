import { describe, expect, it } from "vitest";
import { isAllowedAvatarUrl } from "./avatar";

describe("isAllowedAvatarUrl", () => {
  it.each(["https://lh3.googleusercontent.com/a/xyz", "https://media.licdn.com/dms/image/abc"])("acepta %s", (url) =>
    expect(isAllowedAvatarUrl(url)).toBe(true),
  );

  it.each([
    "http://lh3.googleusercontent.com/a/xyz",
    "https://evil.com/googleusercontent.com",
    "https://googleusercontent.com.evil.com/x",
    "https://media.licdn.com.evil.com/x",
    "no es una url",
  ])("rechaza %s", (url) => expect(isAllowedAvatarUrl(url)).toBe(false));
});
