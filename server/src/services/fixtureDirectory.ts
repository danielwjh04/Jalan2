import type { DirectoryEntry } from "@shared/api";
import type { ExperienceRecord } from "@shared/reviews";
import { experienceIdFor } from "../lib/experienceId";
import {
  coverUrlFor,
  knownFixtures,
  loadCachedBooking,
} from "../lib/fixtures";

interface FixtureOperator {
  entry: DirectoryEntry;
  record: ExperienceRecord;
}

export function fixtureDirectoryEntries(): DirectoryEntry[] {
  return fixtureOperators().map(({ entry }) => entry);
}

export function fixtureExperienceRecord(id: string): ExperienceRecord | undefined {
  return fixtureOperators().find(({ record }) => record.id === id)?.record;
}

export function mergeDirectoryEntries(
  session: DirectoryEntry[],
  fixtures: DirectoryEntry[],
): DirectoryEntry[] {
  const merged = new Map(fixtures.map((entry) => [keyFor(entry), entry]));
  for (const entry of session) merged.set(keyFor(entry), entry);
  return [...merged.values()].sort(
    (a, b) => b.demandCount - a.demandCount || a.operatorName.localeCompare(b.operatorName),
  );
}

function fixtureOperators(): FixtureOperator[] {
  const byOperator = new Map<string, FixtureOperator>();
  for (const fixture of knownFixtures()) {
    const booking = loadCachedBooking(fixture.slug);
    const coverUrl = coverUrlFor(fixture.slug);
    // Route-only stage fixtures are valid ingest caches, but they are not
    // public operator profiles unless they also carry source-owned cover art.
    if (!booking || !coverUrl) continue;
    const experienceId = experienceIdFor(booking);
    const entry: DirectoryEntry = {
      experienceId,
      operatorName: booking.operator_name,
      activity: booking.activity,
      meetingPointName: booking.meeting_point.name,
      coverUrl,
      demandCount: 0,
      optedIn: false,
      lastDemandAt: null,
      source: "fixture",
    };
    byOperator.set(keyFor(entry), {
      entry,
      record: {
        id: experienceId,
        operatorName: booking.operator_name,
        activity: booking.activity,
        meetingPointName: booking.meeting_point.name,
        sourceUrl: fixture.url,
        coverUrl,
        lastOperatorConfirmationAt: null,
        publicEvidence: booking.trust?.evidence ?? [],
        summary: emptySummary(),
        reviews: [],
      },
    });
  }
  return [...byOperator.values()];
}

function keyFor(entry: DirectoryEntry): string {
  return entry.operatorName.trim().toLowerCase();
}

function emptySummary(): ExperienceRecord["summary"] {
  return {
    totalCount: 0,
    bookingLinkedCount: 0,
    communityCount: 0,
    averages: { accuracy: null, communication: null, value: null },
  };
}
