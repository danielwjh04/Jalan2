import { describe, expect, it } from 'vitest';
import { MenuJsonSchema, MenuJsonWireSchema } from '../src/menu';

const VALID_MENU = {
  stall_name: 'Kopitiam demo board (Kuching)',
  dishes: [
    {
      name_local: 'Kolo mee',
      name_english: 'Springy egg noodles tossed in shallot oil',
      price_myr: 8,
      image_url: null,
      image_attributions: [{
        label: 'Photo by Lemmas123',
        source_url: 'https://commons.wikimedia.org/wiki/File:Sarawak_Kolo_Mee_Noodle_Dish.jpg',
        license: 'CC0 1.0',
      }],
      order_phrase: 'Kolo mee satu, bang.',
      allergens: ['gluten', 'egg'],
    },
  ],
};

describe('MenuJsonSchema', () => {
  it('accepts a fixture-shaped menu', () => {
    const parsed = MenuJsonSchema.safeParse(VALID_MENU);
    expect(parsed.success).toBe(true);
    if (!parsed.success) return;
    expect(parsed.data.dishes[0].image_attributions[0]?.license).toBe('CC0 1.0');
  });

  it('rejects a negative price', () => {
    const bad = {
      ...VALID_MENU,
      dishes: [{ ...VALID_MENU.dishes[0], price_myr: -3 }],
    };
    expect(MenuJsonSchema.safeParse(bad).success).toBe(false);
  });

  it('rejects an empty dish list', () => {
    expect(MenuJsonSchema.safeParse({ stall_name: null, dishes: [] }).success).toBe(false);
  });

  it('keeps wire and strict dish fields aligned, minus retrieved image fields', () => {
    const strictKeys = Object.keys(MenuJsonSchema.shape.dishes.element.shape).sort();
    const wireKeys = Object.keys(MenuJsonWireSchema.shape.dishes.element.shape).sort();
    expect(strictKeys).toEqual([...wireKeys, 'image_attributions', 'image_url'].sort());
  });

  it('rejects an invalid image attribution source URL', () => {
    const bad = {
      ...VALID_MENU,
      dishes: [{
        ...VALID_MENU.dishes[0],
        image_attributions: [{ label: 'Unknown', source_url: 'invalid', license: null }],
      }],
    };
    expect(MenuJsonSchema.safeParse(bad).success).toBe(false);
  });
});
