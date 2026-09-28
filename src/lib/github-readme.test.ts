import { describe, expect, it } from "vitest";
import { repoPath } from "./github-readme";

describe("repoPath", () => {
  it("extracts owner/repo from GitHub URLs", () => {
    expect(repoPath("https://github.com/khoopper/sasclinica")).toBe("khoopper/sasclinica");
    expect(repoPath("https://github.com/khoopper/Flixxer.git")).toBe("khoopper/Flixxer");
    expect(repoPath("https://github.com/a/b/tree/main")).toBe("a/b");
  });

  it("rejects non-GitHub or empty values", () => {
    expect(repoPath(null)).toBeNull();
    expect(repoPath("https://gitlab.com/a/b")).toBeNull();
    expect(repoPath("https://github.com/a")).toBeNull();
  });
});
