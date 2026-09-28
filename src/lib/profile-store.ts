import { cache } from "react";
import { parseProfileInput, type EditableProfile } from "@/lib/profile-input";
import { readContent, writeContent } from "@/lib/site-content";
import { parseSettingsInput } from "@/lib/settings-input";
import type { SiteSettings } from "@/lib/types";

// Admin-edited profile and settings live as small JSON files in the private site-content bucket
// (like projects.json and the CV). The profile photo itself is in the public media bucket: only its URL is stored.
const PROFILE_KEY = "profile.json";
const SETTINGS_KEY = "settings.json";

export type ProfileOverrides = Partial<EditableProfile> & { avatar?: string | null };

const isHttps = (v: unknown): v is string => {
  try {
    return typeof v === "string" && new URL(v).protocol === "https:";
  } catch {
    return false;
  }
};

/** Defensive: a hand-edited or partial file can never put a wrong type into the pages. */
export function sanitizeProfileOverrides(raw: unknown): ProfileOverrides {
  if (typeof raw !== "object" || raw === null) return {};
  const r = raw as Record<string, unknown>;
  const out: ProfileOverrides = {};
  if (r.avatar === null || isHttps(r.avatar)) out.avatar = r.avatar;
  const text = parseProfileInput({ name: r.name, headline: r.headline, location: r.location, shortBio: r.shortBio, bio: Array.isArray(r.bio) ? r.bio.join("\n\n") : "" });
  if (text.ok) Object.assign(out, text.value);
  return out;
}

async function readJson(key: string): Promise<unknown> {
  try {
    const stored = await readContent(key);
    return stored ? JSON.parse(new TextDecoder().decode(stored)) : null;
  } catch {
    return null; // Storage outage or corrupt file: the pages fall back to the shipped content.
  }
}

export const getProfileOverrides = cache(async (): Promise<ProfileOverrides> => sanitizeProfileOverrides(await readJson(PROFILE_KEY)));

/** Merges into what is stored (the photo and the text fields are saved by different forms). Throws on failure. */
export async function saveProfileOverrides(patch: ProfileOverrides): Promise<void> {
  // Strict read: if storage is down we fail instead of overwriting the saved profile with just this patch.
  const stored = await readContent(PROFILE_KEY);
  const current = stored ? sanitizeProfileOverrides(JSON.parse(new TextDecoder().decode(stored))) : {};
  await writeContent(PROFILE_KEY, JSON.stringify({ ...current, ...patch }), "application/json");
}

/** Stored settings when valid, otherwise null (the shipped defaults apply). */
export const getStoredSettings = cache(async (): Promise<SiteSettings | null> => {
  const raw = await readJson(SETTINGS_KEY);
  if (typeof raw !== "object" || raw === null) return null;
  const parsed = parseSettingsInput(raw as Record<string, unknown>);
  return parsed.ok ? parsed.value : null;
});

export async function saveSettings(value: SiteSettings): Promise<void> {
  await writeContent(SETTINGS_KEY, JSON.stringify(value), "application/json");
}
