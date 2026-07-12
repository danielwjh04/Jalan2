import { existsSync, readFileSync, readdirSync } from "node:fs";
import path from "node:path";
import type { FixtureRef } from "@shared/api";
import { BookingJsonSchema, type BookingJson } from "@shared/booking";
import { MenuJsonSchema, type MenuJson } from "@shared/menu";
import { TripPlanSchema, type TripPlan } from "@shared/trip";
import { normalizeVideoUrl } from "@shared/videoUrl";
import { fixturesRoot } from "./paths";

export const MENU_FIXTURE_SLUG = "kopitiam-01";

let manifestCache: Map<string, string> | null = null;

// manifest.json maps raw video URLs to fixture slugs. Keys are normalized on
// load so contributors can paste share links straight from the app.
function manifest(): Map<string, string> {
  if (manifestCache) return manifestCache;
  const raw = readFileSync(path.join(fixturesRoot(), "manifest.json"), "utf8");
  const parsed = JSON.parse(raw) as Record<string, string>;
  manifestCache = new Map();
  for (const [url, slug] of Object.entries(parsed)) {
    const normalized = normalizeVideoUrl(url);
    if (normalized) manifestCache.set(normalized.url, slug);
  }
  return manifestCache;
}

export function resolveFixtureSlug(normalizedUrl: string): string | null {
  return manifest().get(normalizedUrl) ?? null;
}

export function knownFixtures(): FixtureRef[] {
  return [...manifest().entries()].map(([url, slug]) => ({ slug, url }));
}

export function readCaption(slug: string): string | null {
  const captionPath = path.join(fixturesRoot(), slug, "caption.txt");
  return existsSync(captionPath)
    ? readFileSync(captionPath, "utf8").trim()
    : null;
}

export function findVideoPath(slug: string): string | null {
  const videoPath = path.join(fixturesRoot(), slug, "video.mp4");
  return existsSync(videoPath) ? videoPath : null;
}

export function findAudioPath(slug: string): string | null {
  const dir = path.join(fixturesRoot(), slug);
  if (!existsSync(dir)) return null;
  const audio = readdirSync(dir).find((name) =>
    /^audio\.(wav|m4a|mp3)$/.test(name),
  );
  return audio ? path.join(dir, audio) : null;
}

export function findCoverPath(slug: string): string | null {
  const coverPath = path.join(fixturesRoot(), slug, "cover.jpg");
  return existsSync(coverPath) ? coverPath : null;
}

export function coverUrlFor(slug: string | null): string | null {
  return slug && findCoverPath(slug) ? `/covers/${slug}` : null;
}

export function loadCachedBooking(slug: string): BookingJson | null {
  const cachedPath = path.join(fixturesRoot(), slug, "booking.cached.json");
  if (!existsSync(cachedPath)) return null;
  const parsed = BookingJsonSchema.safeParse(
    JSON.parse(readFileSync(cachedPath, "utf8")),
  );
  return parsed.success ? parsed.data : null;
}

export function loadCachedTrip(slug: string): TripPlan | null {
  const cachedPath = path.join(fixturesRoot(), slug, "trip.cached.json");
  if (!existsSync(cachedPath)) return null;
  const parsed = TripPlanSchema.safeParse(
    JSON.parse(readFileSync(cachedPath, "utf8")),
  );
  return parsed.success ? parsed.data : null;
}

export function loadCachedMenu(
  slug: string = MENU_FIXTURE_SLUG,
): MenuJson | null {
  const cachedPath = path.join(
    fixturesRoot(),
    "menu",
    slug,
    "menu.cached.json",
  );
  if (!existsSync(cachedPath)) return null;
  const parsed = MenuJsonSchema.safeParse(
    JSON.parse(readFileSync(cachedPath, "utf8")),
  );
  return parsed.success ? parsed.data : null;
}

export function findMenuImagePath(slug: string, file: string): string | null {
  if (!/^[a-z0-9-]+$/.test(slug)) return null;
  if (
    !/^[a-z0-9][a-z0-9.-]*\.(jpg|jpeg|png)$/.test(file) ||
    file.includes("..")
  )
    return null;
  const imagePath = path.join(fixturesRoot(), "menu", slug, "images", file);
  return existsSync(imagePath) ? imagePath : null;
}

export function resetFixtureCache(): void {
  manifestCache = null;
}
