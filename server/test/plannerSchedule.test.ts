import { describe, expect, it } from 'vitest';
import type { SmartPlanRequest } from '@shared/planner';
import type { TripStop } from '@shared/trip';
import { buildDayPlan } from '../src/planner/plannerSchedule';

describe('planner schedule accounting', () => {
  it('counts the first visit and every transfer when splitting days', () => {
    const stops = [briefStop('a'), briefStop('b')];
    const request: SmartPlanRequest = {
      origin: 'A', destination: 'B', return_to_origin: false, end_destination: 'B',
      start_date: null, days: 1, travelers: 2, budget_myr: null,
      interests: ['source recommendations'], pace: 'balanced',
    };
    const plan = buildDayPlan(request, stops, [{
      id: 'a-b', from_stop_id: 'a', to_stop_id: 'b', mode: 'drive', provider: 'offline',
      duration_minutes: 100, distance_meters: 20_000, evidence: 'estimated', booking: 'none',
      handoff_url: null, explanation: 'Estimate',
    }]);

    expect(plan.days).toEqual([
      { day: 1, stop_ids: ['a'], estimated_minutes: 300 },
      { day: 2, stop_ids: ['b'], estimated_minutes: 400 },
    ]);
  });

  it('flags a venue that is closed on the dated itinerary weekday', () => {
    const stops = [
      { ...briefStop('a'), duration_minutes: 60 },
      { ...briefStop('b'), duration_minutes: 60, opening_periods: [{ day: 2, open_minute: 540, close_minute: 1020 }] },
    ];
    const request: SmartPlanRequest = {
      origin: 'A', destination: 'B', return_to_origin: false, end_destination: 'B',
      start_date: '2026-08-10', days: 1, travelers: 2, budget_myr: null,
      interests: ['source recommendations'], pace: 'packed',
    };
    const plan = buildDayPlan(request, stops, [{
      id: 'a-b', from_stop_id: 'a', to_stop_id: 'b', mode: 'drive', provider: 'offline',
      duration_minutes: 20, distance_meters: 5_000, evidence: 'estimated', booking: 'none',
      handoff_url: null, explanation: 'Estimate',
    }]);

    expect(plan.checks).toContainEqual(expect.objectContaining({
      severity: 'blocking', message: expect.stringContaining('closed on day 1 (Monday)'),
    }));
  });
});

function briefStop(id: string): TripStop {
  return {
    id, name: id.toUpperCase(), summary: 'Visit', location: { lat: 3, lng: 101 }, image_url: null,
    estimated_spend_myr: null, duration_minutes: 300, sources: [{ title: 'Post', url: 'https://example.com' }],
    place_id: `google-${id}`, address: `${id}, Malaysia`, google_maps_url: null,
    opening_window: null, primary_type: null, reservation_hint: null,
    place_photo_available: false, place_photo_attributions: [], image_attributions: [],
  };
}
