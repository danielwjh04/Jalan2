import { describe, expect, it } from 'vitest';
import type { MenuJsonWire } from '@shared/menu';
import { isDuplicate } from '../src/pipeline/menuDedup';

type WireDish = MenuJsonWire['dishes'][number];

function dish(nameLocal: string, nameEnglish: string, query: string): WireDish {
  return {
    name_local: nameLocal,
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
