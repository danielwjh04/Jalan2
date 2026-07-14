import { describe, expect, it } from 'vitest';
import { DEFAULT_TRIP_PREFERENCES, type TripStop } from '@shared/trip';
import { fitBudget, orderWithConstraints, scheduleFor } from '../src/services/routeConstraints';

function stop(id: string, spend: number, open = 0, close = 1440): TripStop {
  return {
    id,
    name: id,
    summary: id,
    location: { lat: 1, lng: 110 },
    image_url: null,
    place_photo_available: false,
    place_photo_attributions: [],
    image_attributions: [],
    estimated_spend_myr: spend,
    duration_minutes: 60,
    sources: [{ title: id, url: `https://example.com/${id}` }],
    opening_window: { open_minute: open, close_minute: close },
  };
}

describe('trip constraints', () => {
  it('drops the most expensive optional stop to meet budget', () => {
    const preferences = { ...DEFAULT_TRIP_PREFERENCES, budget_myr: 50, start_stop_id: 'a' };
    const result = fitBudget([stop('a', 10), stop('b', 80), stop('c', 20)], preferences);
    expect(result.stops.map((item) => item.id)).toEqual(['a', 'c']);
    expect(result.warnings[0]).toMatch(/Removed 1/);
  });

  it('prioritizes a closing-soon stop and keeps the requested end last', () => {
    const stops = [stop('a', 0), stop('late', 0), stop('soon', 0, 0, 700), stop('end', 0)];
    const preferences = {
      ...DEFAULT_TRIP_PREFERENCES,
      day_start_minute: 540,
      start_stop_id: 'a',
      end_stop_id: 'end',
    };
    const travel = () => 20;
    const ordered = orderWithConstraints(stops, preferences, travel);
    expect(ordered.map((item) => item.id)).toEqual(['a', 'soon', 'late', 'end']);
    expect(scheduleFor(ordered, preferences, travel).schedule).toHaveLength(4);
  });
});
