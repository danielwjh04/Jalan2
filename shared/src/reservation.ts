import { z } from "zod";

const DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;
const TIME_PATTERN = /^([01]\d|2[0-3]):[0-5]\d$/;

export const ReservationEligibilitySchema = z.enum([
  "BOOKABLE",
  "WALK_IN",
  "CONTACT_UNAVAILABLE",
]);
export const ReservationStatusSchema = z.enum([
  "PENDING_CONFIRM",
  "CONFIRMED",
  "DECLINED",
  "FAILED",
  "SKIPPED",
]);
export const ReservationMessageSchema = z.object({
  direction: z.enum(["outbound", "inbound"]),
  text: z.string(),
  at: z.string().datetime(),
});

export const TripStopReservationSchema = z.object({
  id: z.string().min(1),
  batchId: z.string().min(1),
  stopId: z.string().min(1),
  reference: z.string().regex(/^J2-[A-Z0-9]{4,8}$/),
  stopName: z.string().min(1),
  imageUrl: z.string().url().nullable(),
  requestedStartISO: z.string().datetime({ offset: true }),
  eligibility: ReservationEligibilitySchema,
  status: ReservationStatusSchema,
  failureReason: z.string().min(1).nullable(),
  messages: z.array(ReservationMessageSchema),
  updatedAt: z.string().datetime(),
});

export const ReservationCountsSchema = z.object({
  confirmed: z.number().int().nonnegative(),
  waiting: z.number().int().nonnegative(),
  declined: z.number().int().nonnegative(),
  failed: z.number().int().nonnegative(),
  walkIn: z.number().int().nonnegative(),
  contactUnavailable: z.number().int().nonnegative(),
});

export const TripReservationBatchSchema = z
  .object({
    id: z.string().min(1),
    clientRequestId: z.string().min(1),
    tripId: z.string().min(1),
    tripDate: z.string().refine(validDate, "Invalid trip date"),
    pax: z.number().int().min(1).max(20),
    stops: z.array(TripStopReservationSchema).min(1),
    counts: ReservationCountsSchema,
    createdAt: z.string().datetime(),
    updatedAt: z.string().datetime(),
  })
  .superRefine((batch, context) => {
    requireUnique(
      batch.stops.map(({ stopId }) => stopId),
      "stop ids",
      context,
    );
    requireUnique(
      batch.stops.map(({ reference }) => reference),
      "references",
      context,
    );
  });

export const ReservationPreviewStopSchema = z.object({
  stopId: z.string().min(1),
  stopName: z.string().min(1),
  imageUrl: z.string().url().nullable(),
  eligibility: ReservationEligibilitySchema,
  suggestedTime: z.string().regex(TIME_PATTERN),
});
export const ReservationPreviewSchema = z.object({
  tripId: z.string().min(1),
  tripDate: z.string().refine(validDate, "Invalid trip date"),
  pax: z.number().int().min(1).max(20),
  stops: z.array(ReservationPreviewStopSchema).min(1),
});
export const ReservationPreviewRequestSchema = z.object({
  tripId: z.string().min(1),
  tripDate: z.string().refine(validDate, "Invalid trip date"),
  pax: z.number().int().min(1).max(20),
});
export const CreateTripReservationRequestSchema =
  ReservationPreviewRequestSchema.extend({
    clientRequestId: z.string().min(1),
    requestedTimes: z.record(z.string().regex(TIME_PATTERN)),
  });

export type ReservationEligibility = z.infer<
  typeof ReservationEligibilitySchema
>;
export type ReservationStatus = z.infer<typeof ReservationStatusSchema>;
export type ReservationMessage = z.infer<typeof ReservationMessageSchema>;
export type TripStopReservation = z.infer<typeof TripStopReservationSchema>;
export type ReservationCounts = z.infer<typeof ReservationCountsSchema>;
export type TripReservationBatch = z.infer<typeof TripReservationBatchSchema>;
export type ReservationPreview = z.infer<typeof ReservationPreviewSchema>;
export type ReservationPreviewStop = z.infer<
  typeof ReservationPreviewStopSchema
>;
export type ReservationPreviewRequest = z.infer<
  typeof ReservationPreviewRequestSchema
>;
export type CreateTripReservationRequest = z.infer<
  typeof CreateTripReservationRequestSchema
>;

type CountableStop = Pick<TripStopReservation, "eligibility" | "status">;

export function reservationCounts(
  stops: readonly CountableStop[],
): ReservationCounts {
  return {
    confirmed: countStatus(stops, "CONFIRMED"),
    waiting: countStatus(stops, "PENDING_CONFIRM"),
    declined: countStatus(stops, "DECLINED"),
    failed: countStatus(stops, "FAILED"),
    walkIn: stops.filter(({ eligibility }) => eligibility === "WALK_IN").length,
    contactUnavailable: stops.filter(
      ({ eligibility }) => eligibility === "CONTACT_UNAVAILABLE",
    ).length,
  };
}

function countStatus(
  stops: readonly CountableStop[],
  status: ReservationStatus,
): number {
  return stops.filter((stop) => stop.status === status).length;
}

function validDate(value: string): boolean {
  if (!DATE_PATTERN.test(value)) return false;
  const [year, month, day] = value.split("-").map(Number);
  const date = new Date(Date.UTC(year, month - 1, day));
  return (
    date.getUTCFullYear() === year &&
    date.getUTCMonth() === month - 1 &&
    date.getUTCDate() === day
  );
}

function requireUnique(
  values: string[],
  label: string,
  context: z.RefinementCtx,
): void {
  if (new Set(values).size === values.length) return;
  context.addIssue({
    code: "custom",
    message: `Reservation ${label} must be unique`,
  });
}
