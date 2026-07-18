import { readFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';

const directory = dirname(fileURLToPath(import.meta.url));
const read = (file: string): string => readFileSync(resolve(directory, `../src/${file}`), 'utf8');

describe('menu photo demo', () => {
  it('is reachable from home and shows the scanned board', () => {
    expect(read('components/MenuHowItWorks.tsx')).toContain('onDemo');
    expect(read('lib/menu.ts')).toContain("source === 'demo'");
    expect(read('app/(tabs)/menu/[id].tsx')).toContain('SCANNED MENU');
    expect(read('app/(tabs)/menu/[id].tsx')).toContain('sourceImageUrl');
    expect(read('components/MenuPointingGuide.tsx')).toContain('POINT TO THIS ON THE MENU');
    expect(read('components/MenuPointingGuide.tsx')).toContain('dish.source_bbox');
    expect(read('components/MenuOrderSpeaker.tsx')).toContain('SAY MY ORDER');
    expect(read('components/MenuOrderSpeaker.tsx')).toContain('Cantonese');
    expect(read('components/MenuOrderSpeaker.tsx')).toContain('Mandarin');
    expect(read('components/MenuOrderSpeaker.tsx')).toContain('getMenuOrderAudio');
    expect(read('lib/menu.ts')).toContain("createMenuScanSession({ mode: 'demo' })");
    expect(read('app/menu-scan.tsx')).toContain('postMenuDemo()');
    expect(read('app/menu-scan.tsx')).toContain('AgentProgress');
  });

  it('keeps the sample menu inside the optional how-it-works tutorial', () => {
    expect(read('components/CoreProductFlows.tsx')).toContain('KOPITIAM FOOD RECOGNITION');
    expect(read('components/CoreProductFlows.tsx')).toContain('MenuHowItWorks');
    expect(read('components/CoreProductFlows.tsx')).not.toContain('Try the 22-dish demo');
    expect(read('components/MenuHowItWorks.tsx')).toContain('Try sample menu');
    expect(read('app/(tabs)/index.tsx')).toContain('onMenuDemo={startMenuDemo}');
  });
});
