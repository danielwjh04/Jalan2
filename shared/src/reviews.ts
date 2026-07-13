import { z } from "zod";

export const ReviewRatingsSchema = z.object({
  accuracy: z.number().int().min(1).max(5),
  communication: z.number().int().min(1).max(5),
  value: z.number().int().min(1).max(5),
});

export type ReviewRatings = z.infer<typeof ReviewRatingsSchema>;

export const ReviewSubmissionSchema = z.object({
  authorName: z.string().trim().min(2).max(40),
  visitMonth: z.string().regex(/^\d{4}-(0[1-9]|1[0-2])$/),
  body: z.string().trim().min(20).max(1000),
  ratings: ReviewRatingsSchema,
  bookingId: z.string().uuid().optional(),
});

export type ReviewSubmission = z.infer<typeof ReviewSubmissionSchema>;

export type ReviewVerification = "booking_linked" | "community_report";

export interface ExperienceReview {
  id: string;
  experienceId: string;
  authorName: string;
  visitMonth: string;
  body: string;
  ratings: ReviewRatings;
  verification: ReviewVerification;
  createdAt: string;
}

export interface ReviewSummary {
  totalCount: number;
  bookingLinkedCount: number;
  communityCount: number;
  averages: {
    accuracy: number | null;
    communication: number | null;
    value: number | null;
  };
}

export interface ExperienceRecord {
  id: string;
  operatorName: string;
  activity: string;
  meetingPointName: string;
  sourceUrl: string;
  coverUrl: string | null;
  lastOperatorConfirmationAt: string | null;
  publicEvidence: string[];
  summary: ReviewSummary;
  reviews: ExperienceReview[];
}
