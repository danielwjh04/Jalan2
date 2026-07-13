import { randomUUID } from "node:crypto";
import type {
  ExperienceRecord,
  ExperienceReview,
  ReviewRatings,
  ReviewSubmission,
  ReviewSummary,
} from "@shared/reviews";
import { allItineraries, getItinerary } from "./itineraries";

const reviews = new Map<string, ExperienceReview[]>();
const reviewedBookings = new Set<string>();

export function getExperienceRecord(id: string): ExperienceRecord | undefined {
  const matching = allItineraries()
    .filter((itinerary) => itinerary.experienceId === id && itinerary.booking)
    .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
  const latest = matching[0];
  if (!latest?.booking) return undefined;
  const confirmed = matching.find((itinerary) => itinerary.status === "CONFIRMED");
  const items = [...(reviews.get(id) ?? [])].sort((a, b) =>
    b.createdAt.localeCompare(a.createdAt),
  );
  return {
    id,
    operatorName: latest.booking.operator_name,
    activity: latest.booking.activity,
    meetingPointName: latest.booking.meeting_point.name,
    sourceUrl: latest.sourceUrl,
    coverUrl: latest.coverUrl,
    lastOperatorConfirmationAt: confirmed?.updatedAt ?? null,
    publicEvidence: latest.booking.trust?.evidence ?? [],
    summary: summarize(items),
    reviews: items,
  };
}

export function addReview(
  experienceId: string,
  submission: ReviewSubmission,
): ExperienceRecord {
  const record = getExperienceRecord(experienceId);
  if (!record) throw new Error(`Unknown experience ${experienceId}`);
  const verification = verificationFor(experienceId, submission.bookingId);
  const { bookingId, ...publicSubmission } = submission;
  const review: ExperienceReview = {
    ...publicSubmission,
    id: randomUUID(),
    experienceId,
    verification,
    createdAt: new Date().toISOString(),
  };
  reviews.set(experienceId, [...(reviews.get(experienceId) ?? []), review]);
  if (bookingId) reviewedBookings.add(bookingId);
  return getExperienceRecord(experienceId) as ExperienceRecord;
}

export function resetReviews(): void {
  reviews.clear();
  reviewedBookings.clear();
}

function verificationFor(
  experienceId: string,
  bookingId: string | undefined,
): ExperienceReview["verification"] {
  if (!bookingId) return "community_report";
  if (reviewedBookings.has(bookingId)) {
    throw new Error("This booking already has a review");
  }
  const itinerary = getItinerary(bookingId);
  if (
    !itinerary ||
    itinerary.experienceId !== experienceId ||
    itinerary.status !== "CONFIRMED"
  ) {
    throw new Error("A booking-linked review requires a matching confirmed booking");
  }
  return "booking_linked";
}

function summarize(items: ExperienceReview[]): ReviewSummary {
  const bookingLinkedCount = items.filter(
    (item) => item.verification === "booking_linked",
  ).length;
  return {
    totalCount: items.length,
    bookingLinkedCount,
    communityCount: items.length - bookingLinkedCount,
    averages: {
      accuracy: average(items, "accuracy"),
      communication: average(items, "communication"),
      value: average(items, "value"),
    },
  };
}

function average(
  items: ExperienceReview[],
  field: keyof ReviewRatings,
): number | null {
  if (items.length === 0) return null;
  const total = items.reduce((sum, item) => sum + item.ratings[field], 0);
  return Math.round((total / items.length) * 10) / 10;
}
