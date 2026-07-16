import { z } from 'zod';

export const SmartPlanRequestSchema = z.object({
  origin: z.string().trim().min(2).max(100),
  destination: z.string().trim().min(2).max(100),
  return_to_origin: z.boolean().default(true),
  end_destination: z.string().trim().min(2).max(100).nullable().default(null),
  start_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).nullable().default(null),
  days: z.number().int().min(1).max(14).default(3),
  travelers: z.number().int().min(1).max(20).default(2),
  budget_myr: z.number().nonnegative().nullable().default(null),
  interests: z.array(z.string().trim().min(2).max(60)).min(1).max(6),
  pace: z.enum(['relaxed', 'balanced', 'packed']).default('balanced'),
}).superRefine((request, context) => {
  if (!request.return_to_origin && !request.end_destination) {
    context.addIssue({
      code: 'custom',
      path: ['end_destination'],
      message: 'Set where the trip ends when you are not returning to the starting point',
    });
  }
});

export type SmartPlanRequest = z.infer<typeof SmartPlanRequestSchema>;

export const PlanningAgentReportSchema = z.object({
  id: z.enum(['grounding', 'mobility', 'discovery', 'schedule', 'stay', 'booking', 'critic']),
  label: z.string().min(1),
  status: z.enum(['ready', 'limited', 'blocked']),
  summary: z.string().min(1),
  evidence: z.array(z.string().min(1)),
});

export const PlanningDaySchema = z.object({
  day: z.number().int().positive(),
  stop_ids: z.array(z.string().min(1)),
  estimated_minutes: z.number().int().nonnegative(),
});

export const PlanningLegSchema = z.object({
  id: z.string().min(1),
  from_stop_id: z.string().min(1),
  to_stop_id: z.string().min(1),
  mode: z.enum(['walk', 'drive', 'coach', 'train', 'ferry', 'flight', 'ride_hail', 'operator_pickup', 'multimodal']),
  provider: z.enum(['google_routes', 'easybook', 'ktmb', 'grab', 'operator', 'offline', 'unknown']),
  duration_minutes: z.number().int().positive(),
  distance_meters: z.number().nonnegative().nullable(),
  evidence: z.enum(['provider_verified', 'estimated', 'needs_confirmation']),
  booking: z.enum(['none', 'external_search', 'operator_request']),
  handoff_url: z.string().url().nullable(),
  explanation: z.string().min(1),
});

export const PlanningCheckSchema = z.object({
  severity: z.enum(['info', 'warning', 'blocking']),
  message: z.string().min(1),
  resolution: z.string().min(1),
});

export const PlanningHandoffSchema = z.object({
  provider: z.string().min(1),
  kind: z.enum(['transport', 'stay', 'operator', 'directions']),
  status: z.enum(['external_search', 'arrange_directly', 'grounded']),
  label: z.string().min(1),
  url: z.string().url().nullable(),
  disclaimer: z.string().min(1),
});

export const PlanningStaySchema = z.object({
  destination: z.string().min(1),
  check_in: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).nullable(),
  check_out: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).nullable(),
  nights: z.number().int().positive(),
  travelers: z.number().int().positive(),
  rooms: z.number().int().positive(),
  url: z.string().url(),
});

export const PlanningCritiqueSchema = z.object({
  verdict: z.enum(['ready', 'check_needed', 'rework']),
  score: z.number().int().min(0).max(100),
  summary: z.string().min(1),
  evaluated_by: z.enum(['deterministic', 'ai']),
});

export const SmartPlanningMetadataSchema = z.object({
  request: SmartPlanRequestSchema,
  agents: z.array(PlanningAgentReportSchema).min(6).max(7),
  legs: z.array(PlanningLegSchema).min(1),
  days: z.array(PlanningDaySchema).min(1),
  checks: z.array(PlanningCheckSchema),
  handoffs: z.array(PlanningHandoffSchema),
  hotel_search_url: z.string().url().nullable(),
  stay: PlanningStaySchema.nullable().default(null),
  critique: PlanningCritiqueSchema.nullable().default(null),
  recommended_days: z.number().int().positive(),
  estimated_total_minutes: z.number().int().nonnegative(),
});

export type SmartPlanningMetadata = z.infer<typeof SmartPlanningMetadataSchema>;
