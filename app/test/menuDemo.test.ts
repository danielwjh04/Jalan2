import { readFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';

const directory = dirname(fileURLToPath(import.meta.url));
const read = (file: string): string => readFileSync(resolve(directory, `../src/${file}`), 'utf8');

describe('menu photo demo', () => {
  it('is reachable from home and shows the scanned board', () => {
    expect(read('lib/useHomeScreen.ts')).toContain('Try demo photo');
    expect(read('lib/menu.ts')).toContain("source === 'demo'");
    expect(read('app/(tabs)/menu/[id].tsx')).toContain('SCANNED MENU');
    expect(read('app/(tabs)/menu/[id].tsx')).toContain('sourceImageUrl');
  });

  it('exposes the menu demo as a direct home action', () => {
    expect(read('components/HomeSections.tsx')).toContain('Test the 22-dish menu demo');
    expect(read('app/(tabs)/index.tsx')).toContain('onMenuDemo={startMenuDemo}');
  });
});
