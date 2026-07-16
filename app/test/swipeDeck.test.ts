import { readFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';

const directory = dirname(fileURLToPath(import.meta.url));
const source = readFileSync(resolve(directory, '../src/components/SwipeDeck.tsx'), 'utf8');

describe('SwipeDeck', () => {
  it('supports both gestures and explicit left-right controls', () => {
    expect(source).toContain('Gesture.Pan()');
    expect(source).toContain('accessibilityLabel={props.label}');
    expect(source).toContain('label="Skip dish"');
    expect(source).toContain('label="Save dish"');
    expect(source).toContain('Right to save');
  });
});
