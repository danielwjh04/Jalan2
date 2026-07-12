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
      order_phrase: 'Kolo mee satu, bang.',
      allergens: ['gluten', 'egg'],
    },
  ],
};

describe('MenuJsonSchema', () => {
  it('accepts a fixture-shaped menu', () => {
    expect(MenuJsonSchema.safeParse(VALID_MENU).success).toBe(true);
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

  it('keeps wire and strict dish fields aligned, minus image_url', () => {
    const strictKeys = Object.keys(MenuJsonSchema.shape.dishes.element.shape).sort();
    const wireKeys = Object.keys(MenuJsonWireSchema.shape.dishes.element.shape).sort();
    expect(strictKeys).toEqual([...wireKeys, 'image_url'].sort());
  });
});
