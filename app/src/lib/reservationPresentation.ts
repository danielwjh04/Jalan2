import type {
  ReservationCounts,
  ReservationEligibility,
  ReservationStatus,
} from "@shared/reservation";

export function nextMalaysiaDates(now = new Date()): string[] {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Kuala_Lumpur",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(now);
  const value = Object.fromEntries(
    parts.map((part) => [part.type, part.value]),
  );
  const base = Date.UTC(
    Number(value.year),
    Number(value.month) - 1,
    Number(value.day),
  );
  return [1, 2, 3].map((days) =>
    new Date(base + days * 86_400_000).toISOString().slice(0, 10),
  );
}

export function reservationStatusLabel(
  status: ReservationStatus,
  eligibility?: ReservationEligibility,
): string {
  if (status === "SKIPPED") {
    return eligibility === "CONTACT_UNAVAILABLE"
      ? "Contact unavailable"
      : "Walk in";
  }
  return {
    PENDING_CONFIRM: "Waiting for reply",
    CONFIRMED: "Confirmed",
    DECLINED: "Declined",
    FAILED: "Could not send",
  }[status];
}

export function reservationProgressLabel(counts: ReservationCounts): string {
  const parts = [
    counts.confirmed ? `${counts.confirmed} confirmed` : null,
    counts.waiting ? `${counts.waiting} waiting` : null,
    counts.declined ? `${counts.declined} declined` : null,
    counts.failed ? `${counts.failed} failed` : null,
  ].filter((part): part is string => Boolean(part));
  return parts.join(", ") || "Walk-in stops ready";
}

export function validReservationTime(value: string): boolean {
  return /^([01]\d|2[0-3]):[0-5]\d$/.test(value);
}
