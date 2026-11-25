import { describe, expect, it } from "vitest";
import { formatSize, parseRelease } from "./releases";

const phone = {
  versionCode: 34,
  versionName: "2.8.1",
  apkUrl: "https://github.com/khoopper/carito-music/releases/download/v2.8.1/Carito-Music-2.8.1.apk",
  sha256: "12f5",
  size: 107345659,
  notes: ["Sonido potente y claro de entrada.", "", 3],
};

describe("parseRelease", () => {
  it("reads the phone's latest.json", () => {
    expect(parseRelease(phone)).toEqual({
      version: "2.8.1",
      url: phone.apkUrl,
      fileName: "Carito-Music-2.8.1.apk",
      sizeBytes: 107345659,
      notes: ["Sonido potente y claro de entrada."],
    });
  });

  it("reads the PC's latest-pc.json, whose size is sizeBytes", () => {
    const pc = parseRelease({
      versionName: "2.8.1",
      apkUrl: "https://github.com/khoopper/carito-music/releases/download/pc/Carito-Music-PC-2.8.1.exe",
      sizeBytes: 127669416,
    });
    expect(pc?.fileName).toBe("Carito-Music-PC-2.8.1.exe");
    expect(pc?.sizeBytes).toBe(127669416);
    expect(pc?.notes).toEqual([]);
  });

  it("refuses a download outside Carito's releases, or a broken file", () => {
    expect(parseRelease({ ...phone, apkUrl: "https://example.com/Carito.apk" })).toBeNull();
    expect(parseRelease({ ...phone, apkUrl: "https://github.com/someone/else/releases/download/v1/x.apk" })).toBeNull();
    expect(parseRelease({ ...phone, apkUrl: `${phone.apkUrl}" onclick="x` })).toBeNull();
    expect(parseRelease({ ...phone, versionName: "<b>2.8</b>" })).toBeNull();
    expect(parseRelease(null)).toBeNull();
    expect(parseRelease("2.8.1")).toBeNull();
  });
});

describe("formatSize", () => {
  it("rounds to megabytes", () => {
    expect(formatSize(107345659)).toBe("102 MB");
    expect(formatSize(5 * 1048576 + 300000)).toBe("5.3 MB");
    expect(formatSize(null)).toBeNull();
  });
});
