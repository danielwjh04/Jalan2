import type { AddressInfo } from 'node:net';
import { afterEach, describe, expect, it } from 'vitest';
import { createApp } from '../src/app';
import { createMockProvider } from '../src/adapters/messaging/mock';
import { createFixtureRetrieval } from '../src/adapters/retrieval/fixture';
import { createOfflineRouting } from '../src/adapters/routing/offline';
import { createCachedTts } from '../src/adapters/tts/cached';
import type { PlacesProvider } from '../src/adapters/places/types';
import { loadConfig } from '../src/config';

const servers: ReturnType<ReturnType<typeof createApp>['listen']>[] = [];

afterEach(async () => {
  await Promise.all(servers.splice(0).map((server) => new Promise<void>((resolve, reject) => {
    server.close((error) => error ? reject(error) : resolve());
  })));
});

function context(places: PlacesProvider): Parameters<typeof createApp>[0] {
  const config = loadConfig({ PIPELINE_MODE: 'cached' });
  const retrieval = createFixtureRetrieval();
  return {
    config,
    messaging: createMockProvider(0, () => {}),
    tts: createCachedTts(),
    retrieval,
    routing: createOfflineRouting(),
    places,
    foodImages: { name: 'wikimedia', findDishPhoto: async () => null },
    pipeline: {
      config,
      extractor: {
        name: 'fixture',
        extract: async () => ({
          fixtureSlug: null,
          videoPath: null,
          audioPath: null,
          coverPath: null,
          coverCandidates: [],
          caption: null,
        }),
      },
      stt: null,
      openai: null,
      retrieval,
      places,
    },
  };
}

async function start(places: PlacesProvider): Promise<string> {
  const server = createApp(context(places)).listen(0);
  servers.push(server);
  await new Promise<void>((resolve) => server.once('listening', resolve));
  const address = server.address() as AddressInfo;
  return `http://127.0.0.1:${address.port}`;
}

describe('place photo route', () => {
  it('returns no-store image bytes from the configured provider', async () => {
    const places: PlacesProvider = {
      name: 'google',
      search: async () => [],
      photo: async () => ({ bytes: Uint8Array.from([4, 5, 6]), contentType: 'image/jpeg' }),
    };
    const baseUrl = await start(places);

    const response = await fetch(`${baseUrl}/places/place-1/photo`);

    expect(response.status).toBe(200);
    expect(response.headers.get('cache-control')).toBe('no-store');
    expect(response.headers.get('content-type')).toContain('image/jpeg');
    expect(Array.from(new Uint8Array(await response.arrayBuffer()))).toEqual([4, 5, 6]);
  });

  it('returns 404 when a place has no photo', async () => {
    const places: PlacesProvider = {
      name: 'offline',
      search: async () => [],
      photo: async () => null,
    };
    const baseUrl = await start(places);

    const response = await fetch(`${baseUrl}/places/missing/photo`);

    expect(response.status).toBe(404);
  });
});
