import { describe, expect, it } from 'vitest';
import type { MenuJsonWire } from '@shared/menu';
import { isDuplicate } from '../src/pipeline/menuDedup';
import { groundMalaysianDish, mapPanelBoxToSource } from '../src/pipeline/menuVision';

type WireDish = MenuJsonWire['dishes'][number];

function dish(nameLocal: string, nameEnglish: string, query: string): WireDish {
  return {
    name_local: nameLocal,
    source_bbox: { x_min: 100, y_min: 100, x_max: 400, y_max: 180 },
    name_english: nameEnglish,
    image_search_query: query,
    reading_confidence: 'high',
    taste_profile: 'Typical taste profile.',
    texture_profile: 'Typical texture profile.',
    spice_level: 'unknown',
    price_myr: null,
    order_phrase: 'Satu, please.',
    allergens: [],
  };
}

describe('menu panel deduplication', () => {
  it('merges translation-only repeats from an overlapping crop', () => {
    expect(isDuplicate(
      dish('伊面 Yee Mee', 'fried egg noodles in soup', 'Malaysian yee mee'),
      dish('Yee Mee', 'egg noodles yee mee style', 'yee mee'),
    )).toBe(true);
  });

  it('keeps a named wet-style variation separate', () => {
    expect(isDuplicate(
      dish('伊面 Yee Mee', 'fried egg noodles in soup', 'Malaysian yee mee'),
      dish('Yee Mee Basah', 'wet egg noodles', 'yee mee basah'),
    )).toBe(false);
  });

  it('keeps 阿伊面 Yee Mee Basah separate from ordinary 伊面', () => {
    expect(isDuplicate(
      dish('伊面 Yee Mee', 'fried egg noodles in soup', 'Malaysian yee mee'),
      dish('阿伊面 / Yee Mee Basah', 'wet-style fried egg noodles', 'Malaysian yee mee basah'),
    )).toBe(false);
  });

  it('removes a partial Chinese suffix copied from the next column', () => {
    expect(isDuplicate(
      dish('炒米粉', 'fried rice vermicelli', 'fried bee hoon'),
      dish('米粉 Mi Fun', 'rice vermicelli', 'rice vermicelli'),
    )).toBe(true);
  });

  it('merges a one-character OCR variant of the same Chinese row', () => {
    expect(isDuplicate(
      dish('面粉糕', 'pan mee', 'pan mee'),
      dish('面粉粿', 'hand-torn flour noodles', 'mee hoon kueh'),
    )).toBe(true);
  });

  it('merges an isolated handwritten translation by specific dish meaning', () => {
    expect(isDuplicate(
      dish('鸡脚面', 'Chicken feet noodles', 'chicken feet noodles'),
      dish('Mi Kaki Ayam', 'chicken feet noodles', 'mi kaki ayam'),
    )).toBe(true);
  });
});

describe('Malaysian dish identity grounding', () => {
  it('grounds 手工面 as ban mian-style handmade noodles, not yee mee', () => {
    const grounded = groundMalaysianDish(dish(
      '手工面 / Mi Sup',
      'Handmade noodles',
      'Malaysian noodles',
    ));

    expect(grounded.name_english).toContain('ban mian-style');
    expect(grounded.image_search_query).toContain('handmade wheat noodles');
    expect(grounded.image_search_query).not.toContain('yee mee');
  });

  it('grounds 伊面 as pre-fried yee mee', () => {
    const grounded = groundMalaysianDish(dish(
      '伊面 / Yee Mee',
      'Noodles',
      'noodles',
    ));

    expect(grounded.name_english).toContain('yee mee');
    expect(grounded.image_search_query).toContain('fried egg noodle');
  });

  it('keeps Kuala Lumpur Hokkien mee separate from Penang prawn mee', () => {
    const kl = groundMalaysianDish(dish(
      '福建面',
      'Dark soy wok-fried noodles',
      'Hokkien mee',
    ));
    const penang = groundMalaysianDish(dish(
      '福建面 / Hokkien Mee',
      'Prawn noodle soup',
      'Hokkien mee',
    ));

    expect(kl.image_search_query).toBe('Kuala Lumpur dark soy Hokkien mee');
    expect(penang.image_search_query).toBe('Penang Malaysian Hokkien prawn mee soup');
  });

  it('marks region-unspecified Hokkien mee uncertain instead of guessing', () => {
    const grounded = groundMalaysianDish(dish('福建面', 'Hokkien noodles', 'Hokkien mee'));

    expect(grounded.reading_confidence).toBe('low');
    expect(grounded.image_search_query).toContain('regional style uncertain');
  });
});

describe('menu row localization', () => {
  it('maps a cropped panel box back onto the original 0..999 board', () => {
    expect(mapPanelBoxToSource(
      { x_min: 0, y_min: 0, x_max: 999, y_max: 999 },
      { left: 400, top: 200, width: 300, height: 400 },
      1000,
      1000,
    )).toEqual({ x_min: 400, y_min: 200, x_max: 699, y_max: 599 });
  });
});
