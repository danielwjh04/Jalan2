import { readFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';

const directory = dirname(fileURLToPath(import.meta.url));
const source = readFileSync(resolve(directory, '../src/components/DishCard.tsx'), 'utf8');

describe('DishCard', () => {
  it('renders the license credit for a dish photo', () => {
    expect(source).toContain('<ImageAttribution items={dish.image_attributions}');
  });

  it('turns a menu item into a sensory food card', () => {
    expect(source).toContain('HOW IT USUALLY TASTES');
    expect(source).toContain('dish.taste_profile');
    expect(source).toContain('dish.texture_profile');
    expect(source).toContain('dish.spice_level');
    expect(source).toContain('mediaUrl(dish.image_url)');
  });
});
