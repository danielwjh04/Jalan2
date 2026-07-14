import { afterEach, describe, expect, it, vi } from 'vitest';
import {
  createWikimediaPlaceImages,
  parseWikimediaDishPhoto,
} from '../src/adapters/foodImages/wikimedia';

afterEach(() => {
  vi.unstubAllGlobals();
});

const LICENSED_RESPONSE = {
  query: {
    pages: {
      '123': {
        title: 'File:Sarawak Kolo Mee Noodle Dish.jpg',
        imageinfo: [{
          url: 'https://upload.wikimedia.org/original.jpg',
          thumburl: 'https://upload.wikimedia.org/1200px-kolo-mee.jpg',
          descriptionurl: 'https://commons.wikimedia.org/wiki/File:Sarawak_Kolo_Mee_Noodle_Dish.jpg',
          width: 2240,
          height: 4608,
          user: 'Lemmas123',
          extmetadata: {
            Artist: { value: '<a href="/wiki/User:Lemmas123">Lemmas123</a>' },
            LicenseShortName: { value: 'CC0 1.0' },
            LicenseUrl: { value: 'https://creativecommons.org/publicdomain/zero/1.0/' },
          },
        }],
      },
    },
  },
};

describe('parseWikimediaDishPhoto', () => {
  it('returns the high-resolution thumbnail with author and license credit', () => {
    expect(parseWikimediaDishPhoto(LICENSED_RESPONSE)).toEqual({
      imageUrl: 'https://upload.wikimedia.org/1200px-kolo-mee.jpg',
      imageAttributions: [{
        label: 'Photo by Lemmas123',
        source_url: 'https://commons.wikimedia.org/wiki/File:Sarawak_Kolo_Mee_Noodle_Dish.jpg',
        license: 'CC0 1.0',
      }],
    });
  });

  it('rejects a result without explicit license metadata', () => {
    const licensedInfo = LICENSED_RESPONSE.query.pages['123'].imageinfo[0];
    const unlicensed = {
      query: {
        pages: {
          '123': {
            imageinfo: [{
              ...licensedInfo,
              extmetadata: {
                Artist: licensedInfo.extmetadata.Artist,
                LicenseUrl: licensedInfo.extmetadata.LicenseUrl,
              },
            }],
          },
        },
      },
    };
    expect(parseWikimediaDishPhoto(unlicensed)).toBeNull();
  });

  it('searches place names broadly enough to bridge provider naming differences', async () => {
    const fetchMock = vi.fn(async (_input: string | URL | Request) => (
      new Response(JSON.stringify(LICENSED_RESPONSE))
    ));
    vi.stubGlobal('fetch', fetchMock);

    await createWikimediaPlaceImages().findPlacePhoto(
      'KSL City Mall',
      'Johor Bahru, Johor Darul Ta\'zim',
    );

    const url = new URL(String(fetchMock.mock.calls[0][0]));
    expect(url.searchParams.get('gsrsearch')).toBe(
      'KSL City Mall Malaysia filetype:bitmap',
    );
  });
});
