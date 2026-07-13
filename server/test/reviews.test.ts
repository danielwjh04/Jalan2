import { beforeEach, describe, expect, it } from "vitest";
import type { BookingJson } from "@shared/booking";
import type { ReviewSubmission } from "@shared/reviews";
import {
  createItinerary,
  resetItineraries,
  setBooking,
  setStage,
  transition,
} from "../src/store/itineraries";
import {
  addReview,
  getExperienceRecord,
  resetReviews,
} from "../src/store/reviews";

const booking: BookingJson = {
  operator_name: "Bengoh River Adventures",
  activity: "Bengoh waterfall day trip",
  price_myr: 77,
  pax: 2,
  meeting_point: { name: "Bengoh Dam", lat: 1.278, lng: 110.217 },
  contact: { whatsapp: null, source: "caption" },
  date_requested: null,
  confidence: 0.8,
  raw_evidence: { transcript_span: "RM77 package", frame_ts: "12s" },
  trust: { score: 0.6, evidence: ["Public profile active since 2023"] },
};

const review: ReviewSubmission = {
  authorName: "Aina",
  visitMonth: "2026-07",
  body: "Clear meeting instructions and the itinerary matched the description.",
  ratings: { accuracy: 5, communication: 4, value: 5 },
};

function readyItinerary(): ReturnType<typeof createItinerary> {
  const itinerary = createItinerary("https://example.com/bengoh");
  setBooking(itinerary.id, booking, "cache");
  setStage(itinerary.id, "READY");
  return itinerary;
}

beforeEach(() => {
  resetItineraries();
  resetReviews();
});

describe("experience reviews", () => {
  it("builds a living record without inventing reviews", () => {
    const itinerary = readyItinerary();
    const record = getExperienceRecord(itinerary.experienceId ?? "");
    expect(record?.operatorName).toBe("Bengoh River Adventures");
    expect(record?.publicEvidence).toEqual(["Public profile active since 2023"]);
    expect(record?.summary.totalCount).toBe(0);
    expect(record?.summary.averages.accuracy).toBeNull();
  });

  it("labels an open submission as a community report", () => {
    const itinerary = readyItinerary();
    const record = addReview(itinerary.experienceId ?? "", review);
    expect(record.reviews[0].verification).toBe("community_report");
    expect(record.summary.communityCount).toBe(1);
    expect(record.summary.averages.value).toBe(5);
  });

  it("links a review only to a matching confirmed booking", () => {
    const itinerary = readyItinerary();
    transition(itinerary.id, "PENDING_CONFIRM");
    transition(itinerary.id, "CONFIRMED");
    const record = addReview(itinerary.experienceId ?? "", {
      ...review,
      bookingId: itinerary.id,
    });
    expect(record.reviews[0].verification).toBe("booking_linked");
    expect(record.summary.bookingLinkedCount).toBe(1);
    expect(record.lastOperatorConfirmationAt).not.toBeNull();
  });

  it("rejects an unconfirmed or duplicate booking-linked review", () => {
    const itinerary = readyItinerary();
    expect(() =>
      addReview(itinerary.experienceId ?? "", {
        ...review,
        bookingId: itinerary.id,
      }),
    ).toThrow(/matching confirmed booking/);
    transition(itinerary.id, "PENDING_CONFIRM");
    transition(itinerary.id, "CONFIRMED");
    addReview(itinerary.experienceId ?? "", { ...review, bookingId: itinerary.id });
    expect(() =>
      addReview(itinerary.experienceId ?? "", {
        ...review,
        bookingId: itinerary.id,
      }),
    ).toThrow(/already has a review/);
  });
});
