import type OpenAI from 'openai';
import { z } from 'zod';
import { zodResponseFormat } from 'openai/helpers/zod';
import type { SmartPlanRequest } from '@shared/planner';
import type { TripStop } from '@shared/trip';
import type { PlanningCheck, PlanningCritique, PlanningDay, PlanningLeg } from './types';

const CriticOutputSchema = z.object({
  score: z.number().int().min(0).max(100),
  summary: z.string().min(1).max(500),
  additional_checks: z.array(z.object({
    severity: z.enum(['info', 'warning', 'blocking']),
    message: z.string().min(1).max(300),
    resolution: z.string().min(1).max(300),
  })).max(5),
});

export interface CriticInput {
  request: SmartPlanRequest;
  stops: TripStop[];
  legs: PlanningLeg[];
  days: PlanningDay[];
  checks: PlanningCheck[];
}

export type PlanCritic = (input: CriticInput) => Promise<z.infer<typeof CriticOutputSchema>>;

export function createOpenAIPlanCritic(client: OpenAI, model: string): PlanCritic {
  return async (input) => {
    const completion = await client.beta.chat.completions.parse({
      model,
      messages: [
        { role: 'system', content: criticPrompt() },
        { role: 'user', content: JSON.stringify(input) },
      ],
      response_format: zodResponseFormat(CriticOutputSchema, 'plan_critique'),
    });
    const parsed = completion.choices[0]?.message.parsed;
    if (!parsed) throw new Error('Plan critic returned no structured result');
    return parsed;
  };
}

export async function runPlanCritic(
  input: CriticInput,
  critic?: PlanCritic,
): Promise<{ checks: PlanningCheck[]; critique: PlanningCritique }> {
  if (!critic) return deterministicResult(input.checks, input.legs);
  try {
    const result = await critic(input);
    const checks = dedupeChecks([...input.checks, ...result.additional_checks]);
    const score = capScoreForChecks(result.score, checks);
    return { checks, critique: { verdict: verdictFor(checks), score, summary: result.summary, evaluated_by: 'ai' } };
  } catch (error) {
    console.warn(`[planner critic] AI evaluation failed: ${(error as Error).message}`);
    return deterministicResult(input.checks, input.legs);
  }
}

function capScoreForChecks(score: number, checks: PlanningCheck[]): number {
  if (checks.some((check) => check.severity === 'blocking')) return Math.min(score, 60);
  if (checks.some((check) => check.severity === 'warning')) return Math.min(score, 84);
  return score;
}

function deterministicResult(checks: PlanningCheck[], legs: PlanningLeg[]): { checks: PlanningCheck[]; critique: PlanningCritique } {
  const blocking = checks.filter((check) => check.severity === 'blocking').length;
  const warnings = checks.filter((check) => check.severity === 'warning').length;
  const estimated = legs.filter((leg) => leg.evidence === 'estimated').length;
  const score = Math.max(0, 100 - blocking * 25 - warnings * 12 - Math.min(estimated * 4, 20));
  const summary = blocking
    ? `${blocking} critical handoff${blocking === 1 ? '' : 's'} must be confirmed before relying on this plan.`
    : warnings ? 'The route is connected, but timing or provider evidence still needs review.'
      : 'The route is connected and fits the stated daily limits; live availability still belongs to each provider.';
  return { checks, critique: { verdict: verdictFor(checks), score, summary, evaluated_by: 'deterministic' } };
}

function verdictFor(checks: PlanningCheck[]): PlanningCritique['verdict'] {
  if (checks.some((check) => check.severity === 'blocking')) return 'rework';
  return checks.some((check) => check.severity === 'warning') ? 'check_needed' : 'ready';
}

function dedupeChecks(checks: PlanningCheck[]): PlanningCheck[] {
  const seen = new Set<string>();
  return checks.filter((check) => {
    const key = check.message.trim().toLowerCase();
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

function criticPrompt(): string {
  return [
    'You are Jalan2 end-to-end plan critic. Evaluate only the supplied structured plan.',
    'Check transport continuity, daily load, overnight placement, provider confirmation gaps, island village changes, and whether every stop is reachable in sequence.',
    'Reject duplicate or ungrounded map pins. A source-only coordinate is evidence from the post, not a verified Google place.',
    'Check mode plausibility against leg distance: short urban legs may be walked, normal local legs may use ride-hail, and long or cross-region legs need a real intercity handoff.',
    'A Google route proves geographic connectivity only. It does not prove Grab availability, a train or bus departure, opening hours, or operator pickup.',
    'Check that the journey has an explicit starting point and final endpoint. If return_to_origin is true, the final leg must return to the origin; otherwise it must finish at end_destination.',
    'KTMB and EasyBook handoffs are ticket searches, not confirmed departures. Do not treat a provider link as a purchased ticket.',
    'On Tioman, never treat straight-line proximity as a road. A cross-village water taxi or Tekek–Juara 4WD leg must be explicit and provider-confirmed.',
    'Do not invent routes, fares, opening hours, safety claims, availability, operators, or facts absent from the input.',
    'Treat estimated and needs-confirmation legs honestly. A plan with a missing critical transfer cannot score above 60.',
    'Return concise, actionable checks. Do not repeat checks already present.',
  ].join(' ');
}
