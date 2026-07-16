import { describe, expect, it, vi } from 'vitest';
import { DEFAULT_TRIP_PREFERENCES, type TripPlan, type TripStop } from '@shared/trip';
import { planImportedTrip } from '../src/planner/importedTripPlanner';
import { isTiomanPlace, orderTiomanStops, planTiomanTransfer, tiomanAwareRoute, tiomanZone } from '../src/planner/tiomanMobility';
import { loadDiscoveryTrip } from '../src/lib/discoveries';

const source = { title: 'Tioman source', url: 'https://tioman.gov.my/pengangkutan/' };
function stop(id: string, name: string, lat: number, lng: number): TripStop {
  return { id, name, summary: name, location: { lat, lng }, image_url: null, place_photo_available: false, place_photo_attributions: [], image_attributions: [], estimated_spend_myr: null, duration_minutes: 60, sources: [source] };
}

const tekek = stop('tekek', 'Tekek reef dive', 2.8184, 104.1606);
const bunut = stop('bunut', 'Bunut Beach ATV trail', 2.796, 104.145);
const asah = stop('asah', 'Asah Waterfall', 2.716, 104.138);

describe('Tioman mobility intelligence', () => {
  it('does not mistake the mainland ferry handoff for an island activity', () => {
    const mersing = stop('mersing', 'Mersing ferry to Tioman', 2.4319, 103.8387);
    expect(isTiomanPlace(mersing)).toBe(false);
    expect(tiomanZone(tekek)).toBe('tekek_corridor');
    expect(tiomanZone(bunut)).toBe('tekek_corridor');
    expect(tiomanZone(asah)).toBe('mukut_asah_south');
  });

  it('keeps same-corridor activities together before changing coast', () => {
    expect(orderTiomanStops([tekek, asah, bunut]).map(({ id }) => id)).toEqual(['tekek', 'bunut', 'asah']);
    expect(tiomanAwareRoute([tekek, asah, bunut])?.warnings).toEqual(expect.arrayContaining([expect.stringContaining('2 Tioman mobility zones')]));
  });

  it('uses a local corridor transfer within Tekek and a blocking sea taxi to Asah', () => {
    const local = planTiomanTransfer(tekek, bunut);
    const crossCoast = planTiomanTransfer(bunut, asah);
    expect(local?.leg).toEqual(expect.objectContaining({ mode: 'operator_pickup', evidence: 'estimated' }));
    expect(local?.leg.explanation).toContain('no cross-village water taxi');
    expect(crossCoast?.leg).toEqual(expect.objectContaining({ mode: 'ferry', evidence: 'needs_confirmation' }));
    expect(crossCoast?.leg.explanation).toContain('fare');
  });

  it('bypasses Google DRIVE and makes a cross-zone plan fail the critic until confirmed', async () => {
    const optimize = vi.fn(async () => { throw new Error('Google DRIVE must not be called for Tioman'); });
    const trip: TripPlan = {
      id: 'tioman-source', title: 'Tioman', summary: null, region: 'Pulau Tioman, Pahang', source_creator: 'source',
      source_url: source.url, cover_url: null, demo: false, origin: 'video', source_discovery_id: null,
      stops: [tekek, asah, bunut], selected_stop_ids: ['tekek', 'asah', 'bunut'], preferences: DEFAULT_TRIP_PREFERENCES,
      route: null, planning: null,
    };
    const planned = await planImportedTrip(trip, { name: 'google', optimize });
    expect(optimize).not.toHaveBeenCalled();
    expect(planned.selected_stop_ids).toEqual(['tekek', 'bunut', 'asah']);
    expect(planned.planning?.legs.some((leg) => leg.mode === 'ferry')).toBe(true);
    expect(planned.planning?.checks.some((check) => check.message.includes('sea taxi'))).toBe(true);
    expect(planned.planning?.critique?.verdict).toBe('rework');
  });

  it('keeps the prepared EasyBook arrival multimodal and the default island day water-taxi free', async () => {
    const discovery = loadDiscoveryTrip('kl-tioman-easybook-adventure');
    if (!discovery) throw new Error('Missing Tioman discovery');
    const selected = discovery.stops.filter((item) => discovery.selected_stop_ids.includes(item.id));
    const planned = await planImportedTrip({ ...discovery, stops: selected }, {
      name: 'google', optimize: async () => { throw new Error('No Google DRIVE on Tioman'); },
    });

    expect(planned.planning?.legs[0]).toEqual(expect.objectContaining({ mode: 'multimodal', provider: 'easybook' }));
    expect(planned.planning?.legs.some((leg) => leg.mode === 'ferry')).toBe(false);
    expect(planned.route?.warnings).toContain('Tioman activities are grouped by village corridor; the route is not treated as a continuous drive.');
  });
});
