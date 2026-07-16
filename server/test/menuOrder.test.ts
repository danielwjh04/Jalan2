import { describe, expect, it } from 'vitest';
import type { Dish } from '@shared/menu';
import { menuOrderPhrase } from '../src/voice/menuOrder';

const dish: Dish = {
  name_local: '手工面',
  name_english: 'handmade ban mian-style noodles',
  reading_confidence: 'high',
  source_bbox: { x_min: 1, y_min: 2, x_max: 3, y_max: 4 },
  image_search_query: 'Malaysian handmade ban mian noodles',
  taste_profile: 'Savoury broth',
  texture_profile: 'Chewy noodles',
  spice_level: 'none',
  price_myr: 5,
  image_url: null,
  image_attributions: [],
  order_phrase: 'Bos, saya nak satu mi sup, ya.',
  allergens: ['gluten'],
};

describe('menu order phrases', () => {
  it('preserves the grounded Malay ordering phrase', () => {
    expect(menuOrderPhrase(dish, 'ms').textLocal).toBe(dish.order_phrase);
  });

  it('uses spoken Cantonese grammar and the exact printed dish name', () => {
    const phrase = menuOrderPhrase(dish, 'yue');
    expect(phrase.languageLabel).toContain('Cantonese');
    expect(phrase.textLocal).toContain('唔該');
    expect(phrase.textLocal).toContain(dish.name_local);
  });

  it('uses Mandarin grammar and the exact printed dish name', () => {
    const phrase = menuOrderPhrase(dish, 'zh');
    expect(phrase.languageLabel).toContain('Mandarin');
    expect(phrase.textLocal).toContain('我要一份');
    expect(phrase.textLocal).toContain(dish.name_local);
  });
});
