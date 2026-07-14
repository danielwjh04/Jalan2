import { readFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';

const directory = dirname(fileURLToPath(import.meta.url));
const tripCard = readFileSync(resolve(directory, '../src/components/TripStopCard.tsx'), 'utf8');
const search = readFileSync(resolve(directory, '../src/components/DestinationSearch.tsx'), 'utf8');

describe('place cards', () => {
  it('labels destination guidance and uses the shared place image', () => {
    expect(tripCard).toContain('<PlaceImage');
    expect(tripCard).toContain('What to do');
  });

  it('shows a photo and activity suggestion in Google search results', () => {
    expect(search).toContain('<PlaceImage');
    expect(search).toContain('place.suggested_activity');
  });
});
