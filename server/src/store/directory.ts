import type { DirectoryEntry } from '@shared/api';
import type { BookingJson } from '@shared/booking';
import { experienceIdFor } from '../lib/experienceId';

const entries = new Map<string, DirectoryEntry>();

export function recordDemand(booking: BookingJson): DirectoryEntry {
  const key = directoryKey(booking.operator_name);
  const existing = entries.get(key);
  const now = new Date().toISOString();
  if (existing) {
    existing.demandCount += 1;
    existing.lastDemandAt = now;
    return existing;
  }
  const entry: DirectoryEntry = {
    experienceId: experienceIdFor(booking),
    operatorName: booking.operator_name,
    activity: booking.activity,
    meetingPointName: booking.meeting_point.name,
    demandCount: 1,
    optedIn: false,
    lastDemandAt: now,
  };
  entries.set(key, entry);
  return entry;
}

export function markOptedIn(operatorName: string): void {
  const entry = entries.get(directoryKey(operatorName));
  if (entry) entry.optedIn = true;
}

export function rankedDirectory(): DirectoryEntry[] {
  return [...entries.values()].sort(
    (a, b) => b.demandCount - a.demandCount || b.lastDemandAt.localeCompare(a.lastDemandAt),
  );
}

export function resetDirectory(): void {
  entries.clear();
}

function directoryKey(operatorName: string): string {
  return operatorName.trim().toLowerCase();
}
